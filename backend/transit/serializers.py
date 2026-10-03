from rest_framework import serializers

from .models import (
    Colis,
    CompteUtilisateur,
    Contrat,
    LettreVoiture,
    Marchandise,
    MoyenTransport,
    Tiers,
)


class TiersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tiers
        fields = [
            "id",
            "nom",
            "categorie",
            "code",
            "email",
            "telephone",
            "adresse",
            "ville",
            "pays",
            "boite_postale",
            "numero_fiscal",
            "statut",
        ]


class CompteUtilisateurSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = CompteUtilisateur
        fields = ["id", "user", "username", "role"]


class MarchandiseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marchandise
        fields = ["id", "nom", "code"]


class MoyenTransportSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoyenTransport
        fields = ["id", "type", "numero", "volume", "statut"]


class ContratSerializer(serializers.ModelSerializer):
    client = serializers.PrimaryKeyRelatedField(
        queryset=Tiers.objects.filter(categorie=Tiers.Categorie.CLIENT)
    )
    client_nom = serializers.CharField(source="client.nom", read_only=True)
    marchandise_nom = serializers.CharField(source="marchandise.nom", read_only=True)

    class Meta:
        model = Contrat
        fields = [
            "id",
            "numero_contrat",
            "client",
            "client_nom",
            "type",
            "provenance",
            "marchandise",
            "marchandise_nom",
            "volume_total_autorise",
            "volume_total_restant",
            "statut",
            "date_creation",
        ]
        read_only_fields = ["numero_contrat", "volume_total_restant", "statut", "date_creation"]

    def update(self, instance, validated_data):
        if instance.volume_total_restant != instance.volume_total_autorise:
            raise serializers.ValidationError(
                "Ce contrat a déjà été consommé (au moins une réception "
                "enregistrée) et ne peut plus être modifié."
            )
        if instance.statut == Contrat.Statut.ACTIF:
            validated_data["statut"] = Contrat.Statut.EN_ATTENTE
        return super().update(instance, validated_data)


class ColisSerializer(serializers.ModelSerializer):
    contrat = serializers.PrimaryKeyRelatedField(
        queryset=Contrat.objects.filter(statut=Contrat.Statut.ACTIF)
    )
    contrat_numero = serializers.CharField(source="contrat.numero_contrat", read_only=True)
    marchandise_nom = serializers.CharField(source="marchandise.nom", read_only=True)
    lettre_voiture_numero = serializers.CharField(
        source="lettre_voiture.numero_lettre_voiture", read_only=True
    )

    class Meta:
        model = Colis
        fields = [
            "id",
            "lettre_voiture",
            "lettre_voiture_numero",
            "contrat",
            "contrat_numero",
            "marchandise",
            "marchandise_nom",
            "numero_bille",
            "longueur",
            "diametre",
            "volume",
        ]
        read_only_fields = ["marchandise", "volume"]

    def validate(self, attrs):
        lettre_voiture = attrs.get(
            "lettre_voiture", getattr(self.instance, "lettre_voiture", None)
        )
        contrat = attrs.get("contrat", getattr(self.instance, "contrat", None))
        if lettre_voiture and contrat and contrat.client_id != lettre_voiture.client_id:
            raise serializers.ValidationError(
                f"Le contrat {contrat.numero_contrat} appartient à un autre "
                f"client que celui de cette réception ({lettre_voiture.client.nom})."
            )
        if lettre_voiture and lettre_voiture.statut != LettreVoiture.Statut.EN_ATTENTE:
            raise serializers.ValidationError(
                "Les billes de cette réception ne sont pas modifiables dans son "
                f"statut actuel ({lettre_voiture.get_statut_display()})."
            )
        return attrs


class LettreVoitureSerializer(serializers.ModelSerializer):
    client = serializers.PrimaryKeyRelatedField(
        queryset=Tiers.objects.filter(categorie=Tiers.Categorie.CLIENT)
    )
    chargeur = serializers.PrimaryKeyRelatedField(
        queryset=Tiers.objects.filter(categorie=Tiers.Categorie.CHARGEUR)
    )
    transporteur = serializers.PrimaryKeyRelatedField(
        queryset=Tiers.objects.filter(categorie=Tiers.Categorie.TRANSPORTEUR)
    )
    client_nom = serializers.CharField(source="client.nom", read_only=True)
    chargeur_nom = serializers.CharField(source="chargeur.nom", read_only=True)
    transporteur_nom = serializers.CharField(source="transporteur.nom", read_only=True)
    colis = ColisSerializer(many=True, read_only=True)

    class Meta:
        model = LettreVoiture
        fields = [
            "id",
            "numero_lettre_voiture",
            "numero_bl",
            "client",
            "client_nom",
            "trajet",
            "date_arrivee",
            "chargeur",
            "chargeur_nom",
            "transporteur",
            "transporteur_nom",
            "chauffeur",
            "immatriculation_camion",
            "pays_provenance",
            "statut",
            "date_cloture",
            "colis",
        ]
        read_only_fields = ["numero_lettre_voiture", "statut", "date_cloture"]

    def update(self, instance, validated_data):
        if instance.statut != LettreVoiture.Statut.EN_ATTENTE:
            raise serializers.ValidationError(
                "Cette réception n'est pas modifiable dans son statut actuel "
                f"({instance.get_statut_display()}). Demande une modification "
                "d'abord si elle est clôturée."
            )
        return super().update(instance, validated_data)
