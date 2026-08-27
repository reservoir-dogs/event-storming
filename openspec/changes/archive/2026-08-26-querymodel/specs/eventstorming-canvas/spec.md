## MODIFIED Requirements

### Requirement: Ajout d'éléments typés sur le canvas
Le système SHALL permettre d'ajouter sur le canvas des éléments typés représentant les briques d'un event storming (domain event, commande, acteur, agrégat, politique, point chaud, question, système, message d'intégration, query model), chaque type étant visuellement distinct par une combinaison couleur et intensité de fond qui lui est propre, à l'exception de l'acteur et de l'agrégat qui partagent couleur et intensité de fond et se distinguent par leur taille (voir "Post-its de taille fixe et homogène").

#### Scenario: Ajout d'un domain event
- **WHEN** l'utilisateur ajoute un élément de type "domain event" sur le canvas et saisit son libellé
- **THEN** le système affiche un post-it orange portant le libellé saisi

#### Scenario: Ajout d'un système
- **WHEN** l'utilisateur ajoute un élément de type "système" sur le canvas et saisit son libellé
- **THEN** le système affiche un post-it rose à fond teinté portant le libellé saisi

#### Scenario: Ajout d'un message d'intégration
- **WHEN** l'utilisateur ajoute un élément de type "message d'intégration" sur le canvas et saisit son libellé
- **THEN** le système affiche un post-it gris à fond teinté portant le libellé saisi

#### Scenario: Ajout d'un query model
- **WHEN** l'utilisateur ajoute un élément de type "query model" sur le canvas et saisit son libellé
- **THEN** le système affiche un post-it vert à fond teinté portant le libellé saisi

#### Scenario: Distinction visuelle des types
- **WHEN** l'utilisateur ajoute des éléments de types différents sur le canvas
- **THEN** chaque type d'élément est rendu avec une combinaison couleur et intensité de fond qui lui est propre, cohérente sur tout le canvas, à l'exception de l'acteur et de l'agrégat qui partagent couleur et intensité et se distinguent par leur taille

### Requirement: Apparence des post-its en bordure solide et fond teinté
Le système SHALL créer les post-its avec une bordure solide colorée selon leur type et un fond teinté dans cette même couleur à faible opacité, plutôt qu'un fond de couleur pleine ou transparent. Pour les types "point chaud" et "question", le fond SHALL être dans la couleur pleine du type (au lieu d'être teinté) et leur libellé SHALL s'afficher en blanc, la couleur du type restant inchangée.

#### Scenario: Création d'un post-it
- **WHEN** un utilisateur crée un post-it d'un type donné
- **THEN** le post-it s'affiche avec une bordure solide et un fond légèrement teinté, tous deux dans la couleur du type

#### Scenario: Création d'un point chaud
- **WHEN** un utilisateur crée un post-it de type "point chaud"
- **THEN** le post-it s'affiche avec un fond rouge plein et un libellé blanc

#### Scenario: Création d'une question
- **WHEN** un utilisateur crée un post-it de type "question"
- **THEN** le post-it s'affiche avec un fond vert plein et un libellé blanc

#### Scenario: Aperçu du type dans la barre d'outils
- **WHEN** un utilisateur consulte la barre d'outils
- **THEN** l'aperçu de chaque type reflète sa couleur et son intensité de fond, de sorte que deux types de même couleur et de même intensité ne présentent pas le même aperçu : pour l'acteur et l'agrégat, qui partagent couleur et intensité, l'aperçu reflète leur différence de taille relative

### Requirement: Post-its de taille fixe et homogène
Le système SHALL empêcher le redimensionnement manuel des post-its et SHALL donner à chaque type une taille fixe à la création, quel que soit la longueur du libellé saisi. Cette taille SHALL être identique pour tous les types à l'exception de l'acteur, dont la taille fixe SHALL être inférieure à celle des autres types, conformément à la convention qui distingue un acteur (petit) d'un agrégat (grand) par leur taille plutôt que par leur couleur.

#### Scenario: Sélection d'un post-it
- **WHEN** un utilisateur sélectionne un post-it
- **THEN** aucune poignée de redimensionnement ne s'affiche autour du post-it

#### Scenario: Post-its de types différents
- **WHEN** un utilisateur crée des post-its de types différents autres que l'acteur
- **THEN** tous ces post-its ont exactement la même largeur et la même hauteur

#### Scenario: Post-it acteur plus petit
- **WHEN** un utilisateur crée un post-it de type "acteur"
- **THEN** ce post-it est créé avec une largeur et une hauteur inférieures à celles des autres types, mais identiques à celles de tout autre post-it acteur

#### Scenario: Saisie d'un libellé long
- **WHEN** un utilisateur saisit un libellé dont le texte dépasse l'espace disponible dans le post-it
- **THEN** la taille du post-it ne change pas
