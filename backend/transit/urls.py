from rest_framework.routers import DefaultRouter

from .views import (
    ColisViewSet,
    CompteUtilisateurViewSet,
    ContratViewSet,
    LettreVoitureViewSet,
    MarchandiseViewSet,
    MoyenTransportViewSet,
    TiersViewSet,
)

router = DefaultRouter()
router.register("tiers", TiersViewSet, basename="tiers")
router.register("comptes-utilisateurs", CompteUtilisateurViewSet, basename="compte-utilisateur")
router.register("marchandises", MarchandiseViewSet, basename="marchandise")
router.register("moyens-transport", MoyenTransportViewSet, basename="moyen-transport")
router.register("contrats", ContratViewSet, basename="contrat")
router.register("lettres-voiture", LettreVoitureViewSet, basename="lettre-voiture")
router.register("colis", ColisViewSet, basename="colis")

urlpatterns = router.urls
