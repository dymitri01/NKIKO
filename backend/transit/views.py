from rest_framework import viewsets

from .models import Tiers
from .serializers import TiersSerializer


class TiersViewSet(viewsets.ModelViewSet):
    queryset = Tiers.objects.all()
    serializer_class = TiersSerializer
