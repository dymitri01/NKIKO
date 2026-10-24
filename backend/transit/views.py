from django.http import FileResponse
from rest_framework import serializers, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Chargement,
    Colis,
    CompteUtilisateur,
    Contrat,
    LettreVoiture,
    Marchandise,
    MoyenTransport,
    Tiers,
)
from .permissions import EstAdministrateur, EstAdministrateurOuChefDepot
from .serializers import (
    ChargementSerializer,
    ColisSerializer,
    CompteUtilisateurSerializer,
    ContratSerializer,
    LettreVoitureSerializer,
    MarchandiseSerializer,
    MoyenTransportSerializer,
    TiersSerializer,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def moi(request):
    compte = getattr(request.user, "compte_utilisateur", None)
    return Response(
        {
            "username": request.user.username,
            "role": compte.role if compte else None,
            "role_display": compte.get_role_display() if compte else None,
            "is_superuser": request.user.is_superuser,
        }
    )


class TiersViewSet(viewsets.ModelViewSet):
    queryset = Tiers.objects.all()
    serializer_class = TiersSerializer


class CompteUtilisateurViewSet(viewsets.ModelViewSet):
    queryset = CompteUtilisateur.objects.select_related("user").all()
    serializer_class = CompteUtilisateurSerializer
    permission_classes = [EstAdministrateur]


class MarchandiseViewSet(viewsets.ModelViewSet):
    queryset = Marchandise.objects.all()
    serializer_class = MarchandiseSerializer


class MoyenTransportViewSet(viewsets.ModelViewSet):
    queryset = MoyenTransport.objects.all()
    serializer_class = MoyenTransportSerializer


class ContratViewSet(viewsets.ModelViewSet):
    queryset = Contrat.objects.select_related("client", "marchandise").all()
    serializer_class = ContratSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        client_id = self.request.query_params.get("client")
        statut = self.request.query_params.get("statut")
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if statut:
            queryset = queryset.filter(statut=statut)
        return queryset

    def get_permissions(self):
        if self.action in ("valider", "rejeter"):
            return [EstAdministrateurOuChefDepot()]
        return super().get_permissions()

    @action(detail=True, methods=["post"])
    def valider(self, request, pk=None):
        contrat = self.get_object()
        if contrat.statut != Contrat.Statut.EN_ATTENTE:
            return Response(
                {"detail": "Seul un contrat en attente peut être validé."},
                status=400,
            )
        contrat.statut = Contrat.Statut.ACTIF
        contrat.save(update_fields=["statut"])
        return Response(self.get_serializer(contrat).data)

    @action(detail=True, methods=["post"])
    def rejeter(self, request, pk=None):
        contrat = self.get_object()
        if contrat.statut != Contrat.Statut.EN_ATTENTE:
            return Response(
                {"detail": "Seul un contrat en attente peut être rejeté."},
                status=400,
            )
        return Response(self.get_serializer(contrat).data)


class LettreVoitureViewSet(viewsets.ModelViewSet):
    queryset = LettreVoiture.objects.select_related(
        "client", "chargeur", "transporteur"
    ).prefetch_related("colis").all()
    serializer_class = LettreVoitureSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        statut = self.request.query_params.get("statut")
        if statut:
            queryset = queryset.filter(statut=statut)
        return queryset

    def get_permissions(self):
        if self.action in ("autoriser_modification", "refuser_modification"):
            return [EstAdministrateurOuChefDepot()]
        return super().get_permissions()

    def perform_destroy(self, instance):
        if instance.statut != LettreVoiture.Statut.EN_ATTENTE:
            raise serializers.ValidationError(
                "Seule une réception en attente peut être supprimée."
            )
        instance.delete()

    @action(detail=True, methods=["post"])
    def cloturer(self, request, pk=None):
        lettre_voiture = self.get_object()
        try:
            lettre_voiture.cloturer()
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)
        return Response(self.get_serializer(lettre_voiture).data)

    @action(detail=True, methods=["post"])
    def demander_modification(self, request, pk=None):
        lettre_voiture = self.get_object()
        if lettre_voiture.statut != LettreVoiture.Statut.CLOTURE:
            return Response(
                {"detail": "Seule une réception clôturée peut faire l'objet d'une demande de modification."},
                status=400,
            )
        lettre_voiture.statut = LettreVoiture.Statut.EN_ATTENTE_APPROBATION
        lettre_voiture.save(update_fields=["statut"])
        return Response(self.get_serializer(lettre_voiture).data)

    @action(detail=True, methods=["post"])
    def autoriser_modification(self, request, pk=None):
        lettre_voiture = self.get_object()
        try:
            lettre_voiture.rouvrir()
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)
        return Response(self.get_serializer(lettre_voiture).data)

    @action(detail=True, methods=["post"])
    def refuser_modification(self, request, pk=None):
        lettre_voiture = self.get_object()
        if lettre_voiture.statut != LettreVoiture.Statut.EN_ATTENTE_APPROBATION:
            return Response(
                {"detail": "Seule une réception en attente d'approbation peut être refusée."},
                status=400,
            )
        lettre_voiture.statut = LettreVoiture.Statut.CLOTURE
        lettre_voiture.save(update_fields=["statut"])
        return Response(self.get_serializer(lettre_voiture).data)

    @action(detail=True, methods=["get"])
    def bordereau(self, request, pk=None):
        lettre_voiture = self.get_object()
        if not lettre_voiture.bordereau:
            return Response(
                {"detail": "Le bordereau n'a pas encore été généré pour cette réception."},
                status=404,
            )
        return FileResponse(
            lettre_voiture.bordereau.open("rb"),
            content_type="application/pdf",
            filename=f"{lettre_voiture.numero_lettre_voiture}.pdf",
        )


