## 1. Palette des types et source de vérité

- [x] 1.1 Étendre `EventStormingKind` dans `apps/web/src/shapes/eventStormingKinds.ts` avec un champ `fillEmphasis: 'tinted' | 'strong'` et renseigner `'tinted'` sur les sept types existants
- [x] 1.2 Passer `hotspot` et `question` en `fillEmphasis: 'strong'` sans changer leur couleur (`red`, `green`)
- [x] 1.3 Ajouter les types `system` (label « Système », couleur `red`, `tinted`, raccourci `s`) et `integration-message` (label « Message d'intégration », couleur `green`, `tinted`, raccourci `i`)
- [x] 1.4 Déplacer la table des couleurs hexadécimales dans `eventStormingKinds.ts` comme source de vérité unique, et remplacer `COLOR_SWATCH` (`EventStormingToolbar.tsx`) et `KIND_COLOR_HEX` (`buildMermaidFlowchart.ts`) par cet import
- [x] 1.5 Mettre à jour `apps/web/test/eventStormingKinds.test.ts` : liste des neuf identifiants attendus, unicité du couple (couleur, `fillEmphasis`) au lieu de l'unicité de la couleur, unicité des raccourcis conservée
- [x] 1.6 Ajouter un test vérifiant que `hotspot` et `question` sont les seuls types en `fillEmphasis: 'strong'` et qu'ils conservent leurs couleurs `red` et `green`
- [x] 1.7 Raccourci du point chaud : `h` (et non `u`), demande utilisateur ultérieure à la conception initiale

## 2. Identité de type portée par le shape

- [x] 2.1 Créer un module d'état du type courant (dernier type sélectionné dans la barre d'outils), lisible depuis `WorkshopPage` et écrit par `selectKind`
- [x] 2.2 Implémenter `resolveEventStormingKind(shape)` : lecture de `shape.meta.esKind` si présent et reconnu, sinon déduction depuis la couleur via la table historique des types
- [x] 2.3 Brancher `editor.getInitialMetaForShape` dans `WorkshopPage.handleMount` pour estamper `esKind` sur les shapes `geo` créés
- [x] 2.4 Adapter `selectKind` (`EventStormingToolbar.tsx`) pour mémoriser le type courant
- [x] 2.5 Corriger la détection d'état actif des boutons de la barre : comparer le type courant mémorisé et non la seule couleur du prochain shape, sinon deux boutons de même couleur s'allument ensemble
- [x] 2.6 Tester `resolveEventStormingKind` : shape avec `meta.esKind` valide, shape sans `meta` (point chaud et question historiques), shape avec `meta.esKind` inconnu

## 3. Fond appuyé du point chaud et de la question

*Conception initiale (abandonnée après essai visuel) : fond quadrillé superposé au rendu natif via une surcharge de `component()`/`toSvg()` de `FixedSizeGeoShapeUtil`. Retenu à la place, plus lisible et plus distinctif sur un canvas déjà en mode grille permanent : fond dans la couleur pleine du type et libellé blanc, obtenus par les styles natifs `fill`/`labelColor` de l'outil `geo`, sans code de rendu additionnel.*

