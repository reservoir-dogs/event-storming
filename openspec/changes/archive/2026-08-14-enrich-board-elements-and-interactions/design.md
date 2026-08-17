## Context

Le canvas est un `<Tldraw>` (tldraw 5) piloté par trois fichiers clés :

- `apps/web/src/shapes/eventStormingKinds.ts` : la table des types d'event storming (`id`, `label`, `color` tldraw, `shortcutKey`).
- `apps/web/src/components/EventStormingToolbar.tsx` : la barre de gauche, qui remplace la toolbar native ; sélectionner un type applique les styles du prochain shape (`setStyleForNextShapes`) puis active l'outil `geo`.
- `apps/web/src/pages/WorkshopPage.tsx` : montage de l'éditeur, `shapeUtils` (`FixedSizeGeoShapeUtil`, `UnlabeledArrowShapeUtil`), `overrides` de raccourcis, effets de bord au montage.

Deux contraintes structurantes héritées des specs existantes :

- **Aucun panneau de style** : l'apparence d'un post-it est entièrement dictée par son type ; il n'existe donc aujourd'hui qu'un seul porteur de l'identité de type, la couleur du shape.
- **Post-its de taille fixe** (200×200, non redimensionnables) : toute géométrie de rendu peut compter sur cette taille constante.

L'ajout de « Système » (rouge) et « Message d'intégration » (vert) casse l'hypothèse « une couleur = un type », puisque rouge et vert sont déjà pris par Point chaud et Question, dont la couleur doit être conservée. Or l'export Mermaid doit désormais distinguer ces types pour exclure Point chaud et Question. C'est le point dur du changement : il faut un porteur d'identité de type indépendant de la couleur.

## Goals / Non-Goals

**Goals:**

- Neuf types d'éléments dans la barre de gauche, chacun visuellement identifiable sans ambiguïté (couleur + motif de remplissage).
- Un type de post-it déterminable de façon fiable en lecture (export, futurs traitements), y compris pour les post-its déjà présents dans les ateliers existants.
- Export Mermaid amputé de Point chaud, Question et des liens qui les touchent, tout en restant un diagramme valide.
- Créer un lien entre deux post-its en un seul geste continu, sans passer par la sélection d'outil.
- Créer un post-it en un seul geste continu depuis la barre de gauche.

**Non-Goals:**

- Introduire un panneau de style ou toute personnalisation d'apparence par l'utilisateur.
- Migrer les données des ateliers existants (aucun script de migration, aucun changement de schéma serveur).
- Rendre les post-its redimensionnables, ou ajouter des libellés sur les flèches.
- Filtrer l'export PNG : il reste une capture fidèle du canvas, points chauds et questions inclus.
- Retirer l'outil « Lien » existant : les nouvelles interactions s'ajoutent, elles ne remplacent rien.

## Decisions

### D1. Le type est porté par `shape.meta.esKind`, avec repli déduit de l'apparence

Chaque post-it créé reçoit `meta: { esKind: <id du type> }`. `meta` est un champ libre, persisté et synchronisé par tldraw comme le reste du shape, sans changement de schéma ni de code serveur.

Mécanique : `EventStormingToolbar` mémorise le type courant (dernier type sélectionné, y compris via glisser-déposer) dans un petit module d'état partagé, et `WorkshopPage` fournit `editor.getInitialMetaForShape` pour estamper ce type sur tout `geo` créé — ce hook s'applique quel que soit le chemin de création (clic sur le canvas, glisser-déposer), ce qui évite de disperser la logique. Un shape dupliqué ou collé porte déjà sa `meta` : tldraw la conserve telle quelle (la `meta` du shape écrase la `meta` initiale), donc une copie garde le type de son original et non le type courant de la barre d'outils.

