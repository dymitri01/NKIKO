# NKIKO — Gestion de Transit de Bois

## Contexte du projet
Refonte d'une application initialement développée en Power Platform pendant un
stage, réécrite en Django (backend) + React (frontend) dans le but de
constituer un projet de portfolio pour candidater à des postes de
développeur. Le développeur (Dymitri) est jeune diplômé (Polytechnique de
Douala, génie logiciel) et apprend Django, React, Git, Docker et CI/CD en
même temps qu'il construit ce projet.

**Préférence de travail importante** : expliquer chaque commande en détail
(ce qu'elle fait, pourquoi), ne jamais supposer une maîtrise déjà acquise de
Django/React/Git/Docker. L'objectif est d'apprendre en faisant, pas juste
d'obtenir du code fonctionnel.

## Stack technique
- Backend : Django + Django REST Framework
- Frontend : React (Vite) + Material UI (implémentation de Material Design 3)
- Thème personnalisable via Material Theme Builder (m3.material.io/theme-builder)
- Base de données : PostgreSQL (via Docker)
- Conteneurisation : Docker + docker-compose
- CI/CD : GitHub Actions
- Terminal : Git Bash sous Windows (PAS PowerShell — attention à la syntaxe,
  toujours donner des commandes bash, pas des équivalents PowerShell)

## Modèle de données (issu du MCD/MLD du développeur)

Entités principales et logique métier :

- **Entité** (générique) → se décline en Client / Transporteur / Chargeur
  (regroupés dans l'écran "Tiers" côté UI, avec un champ `Category`)

- **Contrat** : créé via un formulaire dans l'application.
  Champs clés : `Numéro_Contrat`, `Type`, `Provenance`, `Marchandise`,
  `Volume_Total_Autorisé`, `Volume_Total_Restant`, `Statut`.
  **Ne contient PAS de prix ni d'informations commerciales/formelles.**

- **LettreVoiture** : décrit le contenu d'un camion arrivant avec des billes
  de bois. Rattachée à un Contrat. Contient les infos transport (client,
  trajet, date d'arrivée, nom du chargeur, nom du transporteur, chauffeur,
  immatriculation camion, pays de provenance, numéro de contrat) + une liste
  de **Colis** (billes : numéro de bille, longueur, diamètre, volume,
  essence). À la validation, génère un **bordereau de réception**.

- **RÈGLE MÉTIER CRITIQUE** : à chaque réception validée, le volume total des
  billes reçues doit **décompter automatiquement** le `Volume_Total_Restant`
  du Contrat lié, jusqu'à épuisement (le statut du contrat passe alors à
  "Épuisé"). Cette logique doit être implémentée côté **backend uniquement**
  (méthode `save()` surchargée sur le modèle, ou signal Django
  `post_save`) — jamais calculée ou dupliquée côté frontend.

- **Chargement** : logique symétrique côté expédition — des billes
  disponibles en stock sont chargées vers un `Moyen_Transport` (Wagon ou
  Conteneur), avec une destination et un `Numéro_DEX` (document d'exportation
  douanier). Génère aussi un bordereau (bordereau de chargement/expédition).

- **Comptes utilisateurs internes** (rôles : Administrateur / Agent de
  transit) — bien distincts des Tiers (Client/Transporteur/Chargeur) qui sont
  des entités métier, pas des comptes applicatifs avec identifiants.

## Maquettes UI (conçues sur Google Stitch)

Écrans validés : Tableau de bord, Contrats (liste avec jauge de progression
d'épuisement du volume), Réception, Bordereau de réception (document
imprimable / export PDF), Expéditions, Tiers, Comptes utilisateurs, Stock.

Style : Material Design, palette verte/brune/neutre (thème bois/forêt),
interface **entièrement en français**, menu latéral identique et dans le
même ordre sur tous les écrans (Tableau de bord, Contrats, Réception,
Expéditions, Stock, Tiers, Comptes utilisateurs, Rapports).

**Pattern UX convenu pour l'écran Réception** (à reproduire en React) :
1. L'écran s'ouvre sur l'historique des réceptions (liste), pas sur un
   formulaire.
2. Un bouton ouvre un **panneau latéral (drawer) glissant depuis la droite,
   ~70% de la largeur d'écran** — pas un modal centré, le formulaire est trop
   riche (infos transport + tableau dynamique de billes) pour un petit modal.
3. Le panneau contient le contrat lié (avec son volume restant affiché) et
   un tableau de billes ajoutables, avec un total de volume calculé en
   temps réel.
4. La validation ferme le panneau et revient à l'historique **sans
   changement de page/route** (état React, pas de navigation complète).
5. Chaque ligne de l'historique a un bouton pour afficher le bordereau
   correspondant dans un viewer PDF intégré, avec option de téléchargement.
6. Le PDF du bordereau est généré **côté backend** (ex: WeasyPrint), pas en
   CSS d'impression côté React — prévoir un endpoint type
   `GET /api/receptions/{id}/bordereau/`.

## Workflow Git

- `main` : protégée par un ruleset GitHub (PR obligatoire avant merge,
  suppressions et force-push bloqués), toujours stable/déployable
- `develop` : branche par défaut du repo, tout le travail part d'ici
- `feature/xxx` : une branche par fonctionnalité, créée depuis `develop`,
  mergée via Pull Request (option "Squash and merge", puis suppression de la
  branche)
- Convention de commits : `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
  `test:` (Conventional Commits)
- Repo : github.com/dymitri01/NKIKO

## État d'avancement actuel

- ✅ Repo initialisé, branches `main`/`develop` en place, protection de
  `main` configurée (ruleset GitHub)
- ✅ Sur la branche `feature/setup-backend-django` : projet Django créé
  (module `config`, app `transit`), `djangorestframework` +
  `django-cors-headers` + `psycopg2-binary` + `python-decouple` installés et
  configurés dans `settings.py` (INSTALLED_APPS, MIDDLEWARE,
  CORS_ALLOWED_ORIGINS pour `localhost:5173`), `requirements.txt` généré
- ⏳ PR de `feature/setup-backend-django` vers `develop` pas encore
  mergée à ce stade
- ⏳ **Prochaine étape** : créer les modèles Django dans
  `transit/models.py` à partir du MCD ci-dessus (Contrat, LettreVoiture,
  Colis, Chargement, Tiers, etc.), avec la logique de décompte automatique
  du volume, puis migrations, serializers DRF et viewsets.
