from django.contrib import admin

from .models import (
    Colis,
    CompteUtilisateur,
    Contrat,
    LettreVoiture,
    Marchandise,
    MoyenTransport,
    Tiers,
)


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


@admin.register(MoyenTransport)
class MoyenTransportAdmin(admin.ModelAdmin):
    list_display = ("numero", "type", "volume", "statut")
    list_filter = ("type", "statut")
    search_fields = ("numero",)


@admin.register(Contrat)
class ContratAdmin(admin.ModelAdmin):
    list_display = (
        "numero_contrat",
        "client",
        "marchandise",
        "provenance",
        "volume_total_autorise",
        "volume_total_restant",
        "statut",
    )
    list_filter = ("statut", "type", "marchandise")
    search_fields = ("numero_contrat", "provenance", "client__nom")
    readonly_fields = ("numero_contrat", "date_creation")


class ColisInline(admin.TabularInline):
    model = Colis
    extra = 0
    readonly_fields = ("marchandise", "volume")


@admin.register(LettreVoiture)
class LettreVoitureAdmin(admin.ModelAdmin):
    list_display = (
        "numero_lettre_voiture",
        "numero_bl",
        "immatriculation_camion",
        "client",
        "transporteur",
        "chargeur",
        "date_arrivee",
        "statut",
    )
    list_filter = ("statut", "date_arrivee")
    search_fields = ("numero_lettre_voiture", "numero_bl", "immatriculation_camion", "client__nom")
    readonly_fields = ("numero_lettre_voiture", "statut", "bordereau", "date_cloture")
    inlines = [ColisInline]


@admin.register(Colis)
class ColisAdmin(admin.ModelAdmin):
    list_display = ("numero_bille", "lettre_voiture", "contrat", "marchandise", "volume")
    list_filter = ("marchandise",)
    search_fields = ("numero_bille",)
    readonly_fields = ("marchandise", "volume")