Lecture : une fonction unique `resolveEventStormingKind(shape)` renvoie le type d'un post-it, en lisant `meta.esKind` s'il est présent et reconnu, sinon en le déduisant de sa couleur via la table des types telle qu'elle existait avant ce changement. Ce repli est déterministe parce qu'il ne s'applique qu'aux post-its non marqués, donc antérieurs au changement : à cette époque une couleur ne désignait qu'un type, et le rouge y était forcément un Point chaud, le vert une Question. Le fond des post-its d'alors (`fill: solid`) n'entre donc pas dans la décision — s'appuyer dessus serait même faux, puisqu'un point chaud historique et un système nouveau partagent exactement cette apparence.

*Alternatives écartées* :
- **Déduire le type de la seule apparence, sans `meta`** : suffisant tant que (couleur, motif) reste unique, mais fait dépendre une information sémantique d'un choix esthétique — le jour où deux types partagent une apparence, ou si une correction visuelle change un motif, l'export change silencieusement de comportement.
- **Un shape type tldraw custom par type d'élément** : porte l'identité proprement mais casse la compatibilité avec les shapes `geo` déjà persistés dans les ateliers existants, et demande une migration de schéma pour un bénéfice nul à ce stade.

### D2. Palette : la couleur reste le marqueur principal, l'intensité du fond lève l'ambiguïté

| Type | Couleur | Fond | Libellé |
| --- | --- | --- | --- |
| Domain Event | orange | teinté | sombre |
| Commande | blue | teinté | sombre |
| Acteur | yellow | teinté | sombre |
| Agrégat | grey | teinté | sombre |
| Politique | violet | teinté | sombre |
| Système | **red** | teinté | sombre |
| Message d'intégration | **green** | teinté | sombre |
| Point chaud | red | **plein** | **blanc** |
| Question | green | **plein** | **blanc** |

`EventStormingKind` gagne un champ `fillEmphasis: 'tinted' | 'strong'`. L'invariant testé devient : le couple (couleur, intensité) est unique par type — le test unitaire actuel « une couleur distincte par type » est remplacé par cette version.

Version initialement retenue puis abandonnée : un fond quadrillé (grille de lignes fines dans la couleur du type, superposée au rendu natif) pour Point chaud et Question, couleur inchangée. Un essai visuel en a montré le défaut : sur un canvas déjà en mode grille (actif en permanence sur cet atelier, voir « Absence de panneau d'édition »), un quadrillage sur les seuls point chaud et question ajoutait une texture de plus, peu lisible et peu distinctive à l'œil. Retenu à la place : ces deux types passent en fond plein (couleur du type, sans atténuation) et libellé blanc — un traitement visuellement plus fort, qui les fait ressortir comme des points d'attention plutôt que comme une variation discrète des post-its unis.

Les pastilles de la barre de gauche reflètent l'intensité : carré à bordure colorée et intérieur vide pour les types à fond teinté (rendu actuel), carré entièrement rempli de la couleur pour Point chaud et Question, afin que deux entrées de même couleur ne se ressemblent pas.

Raccourcis clavier des deux nouveaux types : **S** (Système) et **I** (Message d'intégration), qui ne coïncident avec aucun outil ni action native de tldraw. Le raccourci du point chaud passe de `U` à **H** (demande utilisateur) ; `H` est la lettre native de l'outil « Main » (pan), neutralisée dans `EDITOR_OVERRIDES` comme `e`/`x`/`a`/`q` le sont déjà pour les autres types — l'outil main reste accessible par la barre d'espace ou un glissé à la molette, sans raccourci de lettre dédié.

### D3. Le fond plein est appliqué par les styles natifs `fill`/`labelColor` de l'outil `geo`, sans surcharge de rendu

Contrairement au quadrillé envisagé initialement (voir D2), un fond dans la couleur pleine du type est un style tldraw natif : `DefaultFillStyle: 'fill'` au lieu de `'solid'`, combiné à `labelColor: 'white'` au lieu de `'black'`. Aucune surcharge de `component()`/`toSvg()` n'est donc nécessaire — l'export PNG, les vignettes et le canvas partagent le même rendu par construction, sans code de superposition à maintenir en double.

Seule complication : le style de libellé (`labelColor`) du shape `geo` est porté par `DefaultLabelColorStyle`, qui n'est pas exporté par le paquet `tldraw` (seul `DefaultColorStyle`, celui de la bordure, l'est). `editor.styleProps.geo` — une `Map<StyleProp, propKey>` publique et typée — donne accès à l'instance de style réellement enregistrée pour la prop `labelColor` ; c'est elle qu'il faut passer à `setStyleForNextShapes` pour que l'outil `geo` en tienne compte à la création au clic, et non une instance reconstruite à la main qui ne serait pas reconnue par le schéma.

Les constantes de couleur hexadécimale sont aujourd'hui dupliquées (`COLOR_SWATCH` dans la toolbar, `KIND_COLOR_HEX` dans l'export Mermaid) ; elles sont donc regroupées dans `eventStormingKinds.ts`, seule source de vérité de la palette.

