## ADDED Requirements

### Requirement: Création d'un atelier d'event storming
Le système SHALL permettre à un expert métier de créer un nouvel atelier d'event storming vierge, identifié par un nom, sans nécessiter de compétence technique.

#### Scenario: Création d'un atelier vide
- **WHEN** l'utilisateur crée un nouvel atelier en lui donnant un nom
- **THEN** le système ouvre un canvas graphique vide prêt à recevoir des éléments

### Requirement: Ajout d'éléments typés sur le canvas
Le système SHALL permettre d'ajouter sur le canvas des éléments typés représentant les briques d'un event storming (domain event, commande, acteur, agrégat, politique, point chaud, question), chaque type étant visuellement distinct (couleur/forme dédiée).

#### Scenario: Ajout d'un domain event
- **WHEN** l'utilisateur ajoute un élément de type "domain event" sur le canvas et saisit son libellé
- **THEN** le système affiche un post-it orange portant le libellé saisi

#### Scenario: Distinction visuelle des types
- **WHEN** l'utilisateur ajoute des éléments de types différents sur le canvas
- **THEN** chaque type d'élément est rendu avec une couleur et un style qui lui sont propres, cohérents sur tout le canvas

### Requirement: Organisation spatiale des éléments
Le système SHALL permettre de déplacer, redimensionner et positionner librement les éléments sur le canvas, y compris le long d'une timeline horizontale et de swimlanes (par acteur ou par contexte).

#### Scenario: Déplacement d'un élément
- **WHEN** l'utilisateur fait glisser un élément vers une nouvelle position du canvas
- **THEN** le système enregistre la nouvelle position de l'élément

#### Scenario: Organisation en swimlanes
- **WHEN** l'utilisateur crée une swimlane et y dépose des éléments
- **THEN** les éléments restent visuellement rattachés à cette swimlane lors des déplacements horizontaux

### Requirement: Mise en relation des éléments
Le système SHALL permettre de relier deux éléments du canvas par une flèche pour représenter un enchaînement logique ou temporel (ex: commande → domain event).

#### Scenario: Création d'un lien entre deux éléments
- **WHEN** l'utilisateur trace un lien entre un élément source et un élément cible
- **THEN** le système affiche une flèche orientée entre les deux éléments et conserve ce lien après rechargement

### Requirement: Persistance de l'atelier
Le système SHALL sauvegarder automatiquement l'état complet du canvas (éléments, positions, liens, swimlanes) afin qu'un utilisateur retrouve l'atelier tel qu'il l'a laissé.

#### Scenario: Reprise d'un atelier existant
- **WHEN** l'utilisateur rouvre un atelier précédemment créé
- **THEN** le système restitue tous les éléments, leurs positions et leurs liens tels qu'ils étaient à la dernière modification
