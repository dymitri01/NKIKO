from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import CompteUtilisateur, Contrat, Marchandise, MoyenTransport, Tiers
from .serializers import (
    CompteUtilisateurSerializer,
    ContratSerializer,
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
