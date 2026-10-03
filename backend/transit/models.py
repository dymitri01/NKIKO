from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import models, transaction
from django.utils import timezone

PI = Decimal("3.14159265358979")


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


class LettreVoiture(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        CLOTURE = "CLOTURE", "Clôturé"
        EN_ATTENTE_APPROBATION = "EN_ATTENTE_APPROBATION", "En attente d'approbation"

    numero_lettre_voiture = models.CharField(max_length=50, unique=True, blank=True)
    numero_bl = models.CharField(max_length=50)
    statut = models.CharField(max_length=25, choices=Statut.choices, default=Statut.EN_ATTENTE)
    bordereau = models.FileField(upload_to="bordereaux/", blank=True, null=True)
    date_cloture = models.DateTimeField(blank=True, null=True)
    client = models.ForeignKey(
        Tiers,
        on_delete=models.PROTECT,
        related_name="lettres_voiture_client",
        limit_choices_to={"categorie": Tiers.Categorie.CLIENT},
    )
    trajet = models.CharField(max_length=255)
    date_arrivee = models.DateField()
    chargeur = models.ForeignKey(
        Tiers,
        on_delete=models.PROTECT,
        related_name="lettres_voiture_chargeur",
        limit_choices_to={"categorie": Tiers.Categorie.CHARGEUR},
    )
    transporteur = models.ForeignKey(
        Tiers,
        on_delete=models.PROTECT,
        related_name="lettres_voiture_transporteur",
        limit_choices_to={"categorie": Tiers.Categorie.TRANSPORTEUR},
    )
    chauffeur = models.CharField(max_length=255)
    immatriculation_camion = models.CharField(max_length=50)
    pays_provenance = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Lettre de voiture"
        verbose_name_plural = "Lettres de voiture"
        ordering = ["-id"]

    def save(self, *args, **kwargs):
        if self._state.adding and not self.numero_lettre_voiture:
            prefixe_client = self.client.nom[:3].upper()
            self.numero_lettre_voiture = f"{prefixe_client}{self.numero_bl}"
        super().save(*args, **kwargs)

    def cloturer(self):
        from .pdf import generer_bordereau_pdf

        if self.statut != self.Statut.EN_ATTENTE:
            raise ValueError("Seule une réception en attente peut être clôturée.")

        colis_list = list(self.colis.select_related("contrat"))
        if not colis_list:
            raise ValueError("Impossible de clôturer une réception sans aucune bille.")

        subtotaux = {}
        for colis in colis_list:
            subtotaux[colis.contrat_id] = (
                subtotaux.get(colis.contrat_id, Decimal("0")) + colis.volume
            )

        contrats = {c.id: c for c in Contrat.objects.filter(id__in=subtotaux.keys())}
        depassements = []
        for contrat_id, volume_recu in subtotaux.items():
            contrat = contrats[contrat_id]
            if volume_recu > contrat.volume_total_restant:
                depassements.append(
                    f"Le contrat {contrat.numero_contrat} n'a que "
                    f"{contrat.volume_total_restant} restant, mais {volume_recu} "
                    f"ont été reçus."
                )
        if depassements:
            raise ValueError(" ".join(depassements))

        with transaction.atomic():
            for contrat_id, volume_recu in subtotaux.items():
                contrat = contrats[contrat_id]
                contrat.volume_total_restant -= volume_recu
                if contrat.volume_total_restant <= 0:
                    contrat.volume_total_restant = Decimal("0")
                    contrat.statut = Contrat.Statut.EPUISE
                contrat.save(update_fields=["volume_total_restant", "statut"])

            pdf_bytes = generer_bordereau_pdf(self)
            self.bordereau.save(
                f"{self.numero_lettre_voiture}.pdf", ContentFile(pdf_bytes), save=False
            )
            self.statut = self.Statut.CLOTURE
            self.date_cloture = timezone.now()
            self.save(update_fields=["statut", "date_cloture", "bordereau"])

    def rouvrir(self):
        if self.statut != self.Statut.EN_ATTENTE_APPROBATION:
            raise ValueError(
                "Seule une réception en attente d'approbation peut être rouverte."
            )

        colis_list = list(self.colis.select_related("contrat"))
        subtotaux = {}
        for colis in colis_list:
            subtotaux[colis.contrat_id] = (
                subtotaux.get(colis.contrat_id, Decimal("0")) + colis.volume
            )
        contrats = {c.id: c for c in Contrat.objects.filter(id__in=subtotaux.keys())}

        with transaction.atomic():
            for contrat_id, volume_a_restituer in subtotaux.items():
                contrat = contrats[contrat_id]
                contrat.volume_total_restant += volume_a_restituer
                if contrat.statut == Contrat.Statut.EPUISE and contrat.volume_total_restant > 0:
                    contrat.statut = Contrat.Statut.ACTIF
                contrat.save(update_fields=["volume_total_restant", "statut"])

            self.statut = self.Statut.EN_ATTENTE
            self.save(update_fields=["statut"])

    def __str__(self):
        return self.numero_lettre_voiture


class Colis(models.Model):
    lettre_voiture = models.ForeignKey(
        LettreVoiture,
        on_delete=models.CASCADE,
        related_name="colis",
    )
    contrat = models.ForeignKey(
        Contrat,
        on_delete=models.PROTECT,
        related_name="colis",
        limit_choices_to={"statut": Contrat.Statut.ACTIF},
    )
    marchandise = models.ForeignKey(
        Marchandise,
        on_delete=models.PROTECT,
        related_name="colis",
    )
    numero_bille = models.CharField(max_length=50)
    longueur = models.DecimalField(max_digits=6, decimal_places=2, help_text="En mètres")
    diametre = models.DecimalField(max_digits=6, decimal_places=2, help_text="En mètres")
    volume = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, help_text="En m³, calculé automatiquement"
    )
    class Meta:
        verbose_name = "Colis"
        verbose_name_plural = "Colis"
        ordering = ["-id"]

    def save(self, *args, **kwargs):
        self.marchandise = self.contrat.marchandise
        rayon = self.diametre / 2
        self.volume = (PI * rayon**2 * self.longueur).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return self.numero_bille
