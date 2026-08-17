## Why

L'application event-storming n'a aujourd'hui aucune identité visuelle propre : la page d'accueil et l'écran de saisie du nom du participant sont en styles inline neutres (gris/noir), sans cohérence avec l'autre application de l'équipe, poker-planning, qui dispose déjà d'une palette et de conventions d'interaction définies (couleurs primary/accent, arrondis, transitions, retours visuels au survol). Adopter une charte visuelle commune sur ces deux écrans renforce la cohérence de marque entre les deux outils, sans toucher au canvas d'event storming (piloté par tldraw, hors périmètre).

## What Changes

- Définir une charte visuelle (palette de couleurs, rayons d'arrondi, ombres, transitions, états interactifs) inspirée de la palette et des conventions déjà utilisées dans poker-planning (couleurs `primary` vert et `accent` violet, boutons arrondis, transitions douces, retour visuel au survol/clic).
- Matérialiser cette charte sous forme de jetons de style réutilisables (variables CSS) dans `apps/web`, sans introduire Tailwind ni framer-motion (dépendances absentes d'event-storming aujourd'hui), pour rester cohérent avec l'approche CSS existante du projet.
- Appliquer cette charte à l'écran de saisie du nom du participant (`RequireParticipantName`) et à la page d'accueil (`HomePage`, `WorkshopCard`) : couleurs, boutons, focus, cartes.
- Ne pas modifier l'apparence du canvas d'event storming ni des composants tldraw (toolbar, menu principal, overlay) : ces éléments restent inchangés, conformément à la demande.

## Capabilities

### New Capabilities
- `visual-identity-charter` : définition et application d'une charte visuelle commune (palette, arrondis, transitions, états interactifs) sur la page d'accueil et l'écran de saisie du nom du participant.

### Modified Capabilities
- Aucune (la charte ne change aucun comportement fonctionnel déjà spécifié — ni "Identification obligatoire du participant", ni les exigences de `workshop-list-view` — uniquement leur apparence visuelle).

## Impact

- **Frontend** : `apps/web/src/components/RequireParticipantName.tsx`, `apps/web/src/pages/HomePage.tsx`, `apps/web/src/components/WorkshopCard.tsx` / `WorkshopCard.css`, nouveau fichier de jetons de style partagés (ex. `apps/web/src/styles/charter.css`).
- **Hors périmètre** : `apps/web/src/pages/WorkshopPage.tsx` et tous les composants tldraw (`EventStormingToolbar`, `EventStormingMainMenu`, `WorkshopOverlay`, shapes) restent inchangés.
- **Pas de nouvelle dépendance** : pas de Tailwind ni de framer-motion ; la charte est portée par des variables CSS et des transitions CSS classiques, en cohérence avec l'approche déjà adoptée pour `WorkshopCard.css`.
- **Tests** : mise à jour des tests frontend existants si des sélecteurs (texte, rôles) sont affectés par les changements visuels ; pas de changement de comportement attendu.
