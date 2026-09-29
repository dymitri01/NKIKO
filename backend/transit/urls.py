from rest_framework.routers import DefaultRouter

from .views import (
    CompteUtilisateurViewSet,
    ContratViewSet,
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

urlpatterns = router.urls
