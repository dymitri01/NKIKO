from rest_framework import serializers

from .models import CompteUtilisateur, Tiers


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
