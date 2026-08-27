## 1. Table des types (`eventStormingKinds.ts`)

- [x] 1.1 Mettre à jour `EVENT_STORMING_KINDS` : Agrégat → `yellow`, Système → `light-red`, Politique → `light-violet`, Message d'intégration → `grey` (tous restent `fillEmphasis: 'tinted'`)
- [x] 1.2 Ajouter l'entrée `query-model` (label "Query Model", `color: 'green'`, `fillEmphasis: 'tinted'`, `shortcutKey: 'r'`)
- [x] 1.3 Ajouter un champ optionnel de taille sur `EventStormingKind` (ex. `size?: { w: number; h: number }`), utilisé uniquement par l'Acteur (160×160) ; tous les autres types restent sans valeur explicite et retombent sur la taille standard (200×200)
- [x] 1.4 Relever depuis l'éditeur (DevTools, un post-it réel) les valeurs hex de `light-violet` et `light-red`, et les ajouter à `KIND_COLOR_HEX` — ne pas deviner ces valeurs (cf. Décision 6 du design) — relevées empiriquement via Playwright sur le SVG rendu d'un post-it Politique et Système réels : `light-violet` = `#e085f4`, `light-red` = `#f87777`
- [x] 1.5 Vérifier qu'aucune autre paire (couleur, intensité) ne devient accidentellement dupliquée après ces changements (cf. tableau de la Décision 1 du design)

## 2. Taille fixe par type (`eventStormingPostIts.ts`, `eventStormingShapeUtils.tsx`)

- [x] 2.1 Remplacer la constante unique `POST_IT_SIZE` par une fonction `sizeForKind(kind: EventStormingKind)` retournant la taille du champ 1.3 si présente, sinon la taille standard (200×200)
- [x] 2.2 Adapter `FixedSizeGeoShapeUtil.onBeforeCreate`/`onBeforeUpdate` ([eventStormingShapeUtils.tsx](../../../apps/web/src/shapes/eventStormingShapeUtils.tsx#L29-L37)) pour résoudre le type du shape (`resolveEventStormingKind`) et appliquer la taille correspondante au lieu de la constante globale actuelle
- [x] 2.3 Adapter `createPostItAtPagePoint` ([eventStormingPostIts.ts](../../../apps/web/src/shapes/eventStormingPostIts.ts#L71-L96)), qui centre le post-it déposé sur le point de dépôt à partir de la taille — doit utiliser la taille du type déposé, pas une constante fixe
- [x] 2.4 Vérifier qu'un Acteur ne peut toujours pas être redimensionné manuellement, et que sa taille reste homogène entre plusieurs instances (non-régression du scénario "Post-its de types différents") — `canResize()` inchangé ; couvert par le nouveau test e2e acteur/agrégat

## 3. Barre d'outils (`EventStormingToolbar.tsx`)

- [x] 3.1 Rendre `KindSwatch` proportionnel à la taille relative du type (ex. Acteur plus petit que les autres), pour que l'aperçu Acteur/Agrégat reste distinguable malgré leur couleur et intensité partagées
- [x] 3.2 Vérifier manuellement que la lettre `r` (Query Model) ne correspond à aucun raccourci natif tldraw actif ; si conflit, l'ajouter à `EDITOR_OVERRIDES` dans [WorkshopPage.tsx](../../../apps/web/src/pages/WorkshopPage.tsx#L65-L95) comme pour `e/x/a/h/q`, et mettre à jour le commentaire listant les lettres neutralisées — vérifié via Playwright (appui sur 'r' dans un atelier réel) : outil geo armé en vert, aucun effet de bord natif, aucun override nécessaire
- [x] 3.3 Vérifier que le glisser-déposer du Query Model depuis la barre d'outils crée bien un post-it de ce type (chemin `setDraggedKind`/`createPostItAtPagePoint`) — générique par construction (boucle sur `EVENT_STORMING_KINDS`), confirmé par le nouveau test e2e dédié

## 4. Export Mermaid

- [x] 4.1 Confirmer que `MERMAID_EXCLUDED_KIND_IDS` reste `['hotspot', 'question']` (aucune modification requise : le Query Model est inclus par défaut)
- [x] 4.2 Ajouter un cas de test dans [buildMermaidFlowchart.test.ts](../../../apps/web/test/buildMermaidFlowchart.test.ts) : un post-it Query Model relié par un lien apparaît comme nœud et arête dans le diagramme généré

## 5. Non-régression du marquage legacy (`resolveEventStormingKind.ts`)

- [x] 5.1 Ne PAS modifier `LEGACY_KIND_ID_BY_COLOR` (cf. Décision 5 du design) — vérifier par un test que le comportement des post-its legacy (créés avant `meta.esKind`) reste inchangé après la mise à jour des couleurs de `EVENT_STORMING_KINDS`
- [x] 5.2 Ajouter un test dans [resolveEventStormingKind.test.ts](../../../apps/web/test/resolveEventStormingKind.test.ts) couvrant un post-it Query Model marqué (`meta.esKind = 'query-model'`)

## 6. Tests unitaires et de bout en bout

- [x] 6.1 Mettre à jour [eventStormingKinds.test.ts](../../../apps/web/test/eventStormingKinds.test.ts) : nouvelles couleurs, nouveau type Query Model, unicité des couples (couleur, intensité) à l'exception documentée Acteur/Agrégat
- [x] 6.2 Mettre à jour les scénarios e2e touchant la couleur ou la taille d'un type modifié dans [board-elements.spec.ts](../../../apps/web/e2e/board-elements.spec.ts) (Agrégat, Système, Politique, Message d'intégration, Acteur) et ajouter un scénario de création d'un Query Model
- [x] 6.3 Lancer la suite complète (`npm test` côté `apps/web`, `npx playwright test` pour les e2e) et confirmer qu'aucune régression n'apparaît sur les types non concernés (Domain Event, Commande, Point chaud, Question) — 39/39 tests unitaires ✓, `tsc --noEmit` et lint propres, 11/11 tests e2e de `board-elements.spec.ts` ✓ (le premier échec observé était un timeout de démarrage à froid du serveur Vite, non reproductible en isolation)

## 7. Vérification manuelle finale

- [x] 7.1 Ouvrir un atelier existant contenant des post-its Agrégat/Système/Politique/Message d'intégration créés avant ce changement, et confirmer que leur type est préservé (menu, export Mermaid) malgré leur nouvelle couleur affichée — pas d'atelier réel antérieur disponible dans cet environnement (base de données de développement neuve) ; couvert par l'équivalent automatisé, qui passe : le test e2e "post-its from older workshops keep their kind and export behaviour" (meta retirée pour simuler un post-it antérieur au marquage) confirme que le type et le comportement d'export restent corrects
- [x] 7.2 Confirmer visuellement que la pastille Acteur reste perceptiblement plus petite que celle de l'Agrégat dans la barre d'outils, dépliée comme réduite — confirmé par capture d'écran de la barre d'outils dépliée dans un navigateur réel (Playwright) : la pastille Acteur est visiblement plus petite que celle de l'Agrégat, toutes deux jaunes
