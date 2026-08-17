## ADDED Requirements

### Requirement: Affichage des ateliers en vignettes sur la page d'accueil
La page d'accueil SHALL afficher la liste des ateliers sous forme de vignettes (cards) disposées en grille, plutôt qu'en liste textuelle simple.

#### Scenario: Un ou plusieurs ateliers existent
- **WHEN** l'utilisateur arrive sur la page d'accueil et qu'au moins un atelier existe
- **THEN** chaque atelier est affiché sous forme d'une vignette distincte dans une grille responsive

#### Scenario: Grille responsive selon la largeur d'écran
- **WHEN** la largeur de la fenêtre du navigateur change
- **THEN** le nombre de vignettes par ligne s'adapte automatiquement pour occuper l'espace disponible sans débordement horizontal

### Requirement: Contenu de la vignette d'atelier
Chaque vignette SHALL afficher le nom de l'atelier au-dessus, et un aperçu visuel du board de l'atelier en dessous.

#### Scenario: Nom affiché sur la vignette
- **WHEN** une vignette d'atelier est rendue
- **THEN** le nom de l'atelier (`workshop.name`) est visible au-dessus de l'aperçu du board sur la vignette

#### Scenario: Nom d'atelier très long
- **WHEN** le nom d'un atelier dépasse la largeur disponible de la vignette
- **THEN** le nom est tronqué visuellement (ellipsis) sans casser la mise en page de la grille, et reste consultable en entier via un attribut `title`

#### Scenario: Aperçu du board affiché
- **WHEN** un atelier possède un aperçu de board déjà généré
- **THEN** cet aperçu est affiché en dessous du nom, sous la vignette

#### Scenario: Aucun aperçu encore disponible
- **WHEN** un atelier n'a jamais été ouvert (ou son board n'a jamais généré d'aperçu)
- **THEN** la vignette affiche un état visuel neutre (placeholder) à la place de l'aperçu, sans erreur ni espace vide cassé

### Requirement: Génération et mise à jour de l'aperçu du board
Le système SHALL générer un aperçu visuel du board de l'atelier depuis l'éditeur de l'atelier, et SHALL le tenir à jour après modification du board sans nécessiter d'action manuelle de l'utilisateur.

#### Scenario: Génération après modification du board
- **WHEN** un utilisateur modifie le board d'un atelier puis cesse toute modification pendant un court instant
- **THEN** un nouvel aperçu du board est généré et enregistré, sans que l'utilisateur n'ait à déclencher cette action explicitement

#### Scenario: Génération à la sortie de l'atelier
- **WHEN** un utilisateur quitte un atelier après y avoir apporté des modifications
- **THEN** un aperçu à jour du board est généré et enregistré au moment de la sortie

#### Scenario: Aperçu visible après retour à l'accueil
- **WHEN** un utilisateur revient à la page d'accueil après avoir modifié le board d'un atelier
- **THEN** la vignette de cet atelier reflète l'état le plus récent du board disponible

### Requirement: Navigation depuis la vignette
Cliquer sur une vignette SHALL naviguer vers la page de l'atelier correspondant.

#### Scenario: Clic sur une vignette
- **WHEN** l'utilisateur clique n'importe où sur une vignette d'atelier
- **THEN** l'application navigue vers `/atelier/:id` de l'atelier correspondant

### Requirement: Tri des vignettes
Les vignettes SHALL être affichées dans l'ordre de tri existant des ateliers (dernière mise à jour en premier).

#### Scenario: Ordre d'affichage
- **WHEN** la liste des ateliers est chargée
- **THEN** les vignettes apparaissent triées par `updated_at` décroissant, comme le fait déjà l'API

### Requirement: État vide
La page d'accueil SHALL afficher un message adapté lorsqu'aucun atelier n'existe, plutôt qu'une grille vide.

#### Scenario: Aucun atelier
- **WHEN** l'utilisateur arrive sur la page d'accueil et qu'aucun atelier n'existe
- **THEN** un message indiquant l'absence d'atelier est affiché à la place de la grille de vignettes