Retouche a posteriori : tldraw entoure par défaut le libellé d'un halo (`--tl-text-outline`, un empilement de `text-shadow` dans la couleur de fond du canvas) pour le garder lisible par-dessus un fond de couleur variable. Sur un fond plein avec libellé blanc, ce halo prend la même couleur que le libellé lui-même (le fond du canvas, blanc en thème clair) : au lieu de rester invisible, il élargit visuellement chaque lettre dans plusieurs directions, ce qui donnait un texte à l'aspect épaissi. Cette variable CSS étant héritée, `FixedSizeGeoShapeUtil` la redéfinit à `none` sur un ancêtre du rendu (`component()` et `toSvg()`) pour les seuls post-its à fond plein, sans toucher à l'option `showTextOutline` de `GeoShapeUtil` (globale à tous les `geo`, donc inutilisable pour un traitement par type).

### D4. Export Mermaid : filtrage par type, en excluant nœuds *et* arêtes

`buildMermaidFlowchart` reçoit un prédicat d'exclusion appliqué en un seul endroit : l'ensemble des identifiants de post-its exportables est calculé d'abord (post-its dont `resolveEventStormingKind` n'est ni `hotspot` ni `question`), puis :

- les nœuds de premier niveau et les nœuds dans les `subgraph` sont filtrés sur cet ensemble ;
- les lignes `style` sont filtrées sur ce même ensemble ;
- une arête n'est émise que si ses **deux** extrémités sont dans l'ensemble.

