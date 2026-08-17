## ADDED Requirements

### Requirement: Conservation du type d'un post-it
Le système SHALL conserver, pour chaque post-it créé, le type d'élément d'event storming choisi à sa création, de façon à pouvoir le distinguer des autres types même lorsque plusieurs types partagent la même couleur, et SHALL conserver cette information après rechargement de l'atelier.

#### Scenario: Deux types de même couleur restent distincts
- **WHEN** un utilisateur crée un post-it "Point chaud" et un post-it "Système" (tous deux rouges) puis recharge l'atelier
- **THEN** le système restitue chacun des deux post-its avec l'apparence propre à son type, et continue de les traiter comme deux types différents

#### Scenario: Post-it créé avant l'introduction du marquage de type
- **WHEN** un utilisateur ouvre un atelier contenant des post-its créés avant que le type ne soit conservé explicitement
- **THEN** le système détermine leur type à partir de leur apparence, sans altérer ni perdre ces post-its

### Requirement: Création d'un élément par glisser-déposer depuis la barre d'outils
Le système SHALL permettre de créer un post-it en faisant glisser un type d'élément depuis la barre d'outils jusqu'au canvas : le post-it est créé à l'endroit du dépôt, dans le type glissé, et sa saisie de libellé s'ouvre immédiatement, comme pour une création au clic.

#### Scenario: Dépôt sur le canvas
- **WHEN** un utilisateur fait glisser le type "Domain Event" de la barre d'outils et le dépose sur une zone libre du canvas
- **THEN** le système crée à cet endroit un post-it de type "Domain Event" et ouvre la saisie de son libellé

#### Scenario: Dépôt dans un couloir de nage
- **WHEN** un utilisateur dépose un type d'élément à l'intérieur d'un couloir de nage
- **THEN** le post-it créé est rattaché à ce couloir de nage, comme s'il y avait été créé au clic

#### Scenario: Dépôt hors du canvas
- **WHEN** un utilisateur relâche le glisser-déposer en dehors du canvas
- **THEN** aucun post-it n'est créé et le canvas reste inchangé

### Requirement: Création d'un lien depuis la sélection
Le système SHALL permettre de relier deux post-its sélectionnés par une commande dédiée, qui crée une flèche attachée du premier élément sélectionné vers le second, sans avoir à la tracer à la main.

#### Scenario: Deux post-its sélectionnés
- **WHEN** un utilisateur sélectionne deux post-its puis déclenche la commande de mise en relation
- **THEN** le système crée une flèche orientée du premier post-it sélectionné vers le second, attachée aux deux éléments

#### Scenario: Sélection inadaptée
- **WHEN** un utilisateur déclenche la commande de mise en relation alors que la sélection ne contient pas exactement deux post-its
- **THEN** la commande est indisponible et aucun lien n'est créé

## MODIFIED Requirements

### Requirement: Ajout d'éléments typés sur le canvas
Le système SHALL permettre d'ajouter sur le canvas des éléments typés représentant les briques d'un event storming (domain event, commande, acteur, agrégat, politique, point chaud, question, système, message d'intégration), chaque type étant visuellement distinct (couleur et intensité de fond dédiées).

#### Scenario: Ajout d'un domain event
- **WHEN** l'utilisateur ajoute un élément de type "domain event" sur le canvas et saisit son libellé
- **THEN** le système affiche un post-it orange portant le libellé saisi

#### Scenario: Ajout d'un système
- **WHEN** l'utilisateur ajoute un élément de type "système" sur le canvas et saisit son libellé
- **THEN** le système affiche un post-it rouge à fond teinté uni portant le libellé saisi

#### Scenario: Ajout d'un message d'intégration
- **WHEN** l'utilisateur ajoute un élément de type "message d'intégration" sur le canvas et saisit son libellé
- **THEN** le système affiche un post-it vert à fond teinté uni portant le libellé saisi

#### Scenario: Distinction visuelle des types
- **WHEN** l'utilisateur ajoute des éléments de types différents sur le canvas
- **THEN** chaque type d'élément est rendu avec une combinaison couleur et intensité de fond qui lui est propre, cohérente sur tout le canvas

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
- **THEN** l'aperçu de chaque type reflète à la fois sa couleur et son intensité de fond, de sorte que deux types de même couleur ne présentent pas le même aperçu

### Requirement: Mise en relation des éléments
Le système SHALL permettre de relier deux éléments du canvas par une flèche pour représenter un enchaînement logique ou temporel (ex: commande → domain event). Le système SHALL faire apparaître, au survol d'un post-it, des poignées de connexion sur ses bords, depuis lesquelles un glissé jusqu'à un autre post-it crée directement une flèche attachée aux deux éléments, la cible potentielle étant mise en évidence pendant le glissé. L'outil "Lien" à tracer manuellement SHALL rester disponible.

#### Scenario: Création d'un lien entre deux éléments
- **WHEN** l'utilisateur trace un lien entre un élément source et un élément cible
- **THEN** le système affiche une flèche orientée entre les deux éléments et conserve ce lien après rechargement

#### Scenario: Apparition des poignées de connexion
- **WHEN** l'utilisateur survole un post-it avec l'outil de sélection actif
- **THEN** le système affiche des poignées de connexion sur les bords de ce post-it, et les masque dès que le pointeur quitte le post-it sans démarrer de glissé

#### Scenario: Lien créé depuis une poignée de connexion
- **WHEN** l'utilisateur fait glisser une poignée de connexion d'un post-it jusqu'à un autre post-it et relâche
- **THEN** le système crée une flèche orientée du premier post-it vers le second, attachée aux deux éléments, et repasse à l'outil de sélection

#### Scenario: Mise en évidence de la cible pendant le glissé
- **WHEN** l'utilisateur, en cours de glissé depuis une poignée de connexion, passe au-dessus d'un post-it susceptible de recevoir le lien
- **THEN** ce post-it est mis en évidence visuellement pour indiquer que le lien s'y attachera au relâchement

#### Scenario: Glissé relâché dans le vide
- **WHEN** l'utilisateur relâche un glissé démarré depuis une poignée de connexion sur une zone du canvas ne contenant aucun post-it
- **THEN** aucun lien n'est créé et le canvas reste inchangé
