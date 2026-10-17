from rest_framework.permissions import BasePermission

from .models import CompteUtilisateur


def role_utilisateur(request):
    user = request.user
    if not user.is_authenticated:
        return None
    if user.is_superuser:
        return CompteUtilisateur.Role.ADMINISTRATEUR
    compte = getattr(user, "compte_utilisateur", None)
    return compte.role if compte else None


class EstAdministrateurOuChefDepot(BasePermission):
    message = "Seul un Administrateur ou un Chef de dépôt peut effectuer cette action."

    def has_permission(self, request, view):
        return role_utilisateur(request) in (
            CompteUtilisateur.Role.ADMINISTRATEUR,
            CompteUtilisateur.Role.CHEF_DEPOT,
        )


class EstAdministrateur(BasePermission):
    message = "Seul un Administrateur peut effectuer cette action."

    def has_permission(self, request, view):
        return role_utilisateur(request) == CompteUtilisateur.Role.ADMINISTRATEUR
