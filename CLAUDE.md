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
- Base de données : SQLite en développement local pour l'instant (par défaut,
  aucune config requise) → PostgreSQL plus tard via Docker. Les mêmes
  migrations Django fonctionnent sur les deux sans changer les modèles.
- Conteneurisation : Docker + docker-compose (pas encore mis en place)
- CI/CD : GitHub Actions
- Terminal : Git Bash sous Windows (PAS PowerShell — toujours donner des
  commandes bash, jamais d'équivalents PowerShell)

## Modèle de données (issu du MCD/MLD, avec décisions prises en cours de route)

### Tiers
Fusionne les entités Entité / Client / Transporteur / Chargeur du MCD en une
seule table, distinguées par un champ `categorie`.
Champs : nom, categorie (Client/Transporteur/Chargeur), email, telephone,
code, adresse, ville, pays, boite_postale, numero_fiscal, statut.

### Marchandise
Table de référence séparée pour les essences de bois (ex: Padouk, Okoumé,
Iroko) — décision confirmée : table à part (pas un champ texte libre) car de
nouvelles essences doivent pouvoir être ajoutées depuis l'app pour créer de
nouveaux contrats, et ça évite les doublons/fautes de frappe.
Champs : nom, code.

### Contrat
Créé via un formulaire dans l'application.
Champs : numero_contrat (auto-généré, voir ci-dessous), client (FK Tiers,
catégorie Client uniquement), type (D15 / Titre de provenance — liste
fermée), provenance, marchandise (FK vers Marchandise),
volume_total_autorise, volume_total_restant (initialisé automatiquement à
volume_total_autorise à la création), statut, date_creation (auto).
**Ne contient PAS de prix ni d'informations commerciales/formelles.**

**Numéro de contrat auto-généré** (jamais saisi à la main) : concaténation
des 3 premières lettres du nom du client (majuscules) + lettre du type
(`D` pour D15, `T` pour Titre de provenance) + `-` + date du jour
(AAMMJJ) + `-` + numéro de série sur 4 chiffres, remis à zéro chaque jour.
Exemple : `SOCD-260929-0001`, puis `SOCT-260929-0002` pour le 2e contrat
créé le même jour.

**Statut et workflow de validation** (confirmé par l'utilisateur) :
- `En attente` (statut par défaut à la création)
- `Actif` (validé par le Chef de dépôt — seul un contrat `En attente` peut
  être validé)
- `Épuisé` (volume_total_restant atteint 0)

Un **Chef de dépôt** (nouveau rôle sur `CompteUtilisateur`, voir plus bas)
valide ou rejette les contrats `En attente` depuis un futur écran/onglet
**Notifications** (pas encore maquetté sur Stitch — à ajouter au menu
latéral) : il voit le détail du contrat et clique "Valider" (→ `Actif`) ou
"Rejeter" (reste `En attente`, l'agent doit corriger et resoumettre).

Règle de reverrouillage : **toute modification d'un contrat `Actif`** (par
n'importe quel rôle, y compris Administrateur/Chef de dépôt) le fait
automatiquement repasser à `En attente` — il doit être revalidé avant de
pouvoir être réutilisé. Un contrat déjà consommé (volume_total_restant ≠
volume_total_autorise, preuve qu'au moins une réception l'a déjà décompté)
ne peut en revanche plus être modifié du tout, quel que soit son statut.

Lors de la création d'une **Réception** (LettreVoiture/Colis, à venir), le
sélecteur de contrat ne doit proposer QUE les contrats au statut `Actif`
(pas `En attente`, pas `Épuisé`) — à implémenter au moment de coder cette
logique.

### LettreVoiture
Représente uniquement **l'événement de transport** (un camion qui arrive) —
n'est PAS liée directement à un Contrat (voir règle métier critique
ci-dessous).
Champs : numero_lettre_voiture (auto-généré, voir ci-dessous), numero_bl
(numéro du bordereau de livraison papier, saisi par l'agent), client (FK
Tiers, catégorie Client), trajet, date_arrivee, chargeur (FK Tiers,
catégorie Chargeur), transporteur (FK Tiers, catégorie Transporteur),
chauffeur, immatriculation_camion, pays_provenance.

**Numéro de lettre de voiture auto-généré** (confirmé par l'utilisateur) :
concaténation directe (sans séparateur) des 3 premières lettres du nom du
client (majuscules) + numero_bl. Exemple : client "Société..." + BL
"2026-00458" → `SOC2026-00458`.

**Statut/clôture — IMPLÉMENTÉ** (avancé plus tôt que prévu dans la feuille
de route initiale, sur demande de l'utilisateur) : champs `statut`
(`En attente` par défaut / `Clôturé`), `bordereau` (fichier PDF, stocké
via `MEDIA_ROOT/bordereaux/`), `date_cloture`.

Méthode `LettreVoiture.cloturer()` (logique métier sur le modèle) :
1. Regroupe les Colis existants par Contrat, somme les volumes
2. Si un seul contrat recevrait plus que son `volume_total_restant`,
   **bloque toute la clôture** (aucun changement appliqué, message
   listant chaque dépassement) — décision confirmée par l'utilisateur
3. Sinon, décrémente chaque Contrat concerné (statut → `Épuisé` si le
   restant atteint 0), génère le PDF (ReportLab), sauvegarde le fichier,
   passe la réception à `Clôturé` — le tout dans une transaction atomique
   (`transaction.atomic()`) pour éviter un décompte partiel en cas d'erreur

Endpoints : `POST /api/lettres-voiture/{id}/cloturer/` (déclenche tout
ça), `GET /api/lettres-voiture/{id}/bordereau/` (télécharge le PDF déjà
généré). Pas de validation Chef de dépôt pour les réceptions
(contrairement aux Contrats) — l'agent clôture lui-même.

**Modification/suppression possible UNIQUEMENT quand statut = `En attente`**
(décision confirmée). Une réception `Clôturé`e n'est donc pas bloquée
définitivement — cycle de ré-ouverture avec approbation du Chef de dépôt,
même esprit que la validation des Contrats :
- `POST /{id}/demander_modification/` : `Clôturé` → `En attente
  d'approbation` (déclenché par le bouton "Modifier" côté agent)
- `POST /{id}/autoriser_modification/` (Chef de dépôt) : **restitue
  d'abord le volume déjà décompté sur chaque Contrat concerné** (inverse
  exact de la clôture — sinon double décompte à la reclôture), repasse le
  contrat `Épuisé` → `Actif` si besoin, puis `En attente d'approbation` →
  `En attente` (déverrouillé, l'agent peut modifier)
- `POST /{id}/refuser_modification/` (Chef de dépôt) : `En attente
  d'approbation` → `Clôturé` (rien ne change, pas de restitution)
- L'agent modifie, puis reclôture (`/cloturer/`) pour refaire le cycle
  complet (décompte frais + nouveau PDF) — testé, aucun double décompte.

**Bibliothèque PDF : ReportLab, pas WeasyPrint** (décision confirmée) —
WeasyPrint nécessite des dépendances système (GTK/Pango) pénibles à
installer sous Windows en dev local ; ReportLab est pur Python, sans
dépendance système. À reconsidérer une fois le projet sous Docker/Linux
si un rendu HTML/CSS plus proche des maquettes Stitch est voulu.

### Colis (bille)
Le point de jonction réel entre transport et contrat — chaque bille
individuelle reçue. Pas de champ `qualite` (retiré, pas d'utilité
identifiée).
Champs : numero_bille, longueur (m), diametre (m),
**volume (calculé automatiquement, jamais saisi — formule cylindre
π×(diametre/2)²×longueur, arrondi à 2 décimales)**,
**lettre_voiture (FK → LettreVoiture, quel camion/réception)**,
**contrat (FK → Contrat, quel contrat cette bille décompte — restreint
aux contrats au statut Actif ET du même client que la LettreVoiture)**,
**marchandise (FK → Marchandise, quelle essence — jamais saisie, déduite
automatiquement de contrat.marchandise)**.

### RÈGLE MÉTIER CRITIQUE (confirmée par l'utilisateur, remplace une version
antérieure où la FK Contrat était sur LettreVoiture)
Un même camion / une même lettre de voiture peut transporter des billes
appartenant à **plusieurs contrats différents**. Un seul bordereau de
réception doit donc pouvoir regrouper des billes de contrats et d'essences
différents — PAS un bordereau par contrat.

Le décompte automatique du `Volume_Total_Restant` se fait **par Colis,
contre le Contrat lié à ce Colis précis** — pas au niveau global de la
LettreVoiture. Une LettreVoiture peut donc décompter simultanément
plusieurs contrats différents, chacun uniquement du volume de ses propres
billes.

Implémentation prévue : au moment de la **validation** de la réception (pas
à chaque ajout de ligne en brouillon, pour éviter qu'un brouillon abandonné
décompte déjà un contrat), regrouper les Colis par Contrat et décrémenter
chaque Contrat.volume_total_restant du sous-total correspondant. Le statut
du contrat passe à "Épuisé" quand volume_total_restant atteint 0.

### Chargement
Logique symétrique côté expédition — des billes en stock sont chargées vers
un Moyen_Transport, avec destination et Numéro_DEX (document d'exportation
douanier). Génère aussi un bordereau (bordereau de chargement/expédition).
Champs : date, destination, numero_dex, moyen_transport (FK),
volume_chargement.

### MoyenTransport
Une seule table (pas deux tables séparées Wagon/Conteneur) — décision
confirmée pour rester simple.
Champs : type (Wagon/Conteneur), numero (immatriculation, sert
d'identifiant), volume, statut.

### CompteUtilisateur
Comptes internes (rôles : Administrateur / Agent de transit / **Chef de
dépôt**) — bien distincts des Tiers (Client/Transporteur/Chargeur) qui
sont des entités métier, pas des comptes applicatifs avec identifiants.
Implémenté via un `OneToOneField` vers le `User` Django natif (pas de
remplacement d'`AUTH_USER_MODEL`, car les migrations auth étaient déjà
appliquées au moment de la décision) plutôt qu'un champ `role` ajouté au
`User` directement.

Le **Chef de dépôt** est le rôle qui valide/rejette les contrats en
attente (voir section Contrat ci-dessus).

### Validation essence / contrat (confirmée par l'utilisateur)
L'application DOIT contrôler que l'essence saisie sur une bille
(Colis.marchandise) correspond bien à l'essence autorisée par le contrat
sélectionné (Colis.contrat.marchandise). Si ça ne correspond pas, la
création/modification du Colis doit être rejetée avec un message d'erreur
clair (ex: "Cette bille est en {essence saisie}, mais le contrat {numero}
n'autorise que {essence du contrat}").
Implémentation prévue : méthode `validate()` du serializer Colis (pas une
contrainte au niveau base de données, car c'est une règle métier qui peut
avoir besoin d'évoluer — ex: exceptions futures, tolérances).

## ⚠️ Maquettes Stitch à revoir
Suite à la règle "un bordereau peut contenir plusieurs contrats", deux
écrans déjà maquettés sont à corriger avant de les considérer figés :
1. **Écran Réception** : le panneau "Linked Contract" affichait un seul
   contrat pour toute la réception — il faut un **sélecteur de contrat par
   ligne de bille** dans le tableau, pas un contrat unique en haut du
   formulaire.
2. **Bordereau de réception (PDF)** : l'en-tête affichait un seul
   "Contrat: CT-592-A" — il faut remplacer ça par une **colonne "Contrat"
   dans le tableau des billes**.
Pas urgent, à corriger avant de coder l'écran Réception côté React.

## Maquettes UI (conçues sur Google Stitch) — reste valable
Écrans validés : Tableau de bord, Contrats (liste avec jauge de progression
d'épuisement du volume), Réception (voir correction ci-dessus), Bordereau de
réception (voir correction ci-dessus), Expéditions, Tiers, Comptes
utilisateurs, Stock.

Style : Material Design, palette verte/brune/neutre (thème bois/forêt),
interface **entièrement en français**, menu latéral identique et dans le
même ordre sur tous les écrans (Tableau de bord, Contrats, Réception,
Expéditions, Stock, Tiers, Comptes utilisateurs, Rapports).

⚠️ **Nouvel écran à ajouter au menu (pas encore maquetté)** : onglet
**Notifications**, visible surtout pour le Chef de dépôt — liste des
contrats `En attente` avec le détail et les boutons Valider/Rejeter (voir
section Contrat).

Pattern UX convenu pour l'écran Réception : liste/historique en premier,
panneau latéral (drawer, ~70% largeur, pas un modal centré) pour le
formulaire, validation ferme le panneau sans changement de page, bouton par
ligne d'historique pour voir le bordereau en viewer PDF intégré et
téléchargeable. PDF généré côté backend avec **ReportLab** (voir section
LettreVoiture), endpoint `GET /api/lettres-voiture/{id}/bordereau/`
(implémenté) — le bouton "Générer le bordereau" appelle en fait d'abord
`POST .../cloturer/` puis ce `GET` pour l'affichage/téléchargement.

## Workflow Git
- `main` : protégée par un ruleset GitHub (PR obligatoire, suppressions et
  force-push bloqués), toujours stable/déployable
- `develop` : branche par défaut du repo, tout le travail part d'ici
- `feature/xxx` : une branche par fonctionnalité, créée depuis `develop`,
  mergée via Pull Request (Squash and merge, puis suppression de la branche)
- Convention de commits : feat:, fix:, chore:, docs:, refactor:, test:
- Repo : github.com/dymitri01/NKIKO

## Workflow Git — précision importante
Une branche = un modèle (convention confirmée) : chaque modèle de la liste
ci-dessous a sa propre branche `feature/xxx`, sa propre PR vers `develop`,
mergée en "Squash and merge" puis branche supprimée, avant de démarrer le
modèle suivant depuis `develop` à jour.

## État d'avancement actuel
- ✅ Repo initialisé, branches main/develop en place, protection de main
  configurée
- ✅ Setup Django + DRF + CORS, modèles **Tiers**, **CompteUtilisateur**,
  **Marchandise**, **MoyenTransport** : chacun avec son cycle complet
  (modèle → migration → admin.py → serializer → viewset → urls.py), PR
  mergée sur `develop`
- ✅ Modèle **Contrat** avec numéro auto-généré, statut/workflow de
  validation (En attente/Actif/Épuisé, actions valider/rejeter), verrou de
  modification — PR mergée sur `develop`
- ✅ Modèles **LettreVoiture** + **Colis**, avec en plus (ajouté en cours
  de route, pas dans le plan initial) : numéro de lettre de voiture
  auto-généré, marchandise déduite automatiquement du contrat, volume
  calculé automatiquement (formule cylindre), filtre contrat par
  client+statut, **et la clôture avec décompte + génération PDF du
  bordereau (ReportLab)** normalement prévue pour plus tard — avancée
  maintenant sur demande explicite de l'utilisateur. Testé, pas encore
  committé/mergé à ce stade.
- ⏳ **Prochaine étape** : modèle `Chargement` (logique symétrique côté
  expédition)
- ⏳ Écran/onglet Notifications (validation des contrats par le Chef de
  dépôt) à ajouter aux maquettes Stitch
- ⏳ Verrouillage API (`IsAuthenticated` + JWT + permissions par rôle) —
  volontairement différé jusqu'à ce que les rôles (CompteUtilisateur)
  soient en place ; à faire maintenant que c'est le cas, mais pas encore
  fait
