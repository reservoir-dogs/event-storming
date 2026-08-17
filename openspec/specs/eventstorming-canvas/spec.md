# eventstorming-canvas

## Purpose

TBD

## Requirements

### Requirement: Création d'un atelier d'event storming
Le système SHALL permettre à un expert métier de créer un nouvel atelier d'event storming vierge, identifié par un nom, sans nécessiter de compétence technique.

#### Scenario: Création d'un atelier vide
- **WHEN** l'utilisateur crée un nouvel atelier en lui donnant un nom
- **THEN** le système ouvre un canvas graphique vide prêt à recevoir des éléments

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

### Requirement: Conservation du type d'un post-it
Le système SHALL conserver, pour chaque post-it créé, le type d'élément d'event storming choisi à sa création, de façon à pouvoir le distinguer des autres types même lorsque plusieurs types partagent la même couleur, et SHALL conserver cette information après rechargement de l'atelier.

#### Scenario: Deux types de même couleur restent distincts
- **WHEN** un utilisateur crée un post-it "Point chaud" et un post-it "Système" (tous deux rouges) puis recharge l'atelier
- **THEN** le système restitue chacun des deux post-its avec l'apparence propre à son type, et continue de les traiter comme deux types différents

#### Scenario: Post-it créé avant l'introduction du marquage de type
- **WHEN** un utilisateur ouvre un atelier contenant des post-its créés avant que le type ne soit conservé explicitement
- **THEN** le système détermine leur type à partir de leur apparence, sans altérer ni perdre ces post-its

### Requirement: Organisation spatiale des éléments
Le système SHALL permettre de déplacer et positionner librement les éléments sur le canvas, et de redimensionner ceux qui ne sont pas des post-its (dont la taille est fixe, voir "Post-its de taille fixe et homogène"), y compris le long d'une timeline horizontale et de swimlanes (par acteur ou par contexte).

#### Scenario: Déplacement d'un élément
- **WHEN** l'utilisateur fait glisser un élément vers une nouvelle position du canvas
- **THEN** le système enregistre la nouvelle position de l'élément

#### Scenario: Organisation en swimlanes
- **WHEN** l'utilisateur crée une swimlane et y dépose des éléments
- **THEN** les éléments restent visuellement rattachés à cette swimlane lors des déplacements horizontaux

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

### Requirement: Création d'un lien depuis la sélection
Le système SHALL permettre de relier deux post-its sélectionnés par une commande dédiée, qui crée une flèche attachée du premier élément sélectionné vers le second, sans avoir à la tracer à la main.

#### Scenario: Deux post-its sélectionnés
- **WHEN** un utilisateur sélectionne deux post-its puis déclenche la commande de mise en relation
- **THEN** le système crée une flèche orientée du premier post-it sélectionné vers le second, attachée aux deux éléments

#### Scenario: Sélection inadaptée
- **WHEN** un utilisateur déclenche la commande de mise en relation alors que la sélection ne contient pas exactement deux post-its
- **THEN** la commande est indisponible et aucun lien n'est créé

### Requirement: Persistance de l'atelier
Le système SHALL sauvegarder automatiquement l'état complet du canvas (éléments, positions, liens, swimlanes) afin qu'un utilisateur retrouve l'atelier tel qu'il l'a laissé.

#### Scenario: Reprise d'un atelier existant
- **WHEN** l'utilisateur rouvre un atelier précédemment créé
- **THEN** le système restitue tous les éléments, leurs positions et leurs liens tels qu'ils étaient à la dernière modification

### Requirement: Navigation vers la liste des ateliers
Le système SHALL fournir depuis un atelier, via le menu principal, un moyen de revenir à la liste des ateliers, sans que cela n'affecte la sauvegarde de l'atelier quitté.

#### Scenario: Retour à la liste depuis un atelier
- **WHEN** un utilisateur sélectionne "Quitter l'atelier" dans le menu principal
- **THEN** le système affiche la liste des ateliers

### Requirement: Renommage d'un atelier existant
Le système SHALL permettre de modifier le nom d'un atelier existant, et SHALL répercuter ce nouveau nom partout où le nom de l'atelier est affiché.

#### Scenario: Renommage réussi
- **WHEN** un utilisateur modifie le nom d'un atelier existant et valide sa saisie
- **THEN** le système enregistre le nouveau nom et l'affiche désormais dans la liste des ateliers et dans l'atelier

#### Scenario: Tentative de renommage avec un nom vide
- **WHEN** un utilisateur tente d'enregistrer un nom vide pour un atelier
- **THEN** le système refuse la modification et conserve le nom précédent

### Requirement: Suppression d'un atelier existant
Le système SHALL permettre de supprimer définitivement un atelier depuis le menu principal, et SHALL demander confirmation avant toute suppression effective.

#### Scenario: Suppression confirmée
- **WHEN** un utilisateur sélectionne "Supprimer l'atelier" dans le menu principal et confirme la suppression
- **THEN** le système supprime définitivement l'atelier et affiche la liste des ateliers, qui ne le contient plus

#### Scenario: Suppression annulée
- **WHEN** un utilisateur sélectionne "Supprimer l'atelier" dans le menu principal mais annule la confirmation
- **THEN** l'atelier n'est pas supprimé et reste accessible

### Requirement: Absence de panneau d'édition
Le système SHALL ne proposer aucun panneau de réglage de style manuel : l'apparence des éléments (couleur, police, remplissage, trait) est entièrement déterminée par leur type, sans possibilité d'ajustement après création, et SHALL appliquer une police professionnelle fixe aux éléments du canvas.

