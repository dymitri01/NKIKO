from django.conf import settings
from django.db import models
from django.utils import timezone


class CompteUtilisateur(models.Model):
    class Role(models.TextChoices):
        ADMINISTRATEUR = "ADMINISTRATEUR", "Administrateur"
        AGENT_TRANSIT = "AGENT_TRANSIT", "Agent de transit"
        CHEF_DEPOT = "CHEF_DEPOT", "Chef de dépôt"

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


class Contrat(models.Model):
    class Type(models.TextChoices):
        D15 = "D15", "D15"
        TITRE_PROVENANCE = "TITRE_PROVENANCE", "Titre de provenance"

    class Statut(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        ACTIF = "ACTIF", "Actif"
        EPUISE = "EPUISE", "Épuisé"

    numero_contrat = models.CharField(max_length=50, unique=True, blank=True)
    client = models.ForeignKey(
        Tiers,
        on_delete=models.PROTECT,
        related_name="contrats",
        limit_choices_to={"categorie": Tiers.Categorie.CLIENT},
    )
    type = models.CharField(max_length=20, choices=Type.choices)
    provenance = models.CharField(max_length=100)
    marchandise = models.ForeignKey(
        Marchandise,
        on_delete=models.PROTECT,
        related_name="contrats",
    )
    volume_total_autorise = models.DecimalField(max_digits=10, decimal_places=2)
    volume_total_restant = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.EN_ATTENTE)
    date_creation = models.DateField(auto_now_add=True)

    class Meta:
        verbose_name = "Contrat"
        verbose_name_plural = "Contrats"
        ordering = ["-id"]

    def _generer_numero_contrat(self):
        prefixe_client = self.client.nom[:3].upper()
        lettre_type = "D" if self.type == self.Type.D15 else "T"
        aujourdhui = timezone.localdate()
        date_partie = aujourdhui.strftime("%y%m%d")
        nb_contrats_du_jour = Contrat.objects.filter(date_creation=aujourdhui).count()
        serie = f"{nb_contrats_du_jour + 1:04d}"
        return f"{prefixe_client}{lettre_type}-{date_partie}-{serie}"

    def save(self, *args, **kwargs):
        if self._state.adding:
            if self.volume_total_restant is None:
                self.volume_total_restant = self.volume_total_autorise
            if not self.numero_contrat:
                self.numero_contrat = self._generer_numero_contrat()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.numero_contrat
