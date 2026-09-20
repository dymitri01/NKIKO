from rest_framework.routers import DefaultRouter

from .views import CompteUtilisateurViewSet, TiersViewSet

router = DefaultRouter()
router.register("tiers", TiersViewSet, basename="tiers")
router.register("comptes-utilisateurs", CompteUtilisateurViewSet, basename="compte-utilisateur")

urlpatterns = router.urls
