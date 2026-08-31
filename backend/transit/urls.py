from rest_framework.routers import DefaultRouter

from .views import TiersViewSet

router = DefaultRouter()
router.register("tiers", TiersViewSet, basename="tiers")

urlpatterns = router.urls
