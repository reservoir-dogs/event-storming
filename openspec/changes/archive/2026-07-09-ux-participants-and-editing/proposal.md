## Why

Les ateliers sont aujourd'hui anonymes (aucun nom n'est demandé avant d'entrer) et la navigation/édition expose trop d'options génériques héritées de tldraw (styles, alignement) qui ne correspondent pas au vocabulaire de l'event storming. Les participants ne peuvent pas facilement s'identifier entre eux, revenir à la liste des ateliers, corriger le nom d'un atelier, ni partager un rendu de leur travail hors de l'outil. Ces frictions nuisent à l'animation d'un atelier en groupe.

## What Changes

- Demander un nom au participant avant qu'il accède à la liste des ateliers ou à un atelier ; ce nom est conservé pour la session.
- Afficher le nom des participants connectés à un atelier, avec une couleur distincte attribuée automatiquement à chacun.
- Afficher le curseur de chaque participant sur le canvas avec sa couleur et sa position en temps réel (renforce le comportement déjà partiellement présent).
- Ajouter un bouton de retour dans l'atelier pour revenir à la liste des ateliers.
- Ajouter un bouton pour copier le lien de l'atelier dans le presse-papier, afin d'inviter facilement une personne à le rejoindre.
- Permettre de renommer un atelier existant.
- **BREAKING** Retirer du panneau d'édition (bloc de droite) les sélecteurs de couleur, d'opacité, de police et d'alignement ; fixer une police professionnelle unique pour les post-its.
- Réorganiser le bloc d'outils de gauche en toolbar verticale avec un mode réduit (couleur du post-it ou icône de l'outil) et un mode déplié (libellé + raccourci clavier).
- Ajouter un export de l'atelier au format PNG.

## Capabilities

### New Capabilities
- `workshop-export`: export de l'état visuel du canvas d'un atelier en image PNG téléchargeable.

### Modified Capabilities
- `realtime-collaboration`: la présence des participants devient nominative et obligatoire — un nom est requis avant de rejoindre un atelier, une couleur distincte est attribuée à chaque participant, le curseur affiché reprend cette couleur et cette position en temps réel, et un bouton permet de copier le lien d'invitation de l'atelier.
- `eventstorming-canvas`: ajout d'une navigation de retour vers la liste des ateliers, possibilité de renommer un atelier existant, et simplification du panneau d'édition (suppression des réglages de couleur/opacité/police/alignement au profit d'une police fixe et professionnelle, toolbar de gauche repensée en version réduite/dépliée).

## Impact

- **Web** (`apps/web`): `HomePage.tsx` (saisie du nom avant la liste), `WorkshopPage.tsx` (bouton retour, renommage), `EventStormingToolbar.tsx` (toolbar verticale réduite/dépliée), `ParticipantsPanel.tsx` (noms + couleurs), suppression/adaptation du `StylePanel` tldraw par défaut, ajout d'une action d'export PNG (`exportAs` de tldraw).
- **Server** (`apps/server`): nouvelle route de renommage d'un atelier (`PATCH /api/workshops/:id`).
- Persistance locale du nom du participant (ex: `localStorage`) pour éviter de le redemander à chaque visite.
- Pas d'impact sur le format de stockage du canvas (le contenu des éléments n'est pas modifié, seule l'interface d'édition change).
