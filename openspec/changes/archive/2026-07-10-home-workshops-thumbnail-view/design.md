## Context

`HomePage.tsx` (`apps/web/src/pages/HomePage.tsx`) récupère la liste des ateliers via `apps/web/src/api/workshops.ts` (`Workshop { id, name, created_at, updated_at }`) et l'affiche dans une `<ul>` avec styles inline, triée par `updated_at` décroissant côté serveur. Le projet n'utilise aucune librairie UI (pas de Material/Tailwind/styled-components) : tous les styles existants sont en JSX inline. Il n'existe aucun composant "card" réutilisable dans `apps/web/src/components/`.

Le contenu réel du board n'est pas stocké dans une colonne exploitable de la table `workshops` : il vit dans des tables SQLite générées dynamiquement par `@tldraw/sync-core` (`SQLiteSyncStorage`, préfixe `room_<workshopId>_...`, gérées par `apps/server/src/sync/roomManager.ts`). La colonne `workshop_snapshots.snapshot` existante dans `database.ts` est du code mort (jamais lue/écrite). Il n'y a ni sauvegarde REST/debounce côté client aujourd'hui (persistance continue via le WebSocket de sync, cf. `TLSocketRoom.onChange` qui ne fait que `touchWorkshop`), ni mécanisme d'upload de fichiers/assets côté serveur (les assets tldraw collés dans le canvas sont encodés en base64 directement dans le document, via `inlineBase64AssetStore`). Le serveur n'a donc pas de moyen de "rendre" une image du board : `tldraw` (v5.2.2) n'expose son API de rendu/export (`editor.toImage()`, `editor.toImageDataUrl()`, `editor.getSvgElement()`) que côté client, sur une instance `Editor` réellement montée dans le navigateur (`WorkshopPage.tsx`).

## Goals / Non-Goals

**Goals:**
- Afficher chaque atelier sous forme de vignette (card) montrant, au-dessus l'un de l'autre : le nom de l'atelier puis un aperçu visuel de son board, dans une grille responsive.
- Fournir un composant `WorkshopCard` isolé et réutilisable.
- Générer et persister un aperçu (thumbnail) du board à un ou plusieurs moments pertinents, sans dégrader l'expérience d'édition du canvas ni imposer une nouvelle dépendance lourde (pas de rendu serveur/headless browser).
- Conserver le comportement de navigation (clic → `/atelier/:id`) et le tri existant.
- Gérer proprement l'état vide (aucun atelier) et l'état "pas encore d'aperçu" (atelier existant mais jamais ouvert/rendu).

**Non-Goals:**
- Rendu serveur de l'aperçu (ex: headless Chromium) : hors scope, jugé disproportionné pour ce projet (pas d'infra de ce type aujourd'hui).
- Historique de plusieurs aperçus/versions : seul le dernier aperçu est conservé.
- Pagination, recherche ou filtrage de la liste des ateliers.
- Introduction d'une librairie UI (Material/Tailwind) : on reste en cohérence avec le style inline existant, éventuellement complété par un fichier CSS dédié si nécessaire pour les media queries.

## Decisions

- **Grille CSS responsive** : utiliser CSS Grid (`display: grid`, `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`) plutôt que Flexbox, pour obtenir un nombre de colonnes qui s'adapte automatiquement à la largeur d'écran sans media queries manuelles. Alternative envisagée : Flexbox avec `flex-wrap` — rejetée car moins précise pour un alignement en grille régulière.
- **Nouveau composant `WorkshopCard`** (`apps/web/src/components/WorkshopCard.tsx`) : reçoit un `Workshop` en props, encapsule le rendu (nom + lien) et les styles de la vignette. Garde `HomePage.tsx` focalisé sur le fetch/état et la disposition en grille.
- **Media query pour les styles** : comme le projet n'a pas de fichier CSS dans `apps/web/src`, deux options : (a) styles inline avec valeurs fixes (pas de vraie media query possible), (b) créer un petit fichier CSS (`WorkshopCard.css` ou `HomePage.css`) importé pour permettre `@media` et `:hover`. On choisit (b) car `grid-template-columns: repeat(auto-fill, minmax(...))` couvre déjà la responsivité sans media query, et un léger `:hover` (ombre/élévation) améliore l'affordance clic — non réalisable proprement en inline React sans état supplémentaire.
- **Contenu de la vignette** : le nom de l'atelier affiché au-dessus, et l'aperçu du board affiché en dessous, la carte entière étant cliquable (wrap `Link` autour du contenu) plutôt qu'un simple lien texte, pour une meilleure zone de clic.
- **Génération de l'aperçu : côté client, dans `WorkshopPage.tsx`, pas côté serveur.** Le serveur n'a pas de DOM et ne peut pas exécuter tldraw pour rendre une image des tables SQLite de sync ; introduire un rendu headless (Playwright/Chromium) serait une dépendance lourde et disproportionnée pour ce projet. On utilise donc l'`Editor` déjà monté côté client, via `editor.toImageDataUrl({ format: 'png', background: true, bounds: editor.getCurrentPageBounds() })`, redimensionné/borné à une largeur cible (ex. ~480px) pour garder un payload raisonnable.
- **Moment de génération (décision) : deux déclencheurs complémentaires, tous deux côté client**
  1. **Debounced sur les modifications du board** : abonnement à `editor.store.listen(...)` (ou équivalent), avec un debounce (ex. 4-5s après la dernière modification) déclenchant la génération + l'envoi de l'aperçu au serveur. Alternative rejetée : générer à chaque mutation reçue par le serveur de sync — impossible, le serveur ne peut pas rendre d'image.
  2. **Au moment de quitter l'atelier** (démontage de `WorkshopPage`/navigation vers la liste, cf. requirement existant "Navigation vers la liste des ateliers") : génération immédiate d'un dernier aperçu à jour, pour ne pas dépendre uniquement du debounce si l'utilisateur quitte juste après une modification.
  - Alternative rejetée : génération paresseuse côté serveur à la demande (au chargement de la home) — impossible sans rendu serveur (cf. Non-Goals).
  - Alternative rejetée : génération uniquement à la fermeture de l'onglet via `beforeunload` — peu fiable (le navigateur limite fortement le travail asynchrone dans ce hook) et ne couvre pas la navigation interne vers la liste.
