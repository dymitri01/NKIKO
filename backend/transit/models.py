from django.conf import settings
from django.db import models


class CompteUtilisateur(models.Model):
    class Role(models.TextChoices):
        ADMINISTRATEUR = "ADMINISTRATEUR", "Administrateur"
        AGENT_TRANSIT = "AGENT_TRANSIT", "Agent de transit"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="compte_utilisateur",
    )
    role = models.CharField(max_length=20, choices=Role.choices)

    class Meta:
        verbose_name = "Compte utilisateur"
        verbose_name_plural = "Comptes utilisateurs"

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


class Tiers(models.Model):
    class Categorie(models.TextChoices):
        CLIENT = "CLIENT", "Client"
        TRANSPORTEUR = "TRANSPORTEUR", "Transporteur"
        CHARGEUR = "CHARGEUR", "Chargeur"

    class Statut(models.TextChoices):
        ACTIF = "ACTIF", "Actif"
        INACTIF = "INACTIF", "Inactif"

    nom = models.CharField(max_length=255)
    categorie = models.CharField(max_length=20, choices=Categorie.choices)
    code = models.CharField(max_length=50, unique=True)
    email = models.EmailField(blank=True)
    telephone = models.CharField(max_length=30, blank=True)
    adresse = models.CharField(max_length=255, blank=True)
    ville = models.CharField(max_length=100, blank=True)
    pays = models.CharField(max_length=100, blank=True)
    boite_postale = models.CharField(max_length=50, blank=True)
    numero_fiscal = models.CharField(max_length=50, blank=True)
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.ACTIF)

    class Meta:
        verbose_name = "Tiers"
        verbose_name_plural = "Tiers"
        ordering = ["nom"]

    def __str__(self):
        return f"{self.nom} ({self.get_categorie_display()})"


class Marchandise(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)

    class Meta:
        verbose_name = "Marchandise"
        verbose_name_plural = "Marchandises"
        ordering = ["nom"]

    def __str__(self):
        return self.nom


class MoyenTransport(models.Model):
    class Type(models.TextChoices):
        WAGON = "WAGON", "Wagon"
        CONTENEUR = "CONTENEUR", "Conteneur"

    class Statut(models.TextChoices):
        DISPONIBLE = "DISPONIBLE", "Disponible"
        EN_UTILISATION = "EN_UTILISATION", "En utilisation"

    type = models.CharField(max_length=20, choices=Type.choices)
    numero = models.CharField(max_length=50, unique=True)
    volume = models.DecimalField(max_digits=10, decimal_places=2)
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.DISPONIBLE)

    class Meta:
        verbose_name = "Moyen de transport"
        verbose_name_plural = "Moyens de transport"
        ordering = ["numero"]

    def __str__(self):
        return f"{self.numero} ({self.get_type_display()})"
