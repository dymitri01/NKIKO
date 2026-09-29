from rest_framework import serializers

from .models import CompteUtilisateur, Contrat, Marchandise, MoyenTransport, Tiers


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
