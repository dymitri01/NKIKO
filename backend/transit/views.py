from rest_framework import viewsets

from .models import CompteUtilisateur, Tiers
from .serializers import CompteUtilisateurSerializer, TiersSerializer


class TiersViewSet(viewsets.ModelViewSet):
    queryset = Tiers.objects.all()
    serializer_class = TiersSerializer


class CompteUtilisateurViewSet(viewsets.ModelViewSet):
    queryset = CompteUtilisateur.objects.select_related("user").all()
    serializer_class = CompteUtilisateurSerializer
