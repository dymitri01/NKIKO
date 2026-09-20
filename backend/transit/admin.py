from django.contrib import admin

from .models import CompteUtilisateur, Marchandise, Tiers


@admin.register(Tiers)
class TiersAdmin(admin.ModelAdmin):
    list_display = ("nom", "categorie", "code", "ville", "pays", "statut")
    list_filter = ("categorie", "statut")
    search_fields = ("nom", "code", "email")


@admin.register(CompteUtilisateur)
class CompteUtilisateurAdmin(admin.ModelAdmin):
    list_display = ("user", "role")
    list_filter = ("role",)
    search_fields = ("user__username", "user__email")


@admin.register(Marchandise)
class MarchandiseAdmin(admin.ModelAdmin):
    list_display = ("nom", "code")
    search_fields = ("nom", "code")