- [x] 3.1 Retirer la surcharge `component()`/`toSvg()` de `FixedSizeGeoShapeUtil` (générateur de grille, `SVGContainer`) : elle ne sert plus, le fichier redevient un module `.ts`
- [x] 3.2 Localiser la `StyleProp` native de `labelColor` pour le type `geo` via `editor.styleProps.geo` (`DefaultLabelColorStyle` n'est pas exporté par le paquet `tldraw`)
- [x] 3.3 Dans `applyPostItStyles` (`eventStormingPostIts.ts`), appliquer `DefaultFillStyle: 'fill'` et `labelColor: 'white'` pour les types `strong`, `'solid'`/`'black'` pour les types `tinted`
- [x] 3.4 Refléter l'intensité dans les pastilles de la barre d'outils : intérieur rempli de la couleur pour les types `strong`, intérieur vide pour les types `tinted`
- [x] 3.5 Vérifier visuellement un point chaud et une question avec libellé long, en thème clair et en thème sombre, puis sur un export PNG et une vignette de la page d'accueil
- [x] 3.6 Retirer le halo de texte (`--tl-text-outline`, visible car même couleur blanche que le libellé) des post-its à fond plein, en le neutralisant par CSS sur un ancêtre du rendu dans `component()` et `toSvg()` (demande utilisateur ultérieure à la conception initiale)

## 4. Nouveaux boutons dans la barre de gauche

- [x] 4.1 Vérifier que les touches `s` et `i` ne déclenchent aucun outil ni action native de tldraw ; neutraliser dans `EDITOR_OVERRIDES` le raccourci natif `h` de l'outil « Main », repris par le point chaud
- [x] 4.2 Vérifier l'ordre d'affichage des neuf types dans la barre et le rendu en mode replié comme déplié (largeur, débordement vertical)
- [x] 4.3 Vérifier la création de « Système » et « Message d'intégration » : couleur, fond teinté, taille fixe, ouverture immédiate du libellé

## 5. Export Mermaid sans point chaud ni question

- [x] 5.1 Calculer dans `buildMermaidFlowchart` l'ensemble des identifiants de post-its exportables via `resolveEventStormingKind` (exclusion de `hotspot` et `question`)
- [x] 5.2 Filtrer sur cet ensemble les nœuds de premier niveau, les nœuds à l'intérieur des `subgraph` de couloirs de nage, et les lignes `style`
- [x] 5.3 N'émettre une arête que si ses deux extrémités appartiennent à l'ensemble, pour ne jamais référencer un nœud absent
- [x] 5.4 Ajouter des tests d'export : point chaud et question absents du diagramme, lien vers un élément exclu absent, couloir de nage ne contenant que des éléments exclus produisant un diagramme valide, lien entre deux éléments exportés toujours présent

## 6. Poignées de connexion au survol

- [x] 6.1 Extraire une fonction unique de création de lien : flèche plus bindings `start`/`end` en ancrage non précis, dans une seule transaction annulable d'un `undo`
- [x] 6.2 Créer le composant `ConnectionHandlesOverlay` affichant quatre pastilles sur les milieux des bords du post-it survolé (`getHoveredShapeId`, positions via `pageToScreen`)
- [x] 6.3 Masquer les poignées hors outil sélection, pendant l'édition d'un libellé, pendant un glissé de sélection, et dès que le pointeur quitte le post-it
- [x] 6.4 Implémenter le glissé depuis une pastille : capture du pointeur, aperçu du lien jusqu'au pointeur, mise en évidence de la cible via `setHintingShapes`, nettoyage systématique de l'état de survol en fin de geste
- [x] 6.5 Créer le lien au relâchement sur un post-it distinct (`getShapeAtPoint`), ne rien créer sur une zone vide ou sur le post-it d'origine, et revenir à l'outil de sélection
- [x] 6.6 Composer `WorkshopOverlay` et `ConnectionHandlesOverlay` dans le même `InFrontOfTheCanvas`, avec `pointerEvents: 'none'` sur le conteneur et activé uniquement sur les pastilles
- [x] 6.7 Vérifier le comportement à différents niveaux de zoom et après défilement du canvas, ainsi qu'en session collaborative à deux participants

## 7. Relier la sélection

- [x] 7.1 Ajouter dans la barre de gauche un bouton « Relier la sélection », désactivé sauf si la sélection contient exactement deux post-its
- [x] 7.2 Créer le lien du premier vers le second élément de `getSelectedShapeIds` en réutilisant la fonction de création de lien de 6.1
- [x] 7.3 Vérifier qu'aucun raccourci clavier n'est ajouté et que le bouton reste inactif pour une sélection d'un, de trois éléments, ou contenant un couloir de nage ou une flèche

## 8. Glisser-déposer de la barre vers le board

- [x] 8.1 Rendre les boutons de type `draggable` et publier le type glissé dans les données du glisser-déposer
- [x] 8.2 Écouter `dragover`/`drop` sur le conteneur du canvas et convertir le point de dépôt en coordonnées page (`screenToPage`)
- [x] 8.3 Créer au dépôt un post-it centré sur le point de dépôt, dans le type glissé, avec ouverture immédiate de la saisie du libellé
- [x] 8.4 Vérifier qu'un dépôt hors canvas ne crée rien et qu'un dépôt dans un couloir de nage rattache bien le post-it à ce couloir

## 9. Vérification finale

- [x] 9.1 `npm run lint`, `npm run typecheck` et `npm test` dans `apps/web`
- [x] 9.2 `npm run e2e` dans `apps/web` et correction des specs Playwright impactées par les changements de barre d'outils
- [x] 9.3 Parcours manuel complet sur un atelier : les neuf types, le fond appuyé du point chaud et de la question, les trois façons de créer un lien, le glisser-déposer, l'export PNG et l'export Mermaid
- [x] 9.4 Ouvrir un atelier existant (créé avant ce changement) et vérifier que ses post-its restent intacts et correctement typés à l'export
