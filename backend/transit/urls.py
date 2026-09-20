from rest_framework.routers import DefaultRouter

from .views import CompteUtilisateurViewSet, MarchandiseViewSet, TiersViewSet

router = DefaultRouter()
router.register("tiers", TiersViewSet, basename="tiers")
router.register("comptes-utilisateurs", CompteUtilisateurViewSet, basename="compte-utilisateur")
router.register("marchandises", MarchandiseViewSet, basename="marchandise")

urlpatterns = router.urls