Ce dernier point est le piège à éviter : Mermaid crée silencieusement un nœud implicite pour tout identifiant référencé dans une arête, donc laisser passer une arête vers un point chaud réintroduirait un nœud fantôme sans libellé. Un couloir de nage qui ne contient que des éléments exclus produit un `subgraph` vide, ce qui reste du Mermaid valide (le couloir n'a pas de raison de disparaître : c'est une structure d'organisation, pas un élément filtré).

### D5. Poignées de connexion au survol, portées par un overlay canvas

Un composant `ConnectionHandlesOverlay` rendu dans `InFrontOfTheCanvas` (aux côtés de `WorkshopOverlay`, désormais composés dans un même conteneur) :

1. suit le post-it survolé (`editor.getHoveredShapeId()`, ignoré si un autre outil que la sélection est actif, si un shape est en édition, ou si un glissé de sélection est en cours) ;
2. affiche quatre pastilles positionnées sur les milieux des bords, converties en coordonnées écran par `editor.pageToScreen` — donc correctes à tout niveau de zoom et de défilement ;
3. sur `pointerdown` d'une pastille, capture le pointeur et trace un aperçu de lien jusqu'au pointeur ; la cible potentielle sous le pointeur est signalée par `editor.setHintingShapes([id])`, qui réutilise la mise en évidence native de tldraw plutôt qu'un halo maison ;
4. au relâchement, si un post-it distinct est sous le pointeur (`editor.getShapeAtPoint`), crée la flèche et **ses deux bindings** (`editor.createShape` puis `editor.createBinding` pour les terminaux `start` et `end`) dans une seule transaction, de sorte qu'un `undo` annule le lien entier ; sinon, ne crée rien.

Les bindings sont créés en ancrage non précis (centre du shape), comme le fait tldraw quand on relâche une flèche au milieu d'une forme : la flèche suit ensuite les déplacements des deux post-its, ce que l'export Mermaid exige déjà (`getArrowBindings`).

*Alternatives écartées* :
- **Verrouiller l'outil « Lien » (tool lock)** : réduit les allers-retours vers la barre d'outils mais ne supprime pas le mode ni le visage « je dois viser », et laisse l'utilisateur coincé en mode lien.
- **Piloter l'outil `arrow` natif en simulant des événements pointeur** depuis la pastille : réutiliserait toute la mécanique de tldraw (aperçu, snapping, bindings) sans la réécrire, mais dépend de détails internes de la machine à états de l'outil, fragiles d'une version à l'autre.

### D6. « Relier la sélection » comme filet de sécurité, sans nouveau raccourci

Un bouton de la barre de gauche, actif uniquement quand la sélection contient exactement deux post-its, crée le lien du premier vers le second en réutilisant exactement la même fonction de création que D5. Aucun raccourci clavier ne lui est attribué : les lettres seules restantes sont rares et le risque de collision avec tldraw dépasse le gain. L'ordre est celui de la sélection (`getSelectedShapeIds`), ce qui donne un contrôle explicite du sens de la flèche.

### D7. Glisser-déposer natif HTML5 depuis la barre vers le canvas

Les boutons de type de la barre deviennent `draggable`, et le conteneur du canvas écoute `dragover`/`drop`. Au dépôt : conversion du point écran en point page (`editor.screenToPage`), sélection du type déposé (mêmes appels que le clic sur le bouton, pour que `getInitialMetaForShape` estampe le bon type), création du post-it centré sur le point de dépôt, puis ouverture immédiate de l'édition du libellé — le gestionnaire `enableImmediateLabelEditing` déjà en place s'en charge, puisqu'il réagit à la création de tout `geo`.

Le rattachement à un couloir de nage n'est pas à implémenter : tldraw reparente automatiquement un shape créé dans les limites d'un `frame`.

*Alternative écartée* : un glisser-déposer maison à base de `pointermove` — nécessaire seulement si l'on voulait un aperçu du post-it collé au curseur ; l'API HTML5 native donne le curseur « copie » et la gestion du dépôt hors canvas gratuitement.

## Risks / Trade-offs

- **`editor.styleProps.geo` n'est pas une API publique documentée pour cet usage précis** (retrouver l'instance de style d'une prop par son nom), bien que publique et typée → isolé dans une seule fonction (`labelColorStyleProp`), avec un repli silencieux (libellé noir par défaut) si l'entrée venait à disparaître à une mise à jour de tldraw.
- **Deux types partagent une couleur : un utilisateur peut confondre Système et Point chaud** → le fond plein et le libellé blanc du point chaud le distinguent nettement du système à fond teinté, et le libellé du bouton reste affiché en mode déplié de la barre ; c'est le compromis accepté pour tenir la contrainte « conserver les couleurs » du point chaud et de la question.
- **Le repli de résolution du type par apparence est du code de compatibilité sans date de péremption** → isolé dans une seule fonction (`resolveEventStormingKind`), testée sur les deux chemins (avec et sans `meta`), et le seul consommateur est l'export.
- **L'overlay de poignées intercepte des événements pointeur au-dessus du canvas** → les pastilles sont les seules zones interactives (`pointerEvents: 'none'` sur le conteneur), et l'overlay se retire dès qu'un outil autre que la sélection est actif, pour ne pas gêner le tracé de flèche manuel ou la gomme.
- **Les points chauds et questions disparaissent de l'export Mermaid sans avertissement** → l'export PNG, lui, reste exhaustif ; c'est le canal de partage qui conserve les incertitudes de l'atelier.
- **Un atelier collaboratif peut voir deux participants relier les mêmes post-its simultanément** → aucun traitement particulier : deux flèches parallèles apparaissent, comme aujourd'hui avec l'outil « Lien ».
