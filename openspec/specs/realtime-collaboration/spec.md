# realtime-collaboration

## Purpose

TBD

## Requirements

### Requirement: Rejoindre une session collaborative
Le système SHALL permettre à plusieurs utilisateurs de rejoindre simultanément le même atelier d'event storming via un lien partageable, sans étape d'installation.

#### Scenario: Un second participant rejoint l'atelier
- **WHEN** un utilisateur ouvre le lien d'un atelier déjà ouvert par un autre participant
- **THEN** les deux utilisateurs voient le même canvas et peuvent tous deux le modifier

### Requirement: Visibilité de la présence des participants
Le système SHALL afficher en temps réel la présence des participants connectés à l'atelier, y compris leur nom, une couleur qui leur est propre et distincte de celle des autres participants connectés, et la position de leur curseur sur le canvas.

#### Scenario: Curseur visible en temps réel
- **WHEN** un participant déplace sa souris sur le canvas
- **THEN** les autres participants voient son curseur, affiché dans sa couleur attribuée, se déplacer en temps réel à la position exacte du pointeur

#### Scenario: Liste des participants connectés
- **WHEN** un utilisateur consulte l'atelier
- **THEN** le système affiche la liste des participants actuellement connectés, chacun identifié par son nom et sa couleur

#### Scenario: Couleurs distinctes entre participants
- **WHEN** un nouveau participant rejoint un atelier où d'autres participants sont déjà connectés
- **THEN** le système lui attribue une couleur qui n'est pas déjà utilisée par un participant actuellement connecté à cet atelier

#### Scenario: Affichage sans chevauchement avec les autres éléments d'interface
- **WHEN** un utilisateur consulte l'atelier
- **THEN** la liste des participants connectés est affichée sans se superposer aux autres panneaux flottants de l'interface (outils, en-tête de l'atelier)

### Requirement: Synchronisation temps réel des modifications
Le système SHALL propager à tous les participants connectés, en temps réel, toute création, modification, déplacement ou suppression d'élément sur le canvas.

#### Scenario: Propagation d'un ajout d'élément
- **WHEN** un participant ajoute un élément sur le canvas
- **THEN** les autres participants voient apparaître cet élément sans avoir à recharger la page

### Requirement: Édition concurrente sans perte de données
Le système SHALL gérer les modifications concurrentes de plusieurs participants sur des éléments distincts sans écraser leurs contributions respectives, et SHALL empêcher deux participants de modifier simultanément le contenu du même élément de façon incohérente.

#### Scenario: Modifications simultanées sur des éléments différents
- **WHEN** deux participants modifient chacun un élément différent au même moment
- **THEN** les deux modifications sont conservées et visibles par l'ensemble des participants

#### Scenario: Édition concurrente du même élément
- **WHEN** un participant commence à modifier le texte d'un élément déjà en cours d'édition par un autre participant
- **THEN** le système signale que l'élément est en cours d'édition afin d'éviter une perte de saisie

### Requirement: Identification obligatoire du participant
Le système SHALL exiger la saisie d'un nom avant de permettre l'accès à la liste des ateliers ou à un atelier, et SHALL réutiliser ce nom pour les visites suivantes du même participant.

#### Scenario: Premier accès sans nom enregistré
- **WHEN** un utilisateur accède à l'application sans avoir préalablement renseigné de nom
- **THEN** le système affiche un formulaire de saisie du nom et bloque l'accès à la liste des ateliers et aux ateliers tant qu'un nom valide n'a pas été saisi

#### Scenario: Accès ultérieur avec nom déjà enregistré
- **WHEN** un utilisateur qui a déjà renseigné un nom revient sur l'application
- **THEN** le système lui donne directement accès à la liste des ateliers sans redemander son nom

### Requirement: Copie du lien d'invitation d'un atelier
Le système SHALL permettre de copier dans le presse-papier, depuis un atelier, le lien permettant à une autre personne de le rejoindre, y compris lorsque l'API `navigator.clipboard` est indisponible (contexte non sécurisé, ex. déploiement en HTTP simple).

#### Scenario: Copie réussie du lien depuis le menu principal
- **WHEN** un utilisateur sélectionne l'option de copie du lien dans le menu principal de l'atelier
- **THEN** le système copie le lien de l'atelier dans le presse-papier

#### Scenario: Utilisation du lien copié par un nouveau participant
- **WHEN** une personne ouvre le lien copié
- **THEN** elle rejoint le même atelier que celui depuis lequel le lien a été copié

#### Scenario: Copie réussie en contexte non sécurisé
- **WHEN** un utilisateur sélectionne l'option de copie du lien alors que l'API `navigator.clipboard` n'est pas disponible dans son navigateur (ex. atelier servi en HTTP simple, sans HTTPS)
- **THEN** le système copie tout de même le lien de l'atelier dans le presse-papier via un mécanisme de repli, sans lever d'erreur visible pour l'utilisateur