class ColisViewSet(viewsets.ModelViewSet):
    queryset = Colis.objects.select_related(
        "lettre_voiture", "contrat", "marchandise", "chargement"
    ).all()
    serializer_class = ColisSerializer

    def perform_destroy(self, instance):
        if instance.chargement_id and instance.chargement.statut != Chargement.Statut.EN_ATTENTE:
            raise serializers.ValidationError(
                "Impossible de supprimer une bille déjà chargée sur un "
                "chargement qui n'est plus en attente."
            )
        if instance.lettre_voiture.statut != LettreVoiture.Statut.EN_ATTENTE:
            raise serializers.ValidationError(
                "Impossible de supprimer une bille d'une réception qui n'est "
                "pas en attente."
            )
        instance.delete()


class ChargementViewSet(viewsets.ModelViewSet):
    queryset = Chargement.objects.select_related("moyen_transport").prefetch_related(
        "colis_charges"
    ).all()
    serializer_class = ChargementSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        statut = self.request.query_params.get("statut")
        if statut:
            queryset = queryset.filter(statut=statut)
        return queryset

    def get_permissions(self):
        if self.action in ("autoriser_modification", "refuser_modification"):
            return [EstAdministrateurOuChefDepot()]
        return super().get_permissions()

    def perform_destroy(self, instance):
        if instance.statut != Chargement.Statut.EN_ATTENTE:
            raise serializers.ValidationError(
                "Seul un chargement en attente peut être supprimé."
            )
        instance.delete()

    @action(detail=True, methods=["post"])
    def cloturer(self, request, pk=None):
        chargement = self.get_object()
        try:
            chargement.cloturer()
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)
        return Response(self.get_serializer(chargement).data)

    @action(detail=True, methods=["post"])
    def demander_modification(self, request, pk=None):
        chargement = self.get_object()
        if chargement.statut != Chargement.Statut.CLOTURE:
            return Response(
                {"detail": "Seul un chargement clôturé peut faire l'objet d'une demande de modification."},
                status=400,
            )
        chargement.statut = Chargement.Statut.EN_ATTENTE_APPROBATION
        chargement.save(update_fields=["statut"])
        return Response(self.get_serializer(chargement).data)

    @action(detail=True, methods=["post"])
    def autoriser_modification(self, request, pk=None):
        chargement = self.get_object()
        try:
            chargement.rouvrir()
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)
        return Response(self.get_serializer(chargement).data)

    @action(detail=True, methods=["post"])
    def refuser_modification(self, request, pk=None):
        chargement = self.get_object()
        if chargement.statut != Chargement.Statut.EN_ATTENTE_APPROBATION:
            return Response(
                {"detail": "Seul un chargement en attente d'approbation peut être refusé."},
                status=400,
            )
        chargement.statut = Chargement.Statut.CLOTURE
        chargement.save(update_fields=["statut"])
        return Response(self.get_serializer(chargement).data)

    @action(detail=True, methods=["get"])
    def bordereau(self, request, pk=None):
        chargement = self.get_object()
        if not chargement.bordereau:
            return Response(
                {"detail": "Le bordereau n'a pas encore été généré pour ce chargement."},
                status=404,
            )
        return FileResponse(
            chargement.bordereau.open("rb"),
            content_type="application/pdf",
            filename=f"{chargement.numero_dex}.pdf",
        )
