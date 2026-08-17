## ADDED Requirements

### Requirement: Palette de couleurs partagée avec poker-planning
La page d'accueil et l'écran de saisie du nom du participant SHALL utiliser la même palette de couleurs `primary` (vert) et `accent` (violet) que l'application poker-planning, pour les éléments interactifs et de mise en avant (titres, boutons, focus).

#### Scenario: Titre de la page d'accueil
- **WHEN** l'utilisateur consulte la page d'accueil
- **THEN** le titre principal est affiché dans la couleur `primary` de la charte

#### Scenario: Bouton principal
- **WHEN** un bouton d'action principale (ex. "Créer un atelier", "Continuer") est affiché
- **THEN** il utilise la couleur `primary` de la charte comme fond, avec un texte lisible en contraste

### Requirement: Conventions d'interaction partagées
Les boutons et cartes de la page d'accueil et de l'écran de saisie du nom SHALL reprendre les conventions visuelles de poker-planning : coins arrondis, ombre douce, transition fluide, et retour visuel au survol et au clic.

#### Scenario: Survol d'un bouton
- **WHEN** un utilisateur survole un bouton d'action
- **THEN** le bouton change légèrement d'apparence (couleur et/ou taille) de façon progressive, sans changement brusque

#### Scenario: Clic sur un bouton
- **WHEN** un utilisateur clique sur un bouton d'action
- **THEN** le bouton fournit un retour visuel immédiat distinct de l'état survolé

#### Scenario: Bouton désactivé
- **WHEN** un bouton d'action est désactivé (ex. champ requis vide)
- **THEN** il est visuellement distinct (couleur neutre, curseur "non autorisé") des boutons actifs

#### Scenario: Carte de la page d'accueil
- **WHEN** une vignette d'atelier (`WorkshopCard`) est affichée
- **THEN** elle présente des coins arrondis, une bordure fine dans la teinte de la charte, et une ombre douce qui s'accentue légèrement au survol

### Requirement: Portée limitée au hors-canvas
La charte visuelle SHALL s'appliquer uniquement à la page d'accueil et à l'écran de saisie du nom du participant, et SHALL laisser inchangée l'apparence du canvas d'event storming et de ses composants (toolbar, menu principal, overlay).

#### Scenario: Consultation d'un atelier
- **WHEN** un utilisateur ouvre un atelier existant
- **THEN** le canvas, la toolbar et le menu principal conservent leur apparence actuelle, inchangée par la charte

#### Scenario: Retour à la page d'accueil
- **WHEN** un utilisateur revient de l'atelier à la page d'accueil
- **THEN** la page d'accueil affiche la charte visuelle (palette et conventions), sans dépendre de l'apparence du canvas