- **Transport et stockage** : l'aperçu est envoyé en `PATCH /api/workshops/:id/thumbnail` (nouvelle route dédiée, pour ne pas mélanger avec la validation "nom non vide" de la route de renommage existante) avec `{ thumbnail: string }` (data URL PNG base64), stocké tel quel dans une nouvelle colonne `workshops.thumbnail TEXT NULL`. Alternative envisagée : réutiliser la table `workshop_snapshots` existante — rejetée car son nom/rôle prêtent à confusion (snapshot de document tldraw, pas image) et elle est actuellement du code mort à ne pas réactiver pour un usage différent.
- **Absence d'aperçu** : `thumbnail` reste `NULL` tant qu'aucune génération n'a eu lieu (atelier jamais ouvert après cette évolution) ; la `WorkshopCard` affiche alors un placeholder visuel neutre à la place de l'image.
- **Diffusion client immédiate de l'aperçu (correctif)** : en quittant l'atelier juste après une modification, `navigate('/')` démonte `WorkshopPage` et monte `HomePage` quasi instantanément, alors que la génération de l'image (`toImageDataUrl`) puis son enregistrement via `PATCH /api/workshops/:id/thumbnail` prennent un peu de temps. `HomePage` chargeait alors la liste avant que le serveur n'ait la nouvelle valeur, et n'affichait l'aperçu à jour qu'après un rechargement manuel (F5). Pour éviter ce problème, un petit module en mémoire (`apps/web/src/api/thumbnailUpdates.ts`, pub/sub + cache par `workshopId`) diffuse l'aperçu généré côté client dès qu'il est prêt, indépendamment de la persistance serveur : `WorkshopPage` publie l'aperçu juste après l'avoir généré (avant même d'attendre la réponse du `PATCH`), et `HomePage` s'y abonne pour mettre à jour la vignette concernée en direct, en plus de consulter ce cache au chargement initial. Alternative rejetée : faire attendre la navigation (`navigate('/')`) jusqu'à la fin du `PATCH` — rejetée car cela introduirait un délai perceptible à chaque sortie d'atelier et ne couvrirait pas les sorties hors du menu (bouton précédent du navigateur).

## Risks / Trade-offs

- [Nom d'atelier très long qui déborde de la vignette] → Mitigation : `overflow-wrap`/`text-overflow: ellipsis` avec `title` HTML pour afficher le nom complet au survol.
- [Grand nombre d'ateliers rend la page très longue à défiler] → Mitigation : hors scope pour cette itération (pas de pagination) ; la grille reste fonctionnelle, juste plus longue.
- [Introduction d'un fichier CSS alors que le projet n'en a aucun] → Mitigation : périmètre limité à ce composant, ne change pas les conventions globales du projet ; à documenter si le pattern doit être généralisé plus tard.
- [Croissance de la base SQLite : chaque aperçu PNG en base64 alourdit la ligne `workshops`] → Mitigation : borner la résolution/largeur cible de l'image générée, accepter le compromis pour le volume d'ateliers actuel du projet.
- [Génération manquée si le navigateur se ferme brutalement juste après une modification, sans passage par le démontage de la page] → Mitigation : acceptable, l'aperçu reste simplement légèrement daté jusqu'à la prochaine ouverture/fermeture normale de l'atelier ; pas de garantie de fraîcheur stricte requise par la proposition.
- [Débit de mises à jour d'aperçu si plusieurs utilisateurs éditent le même atelier en simultané (collaboration temps réel)] → Mitigation : chaque client applique son propre debounce indépendamment ; la dernière écriture reçue par le serveur gagne (comportement "last write wins", cohérent avec le reste du modèle de synchronisation).

## Migration Plan

Changement purement frontend, sans migration de données ni de schéma. Déploiement standard via la pipeline existante (pas d'étape de rollback spécifique au-delà d'un revert du commit).
