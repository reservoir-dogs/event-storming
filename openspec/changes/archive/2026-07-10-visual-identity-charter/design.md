## Context

`apps/web` (event-storming) n'a aucune identité visuelle définie : `HomePage.tsx`, `WorkshopCard.tsx`/`.css` et `RequireParticipantName.tsx` utilisent des couleurs neutres ad hoc (`#dee2e6`, `#495057`, `#adb5bd`, `#e03131`) en styles inline ou CSS simple, sans palette ni jetons partagés. Le projet n'utilise aucune librairie UI (pas de Tailwind, pas de framer-motion) : c'est une décision déjà actée lors d'un changement précédent (`home-workshops-thumbnail-view`), pour rester cohérent avec l'approche CSS existante.

`poker-planning` (dépôt sœur, `c:/Projets/DOne/poker-planning`) a une identité visuelle définie via Tailwind (`frontend/tailwind.config.js`) :
- Palette `primary` (vert), du 50 au 900, base `primary-500 = #32B98C`.
- Palette `accent` (violet), du 50 au 900, base `accent-500 = #672575`.
- Boutons arrondis (`rounded-lg` ≈ 8px), gras (`font-bold`/`font-medium`), transitions `transition-all duration-300` ou `transition-colors duration-200`.
- Retour visuel au survol/clic via framer-motion (`whileHover={{ scale: 1.05 }}`, `whileTap={{ scale: 0.95 }}`).
- Cartes/panneaux : fond blanc ou semi-transparent flouté (`bg-white/50 backdrop-blur-xl`), bordure fine `primary-200`, ombre douce (`shadow-sm`).
- États désactivés : fond `gray-400`, texte `gray-200`, `cursor-not-allowed`.

Le tldraw canvas (`WorkshopPage.tsx` et les composants qui l'entourent : `EventStormingToolbar`, `EventStormingMainMenu`, `WorkshopOverlay`) reste **hors périmètre** : il est piloté par le système de style propre à tldraw et ne doit pas être modifié.

## Goals / Non-Goals

**Goals:**
- Porter la palette `primary`/`accent` de poker-planning (mêmes valeurs hexadécimales) dans event-storming, sous forme de jetons CSS réutilisables.
- Reprendre les conventions d'interaction de poker-planning (arrondis, transitions, retour visuel au survol/clic, état désactivé) en CSS classique (sans framer-motion).
- Appliquer ces jetons et conventions à `RequireParticipantName` (écran de saisie du nom) et à `HomePage`/`WorkshopCard` (page d'accueil).
- Ne rien changer au comportement fonctionnel existant (formulaires, validations, navigation) : uniquement l'apparence.

**Non-Goals:**
- Modifier l'apparence du canvas d'event storming ou de tout composant tldraw (`WorkshopPage.tsx`, toolbar, menu principal, overlay, shapes).
- Introduire Tailwind CSS ou framer-motion comme dépendances : la charte est reproduite en CSS natif (variables + transitions), pas avec les mêmes outils que poker-planning.
- Refonte complète de la mise en page (la structure de `HomePage`/`RequireParticipantName` reste la même ; seuls couleurs, rayons, ombres, transitions et retours interactifs changent).
- Mutualiser un package de design partagé entre les deux dépôts (chacun reste un projet indépendant ; la charte est dupliquée/adaptée, pas importée en dépendance croisée).

## Decisions

- **Jetons de style en variables CSS plutôt que Tailwind** : créer `apps/web/src/styles/charter.css` définissant des variables CSS (`--color-primary-50` à `--color-primary-900`, `--color-accent-50` à `--color-accent-900`, `--radius-md`, `--shadow-card`, `--transition-fast`, `--transition-base`) reprenant les valeurs exactes de `poker-planning/frontend/tailwind.config.js`. Alternative rejetée : installer Tailwind dans `apps/web` — écarté pour rester cohérent avec le choix déjà fait de ne pas introduire de librairie UI, et pour limiter le changement à ce qui est nécessaire (deux écrans, pas toute l'app).
- **Portée strictement limitée à deux écrans** : seuls `RequireParticipantName.tsx` et `HomePage.tsx`/`WorkshopCard.tsx`/`WorkshopCard.css` importent `charter.css` et utilisent ses variables. `WorkshopPage.tsx` et les composants tldraw ne l'importent pas et ne sont pas modifiés, conformément à la demande explicite.
- **Reproduction du retour visuel hover/tap en CSS pur** : au lieu de framer-motion (`whileHover`/`whileTap`), utiliser `transition: transform var(--transition-fast)` avec `:hover { transform: scale(1.02) }` et `:active { transform: scale(0.98) }` sur les boutons — un échelle légèrement plus discrète qu'en poker-planning (1.05/0.95) car appliquée via CSS statique plutôt qu'une animation ressort (spring) de framer-motion, pour éviter un effet trop abrupt sans la physique d'amortissement de la librairie.
- **Couleurs primary/accent, mais neutres/erreurs conservés** : les couleurs de marque (`primary`, `accent`) remplacent les couleurs d'accent ad hoc existantes (liens, bouton principal, focus), mais les gris neutres (bordures, texte secondaire) et le rouge d'erreur (`#e03131`) restent des couleurs sensées standards, non définies par la charte de poker-planning (qui ne les expose pas explicitement dans les deux fichiers examinés) — pas de sur-ingénierie sur des cas non couverts par la source d'inspiration.
- **Boutons** : bouton principal (« Créer un atelier », « Continuer ») en `primary-600` avec texte blanc, hover `primary-700`, `border-radius: var(--radius-md)` (8px), `font-weight: 600`, transitions 200-300ms — reprend le style des boutons principaux de poker-planning (`bg-primary-600 hover:bg-primary-700 text-white`, `rounded-lg`, `font-bold`/`font-medium`, `transition-all duration-300`).
- **Cartes** (`WorkshopCard`, panneau de `RequireParticipantName`) : bordure fine `primary-200`, ombre douce (`--shadow-card`), légère élévation au survol (translation + ombre plus marquée, déjà en place pour `WorkshopCard`, dont les couleurs de bordure passent de gris neutre à `primary-200`).
- **Titre principal** : couleur `primary-600`, gras, reprenant `text-primary-600 font-bold` du `Header` de poker-planning.

## Risks / Trade-offs

- [Divergence visuelle progressive entre event-storming (CSS natif) et poker-planning (Tailwind) si l'un des deux évolue sa palette sans que l'autre soit mis à jour] → Mitigation : les valeurs sont documentées et commentées dans `charter.css` avec leur origine (poker-planning `tailwind.config.js`), pour faciliter une resynchronisation manuelle future si la palette source change.
- [Reproduire les micro-interactions de framer-motion en CSS pur peut donner un rendu légèrement différent (moins fluide/moins physique)] → Mitigation : acceptable pour ce périmètre restreint (deux écrans simples, pas d'animations complexes comme le flip de carte de poker-planning) ; pas de besoin de la dépendance pour si peu d'usages.
- [Changement visuel sur `HomePage`/`RequireParticipantName` peut casser des sélecteurs de test basés sur des styles inline existants] → Mitigation : les tests actuels sélectionnent par texte/rôle/placeholder, pas par style ; à vérifier lors de l'implémentation et corriger si nécessaire.

## Migration Plan

Changement purement visuel côté frontend, sans migration de données ni changement d'API. Déploiement standard via la pipeline existante ; rollback possible par revert du commit sans effet de bord sur le backend ou les données.
