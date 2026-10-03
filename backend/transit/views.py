from django.http import FileResponse
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Colis,
    CompteUtilisateur,
    Contrat,
    LettreVoiture,
    Marchandise,
    MoyenTransport,
    Tiers,
)
from .serializers import (
    ColisSerializer,
    CompteUtilisateurSerializer,
    ContratSerializer,
    LettreVoitureSerializer,
    MarchandiseSerializer,
    MoyenTransportSerializer,
    TiersSerializer,
)


class TiersViewSet(viewsets.ModelViewSet):
    queryset = Tiers.objects.all()
    serializer_class = TiersSerializer


class CompteUtilisateurViewSet(viewsets.ModelViewSet):
    queryset = CompteUtilisateur.objects.select_related("user").all()
    serializer_class = CompteUtilisateurSerializer


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
    queryset = Colis.objects.select_related("lettre_voiture", "contrat", "marchandise").all()
    serializer_class = ColisSerializer

    def perform_destroy(self, instance):
        if instance.lettre_voiture.statut == LettreVoiture.Statut.CLOTURE:
            raise serializers.ValidationError(
                "Impossible de supprimer une bille d'une réception déjà clôturée."
            )
        instance.delete()
