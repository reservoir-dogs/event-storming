## ADDED Requirements

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
Le système SHALL créer les post-its avec une bordure solide colorée selon leur type et un fond teinté dans cette même couleur à faible opacité, plutôt qu'un fond de couleur pleine ou transparent.

#### Scenario: Création d'un post-it
- **WHEN** un utilisateur crée un post-it d'un type donné
- **THEN** le post-it s'affiche avec une bordure solide et un fond légèrement teinté, tous deux dans la couleur du type

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
