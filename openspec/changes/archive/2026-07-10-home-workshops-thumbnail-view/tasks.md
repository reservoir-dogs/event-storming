## 1. Backend : stockage et API de l'aperçu

- [x] 1.1 Ajouter la colonne `thumbnail TEXT NULL` à la table `workshops` (`apps/server/src/db/database.ts`) et au type `Workshop`
- [x] 1.2 Ajouter une fonction `updateWorkshopThumbnail(id, thumbnail)` dans `database.ts`
- [x] 1.3 Ajouter la route `PATCH /api/workshops/:id/thumbnail` (`apps/server/src/routes/workshops.ts`) acceptant `{ thumbnail: string }` et renvoyant l'atelier mis à jour (404 si atelier inexistant)
- [x] 1.4 Ajouter/adapter le type `Workshop` côté frontend (`apps/web/src/api/workshops.ts`) avec le champ `thumbnail` optionnel, et une fonction d'appel API pour la nouvelle route

## 2. Génération de l'aperçu côté client

- [x] 2.1 Dans `apps/web/src/pages/WorkshopPage.tsx`, écouter les changements du store tldraw (`editor.store.listen`) et déclencher, avec un debounce (~4-5s après la dernière modification), la génération d'un aperçu via `editor.toImageDataUrl({ format: 'png', background: true, bounds: editor.getCurrentPageBounds() })` borné à une largeur cible raisonnable
- [x] 2.2 Envoyer l'aperçu généré au serveur via la nouvelle route `PATCH /api/workshops/:id/thumbnail`
- [x] 2.3 Déclencher une génération + envoi immédiats de l'aperçu au démontage de `WorkshopPage` / départ vers la liste des ateliers, si le board a été modifié depuis le dernier aperçu envoyé
- [x] 2.4 Gérer les cas limites (board vide, éditeur pas encore prêt) sans lever d'erreur bloquante

## 3. Composant WorkshopCard

- [x] 3.1 Créer `apps/web/src/components/WorkshopCard.tsx` recevant un `Workshop` en props et affichant le nom au-dessus, puis l'aperçu (`<img src={workshop.thumbnail}>`) ou un placeholder si `thumbnail` est absent, l'ensemble de la carte étant un `Link` vers `/atelier/:id`
- [x] 3.2 Ajouter le fichier de styles associé (`WorkshopCard.css`) gérant l'apparence de la vignette (bordure/ombre, padding, `:hover`), la zone d'aperçu (dimensions fixes, `object-fit`), le placeholder, et le débordement de texte du nom (`text-overflow: ellipsis`) avec `title` pour le nom complet

## 4. Mise en page de la page d'accueil

- [x] 4.1 Remplacer le rendu `<ul>` de `apps/web/src/pages/HomePage.tsx` par une grille (`display: grid`, `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`) affichant un `WorkshopCard` par atelier
- [x] 4.2 Conserver le tri existant (ordre renvoyé par l'API, déjà trié par `updated_at` décroissant) sans logique de tri supplémentaire côté client
- [x] 4.3 Ajouter/adapter le message d'état vide affiché lorsque la liste des ateliers est vide

## 5. Tests

- [x] 5.1 Mettre à jour/écrire les tests Vitest + Testing Library de `HomePage`/`WorkshopCard` pour vérifier le rendu (nom affiché au-dessus de l'aperçu, lien vers `/atelier/:id`, placeholder si pas d'aperçu)
- [x] 5.2 Ajouter un test pour le cas de la liste vide
- [x] 5.3 Ajouter un test pour la troncature/affichage du `title` sur un nom d'atelier long (si testable en jsdom)
- [x] 5.4 Ajouter un test backend pour la route `PATCH /api/workshops/:id/thumbnail` (succès, 404 sur atelier inexistant)

## 6. Vérification

- [x] 6.1 Lancer les tests frontend et backend et vérifier qu'ils passent
- [x] 6.2 Vérifier manuellement dans le navigateur : édition d'un board puis retour à l'accueil (aperçu à jour), atelier jamais ouvert (placeholder), plusieurs ateliers, aucun atelier, à différentes largeurs d'écran

## 7. Correctif : vignette visible sans F5 en quittant l'atelier

- [x] 7.1 Diagnostiquer le bug remonté en vérification manuelle : la vignette n'affichait l'aperçu à jour qu'après un F5 en quittant l'atelier juste après une modification (condition de course entre le rechargement de `HomePage` et la persistance serveur de l'aperçu)
- [x] 7.2 Ajouter `apps/web/src/api/thumbnailUpdates.ts` (pub/sub + cache en mémoire par `workshopId`) pour diffuser l'aperçu généré côté client dès qu'il est prêt, sans attendre le `PATCH` serveur
- [x] 7.3 Publier l'aperçu depuis `WorkshopPage.tsx` (`captureAndSendThumbnail`) juste après sa génération, avant l'envoi réseau
- [x] 7.4 Faire consulter ce cache par `HomePage.tsx` au chargement initial et s'y abonner pour mettre à jour la vignette concernée en direct
- [x] 7.5 Ajouter un test Vitest reproduisant la condition de course (aperçu diffusé après le premier chargement) et un test Playwright temporaire de bout en bout confirmant l'absence de besoin de F5
