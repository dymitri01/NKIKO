from rest_framework import viewsets

from .models import CompteUtilisateur, Marchandise, Tiers
from .serializers import CompteUtilisateurSerializer, MarchandiseSerializer, TiersSerializer


class TiersViewSet(viewsets.ModelViewSet):
    queryset = Tiers.objects.all()
    serializer_class = TiersSerializer


class CompteUtilisateurViewSet(viewsets.ModelViewSet):
    queryset = CompteUtilisateur.objects.select_related("user").all()
    serializer_class = CompteUtilisateurSerializer


class MarchandiseViewSet(viewsets.ModelViewSet):
    queryset = Marchandise.objects.all()
    serializer_class = MarchandiseSerializer