#### Scenario: Sélection d'un élément
- **WHEN** un utilisateur sélectionne un élément du canvas
- **THEN** aucun panneau d'édition de style ne s'affiche

#### Scenario: Police homogène sur les nouveaux éléments
- **WHEN** un utilisateur crée un nouvel élément textuel sur le canvas
- **THEN** le système lui applique automatiquement la police professionnelle fixée pour l'atelier, sans intervention de l'utilisateur

#### Scenario: Pas de barre de mise en forme flottante
- **WHEN** un utilisateur édite le libellé d'un élément du canvas
- **THEN** aucune barre flottante de mise en forme du texte (gras, alignement) ne s'affiche

### Requirement: Un atelier ne comporte qu'une seule page
Le système SHALL considérer qu'un atelier ne comporte qu'une seule page de canvas, et SHALL masquer tout contrôle de gestion multi-pages.

#### Scenario: Absence de sélecteur de page
- **WHEN** un utilisateur consulte un atelier
- **THEN** aucun contrôle de création, sélection ou gestion de page n'est affiché

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

### Requirement: Post-its de taille fixe et homogène
Le système SHALL empêcher le redimensionnement manuel des post-its et SHALL leur donner à tous la même taille à la création, quel que soit leur type ou la longueur du libellé saisi.

#### Scenario: Sélection d'un post-it
- **WHEN** un utilisateur sélectionne un post-it
- **THEN** aucune poignée de redimensionnement ne s'affiche autour du post-it

#### Scenario: Post-its de types différents
- **WHEN** un utilisateur crée des post-its de types différents
- **THEN** tous les post-its créés ont exactement la même largeur et la même hauteur

#### Scenario: Saisie d'un libellé long
- **WHEN** un utilisateur saisit un libellé dont le texte dépasse l'espace disponible dans le post-it
- **THEN** la taille du post-it ne change pas

### Requirement: Liens sans libellé et de couleur neutre
Le système SHALL créer les liens (flèches) entre éléments avec une couleur toujours noire, indépendamment du type de post-it sélectionné juste avant, et SHALL empêcher d'y saisir un libellé.

#### Scenario: Création d'un lien après un post-it coloré
- **WHEN** un utilisateur trace un lien juste après avoir sélectionné ou créé un post-it d'un type donné
- **THEN** le lien s'affiche en noir, quelle que soit la couleur du type de post-it précédemment sélectionné

#### Scenario: Tentative de saisie de texte sur un lien
- **WHEN** un utilisateur double-clique sur un lien
- **THEN** le système n'ouvre aucun mode d'édition de libellé sur ce lien

### Requirement: Alignement assisté par grille et accrochage aux points
Le système SHALL afficher en permanence la grille du canvas et activer l'accrochage aux points (snapping) pour faciliter l'alignement des post-its, sans possibilité de désactiver ces réglages.

#### Scenario: Consultation d'un atelier
- **WHEN** un utilisateur consulte un atelier
- **THEN** la grille est visible sur le canvas et le déplacement des éléments s'accroche aux points d'alignement disponibles

### Requirement: Menu principal limité aux actions pertinentes pour l'atelier
Le système SHALL retirer du menu principal les actions d'insertion de contenu externe (intégration, média) qui ne correspondent pas à l'usage d'un atelier d'event storming.

#### Scenario: Consultation du menu principal
- **WHEN** un utilisateur ouvre le menu principal de l'atelier
- **THEN** aucune option d'insertion d'intégration ni de chargement de média n'y apparaît

#### Scenario: Présence de l'option pour quitter l'atelier
- **WHEN** un utilisateur ouvre le menu principal de l'atelier
- **THEN** une option "Quitter l'atelier" y est proposée

### Requirement: Outils d'ajout organisés en toolbar réductible positionnée au milieu du bord gauche
Le système SHALL présenter les outils d'ajout d'éléments sous forme de toolbar verticale positionnée au milieu du bord gauche du canvas, proposant une version réduite (couleur du post-it ou icône uniquement) et une version dépliée (libellé et raccourci clavier de chaque outil).

#### Scenario: Consultation en version réduite
- **WHEN** la toolbar est en version réduite
- **THEN** chaque outil est représenté par la couleur du post-it qu'il crée ou par une icône, sans libellé affiché

#### Scenario: Consultation en version dépliée
- **WHEN** un utilisateur déplie la toolbar
- **THEN** chaque outil affiche son libellé et son raccourci clavier

#### Scenario: Sélection d'un post-it au clavier
- **WHEN** un utilisateur appuie sur la touche associée à un type de post-it, sans être en train de saisir du texte ni d'éditer un élément
- **THEN** le système sélectionne ce type de post-it, comme s'il avait cliqué sur le bouton correspondant

#### Scenario: Pas d'interférence pendant la saisie de texte
- **WHEN** un utilisateur édite le libellé d'un élément ou saisit du texte dans un champ de formulaire
- **THEN** les touches de raccourci des post-its ne déclenchent aucun changement d'outil et sont interprétées comme du texte normal

#### Scenario: Raccourci partageant sa lettre avec un outil natif de tldraw
- **WHEN** un utilisateur appuie sur une touche associée à un type de post-it, alors que cette même touche correspondait auparavant à un raccourci natif de tldraw pour un autre outil
- **THEN** seul le type de post-it associé à cette touche est sélectionné, sans que l'outil natif ne s'active

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
