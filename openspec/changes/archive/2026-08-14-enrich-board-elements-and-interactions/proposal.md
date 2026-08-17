## Why

La palette de la barre d'outils ne couvre pas deux briques courantes d'un event storming technique : les **systèmes externes** et les **messages d'intégration** échangés entre eux. Par ailleurs, tracer un lien entre deux post-its impose aujourd'hui de sélectionner l'outil « Lien » puis de viser à la main les deux rectangles, et créer un post-it demande deux gestes distincts (choisir l'outil, puis cliquer sur le board) : deux frictions qui ralentissent un atelier animé en direct, où la vitesse de saisie compte autant que le résultat.

## What Changes

- **Deux nouveaux types de post-its** dans la barre de gauche : « Système » (rouge) et « Message d'intégration » (vert), créés comme les autres post-its (bordure solide, fond teinté, taille fixe).
- **Point chaud et Question passent en fond quadrillé**, en conservant leurs couleurs actuelles (rouge et vert) : le motif de remplissage devient le discriminant visuel vis-à-vis de « Système » et « Message d'intégration », qui partagent ces deux couleurs.
- **L'identité de type d'un post-it est désormais portée par le post-it lui-même** (et non plus déduite de sa seule couleur), pour rester déterminable alors que deux types partagent une même couleur.
- **Point chaud et Question sont exclus de l'export Mermaid** : ils matérialisent des incertitudes d'atelier, pas des étapes du flux. Les liens dont une extrémité est un point chaud ou une question sont exclus avec eux, pour ne pas produire d'arête vers un nœud absent.
- **Nouvelle façon de relier deux post-its** : au survol d'un post-it, des poignées de connexion apparaissent sur ses bords ; un glissé depuis une poignée jusqu'à un autre post-it crée directement un lien attaché aux deux éléments, avec surbrillance de la cible pendant le glissé. En complément, une commande « Relier la sélection » crée le lien entre deux post-its sélectionnés. L'outil « Lien » actuel reste disponible.
- **Création de post-it par glisser-déposer** depuis la barre de gauche vers le board : le post-it est créé à l'endroit du dépôt, avec ouverture immédiate de la saisie du libellé, comme lors d'une création au clic.

## Capabilities

### New Capabilities

Aucune : toutes les évolutions enrichissent des capacités existantes.

### Modified Capabilities

- `eventstorming-canvas` : ajout des types « Système » et « Message d'intégration » ; distinction visuelle par motif de remplissage quadrillé pour Point chaud et Question ; nouvelle exigence sur la mise en relation de deux post-its (poignées de connexion au survol, lien depuis la sélection) ; nouvelle exigence de création par glisser-déposer depuis la barre d'outils.
- `workshop-export` : les post-its de type Point chaud et Question, ainsi que les liens qui les touchent, n'apparaissent plus dans le diagramme Mermaid.

## Impact

- `apps/web/src/shapes/eventStormingKinds.ts` : deux entrées supplémentaires, motif de remplissage et raccourci clavier par type.
- `apps/web/src/components/EventStormingToolbar.tsx` : deux boutons supplémentaires, pastilles reflétant le motif quadrillé, source de glisser-déposer, commande « Relier la sélection ».
- `apps/web/src/pages/WorkshopPage.tsx` : marquage du type sur les post-its créés, cible de dépôt du glisser-déposer, résolution des conflits de raccourcis clavier natifs tldraw pour les deux nouvelles lettres.
- `apps/web/src/export/buildMermaidFlowchart.ts` : filtrage des post-its exclus et des liens qui les touchent.
- Nouveau composant d'overlay canvas pour les poignées de connexion (rendu via `InFrontOfTheCanvas`, aux côtés de `WorkshopOverlay`).
- `apps/web/test/eventStormingKinds.test.ts` : l'unicité de la couleur par type n'est plus vraie ; c'est le couple (couleur, motif) qui devient unique.
- Boards existants : les post-its déjà créés n'ont pas de marquage de type ; leur type reste déduit de leur apparence, sans migration de données.
