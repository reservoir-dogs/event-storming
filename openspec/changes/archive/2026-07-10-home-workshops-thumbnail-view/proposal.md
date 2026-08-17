## Why

La page d'accueil (`HomePage.tsx`) affiche actuellement les ateliers sous forme de simple liste texte (`<ul>`/`<li>`) sans aucune identité visuelle : un utilisateur qui gère plusieurs ateliers ne peut pas les distinguer ou les repérer rapidement au survol de la page. Passer à un affichage en vignettes (cards) montrant un aperçu visuel du board (canvas tldraw) avec le nom de l'atelier au-dessus améliore fortement la reconnaissance visuelle (on retrouve un atelier par la forme de son contenu, pas seulement son nom).

## What Changes

- Remplacer la liste `<ul>` de la page d'accueil par une grille de vignettes (cards).
- Créer un composant `WorkshopCard` réutilisable affichant : le nom de l'atelier au-dessus, et en dessous un aperçu image du board de l'atelier (ou un état vide/placeholder si aucun aperçu n'est encore disponible). La carte reste cliquable pour naviguer vers `/atelier/:id`.
- Générer côté client (dans l'éditeur tldraw, seul endroit où le canvas est réellement rendu) une image d'aperçu (thumbnail) du board, et la transmettre au serveur pour persistance. Le moment de génération est un détail de conception (voir design.md) : déclenchement après modification du board (avec un debounce) et au moment où l'utilisateur quitte l'atelier, afin de garder l'aperçu à jour sans surcharger le serveur à chaque frappe.
- Ajouter un champ `thumbnail` au modèle `Workshop` et un point d'API pour l'enregistrer.
- Adapter la mise en page de `HomePage.tsx` en grille responsive (plusieurs vignettes par ligne selon la largeur d'écran).
- Conserver le tri existant (par `updated_at` décroissant) et le comportement de navigation actuel.
- Gérer les cas d'ateliers en nombre nul (état vide de la page), d'ateliers en nombre élevé (grille sans dégradation) et d'ateliers sans aperçu encore généré (placeholder sur la vignette).

## Capabilities

### New Capabilities
- `workshop-list-view`: Affichage de la liste des ateliers sur la page d'accueil sous forme de vignettes (cards) présentant un aperçu visuel du board et le nom de l'atelier, et permettant d'y accéder. Inclut la génération et la persistance de l'aperçu du board.

### Modified Capabilities
- Aucune (aucune spec existante ne couvre l'affichage de la page d'accueil ; la génération de l'aperçu est un mécanisme de support pour cette capability, elle ne modifie aucun comportement existant du canvas lui-même).

## Impact

- **Frontend** : `apps/web/src/pages/HomePage.tsx` (remplacement du rendu de la liste), nouveau composant `apps/web/src/components/WorkshopCard.tsx`, `apps/web/src/pages/WorkshopPage.tsx` (capture de l'aperçu via l'API tldraw `editor.toImageDataUrl()`).
- **Backend** : nouvelle colonne `thumbnail` sur la table `workshops` (`apps/server/src/db/database.ts`) et nouveau point d'API (`apps/server/src/routes/workshops.ts`) pour enregistrer l'aperçu généré, sans toucher au comportement existant de renommage/suppression.
- **Pas de librairie UI existante** dans le projet (styles inline) : les styles des vignettes seront écrits en JSX inline ou CSS dédié, en cohérence avec l'existant.
- **Tests** : mise à jour des tests frontend (Vitest/Testing Library) couvrant le rendu de `HomePage`/`WorkshopCard`, et tests backend pour le nouveau point d'API.
