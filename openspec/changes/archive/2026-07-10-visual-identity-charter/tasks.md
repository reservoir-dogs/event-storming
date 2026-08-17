## 1. Jetons de style partagés

- [x] 1.1 Créer `apps/web/src/styles/charter.css` avec les variables CSS de palette `--color-primary-50` à `--color-primary-900` et `--color-accent-50` à `--color-accent-900`, reprenant exactement les valeurs de `poker-planning/frontend/tailwind.config.js`
- [x] 1.2 Ajouter dans ce même fichier les variables de convention : `--radius-md` (8px), `--shadow-card`, `--transition-fast` (~150-200ms), `--transition-base` (~300ms)
- [x] 1.3 Importer `charter.css` uniquement dans les points d'entrée de `RequireParticipantName.tsx` et `HomePage.tsx` (pas dans `WorkshopPage.tsx`)

## 2. Écran de saisie du nom (`RequireParticipantName`)

- [x] 2.1 Appliquer la couleur `primary` au titre "Bienvenue" et au bouton "Continuer" (fond `primary-600`, hover `primary-700`, texte blanc)
- [x] 2.2 Appliquer `--radius-md` et `--shadow-card` au panneau du formulaire
- [x] 2.3 Ajouter le retour visuel au survol/clic du bouton (légère mise à l'échelle + transition) et l'état désactivé (gris neutre, `cursor: not-allowed`) quand le nom est vide

## 3. Page d'accueil (`HomePage`)

- [x] 3.1 Appliquer la couleur `primary` au titre "Ateliers d'event storming" et au bouton "Créer un atelier" (mêmes règles qu'en 2.1)
- [x] 3.2 Ajouter le retour visuel au survol/clic et l'état désactivé sur le bouton "Créer un atelier"
- [x] 3.3 Adapter `WorkshopCard.css` : bordure en `--color-primary-200` (au lieu du gris neutre actuel), `--radius-md`, `--shadow-card`, transition d'élévation au survol déjà existante conservée

## 4. Vérification de la portée

- [x] 4.1 Vérifier que `WorkshopPage.tsx` et les composants tldraw (`EventStormingToolbar`, `EventStormingMainMenu`, `WorkshopOverlay`) n'importent pas `charter.css` et restent visuellement inchangés
- [x] 4.2 Vérifier que les tests frontend existants (sélecteurs par texte/rôle/placeholder) passent toujours sans modification liée au style

## 5. Tests et vérification manuelle

- [x] 5.1 Lancer la suite de tests frontend (Vitest) et vérifier qu'elle passe sans régression
- [x] 5.2 Vérifier manuellement dans le navigateur : écran de saisie du nom, page d'accueil (avec et sans ateliers), état désactivé des boutons, apparence inchangée d'un atelier ouvert
