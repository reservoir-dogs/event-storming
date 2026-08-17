## ADDED Requirements

### Requirement: Rejoindre une session collaborative
Le système SHALL permettre à plusieurs utilisateurs de rejoindre simultanément le même atelier d'event storming via un lien partageable, sans étape d'installation.

#### Scenario: Un second participant rejoint l'atelier
- **WHEN** un utilisateur ouvre le lien d'un atelier déjà ouvert par un autre participant
- **THEN** les deux utilisateurs voient le même canvas et peuvent tous deux le modifier

### Requirement: Visibilité de la présence des participants
Le système SHALL afficher en temps réel la présence des participants connectés à l'atelier, y compris la position de leur curseur sur le canvas.

#### Scenario: Curseur visible en temps réel
- **WHEN** un participant déplace sa souris sur le canvas
- **THEN** les autres participants voient son curseur (identifié par son nom ou une couleur) se déplacer en temps réel

#### Scenario: Liste des participants connectés
- **WHEN** un utilisateur consulte l'atelier
- **THEN** le système affiche la liste des participants actuellement connectés

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
