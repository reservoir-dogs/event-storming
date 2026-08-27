## Context

Toute l'apparence des post-its dépend d'un seul tableau, source de vérité unique : `EVENT_STORMING_KINDS` dans [eventStormingKinds.ts](../../../apps/web/src/shapes/eventStormingKinds.ts). Chaque entrée porte `color` (une valeur de la palette tldraw), `fillEmphasis` (`tinted` | `strong`) et `shortcutKey`. Trois invariants actuels contraignent ce changement :

1. **Unicité du couple (couleur, intensité)** par type — c'est ce qui permet à la pastille de la barre d'outils (`KindSwatch`, 14×14px fixe) de rester visuellement distincte pour deux types partageant une couleur (aujourd'hui : rouge pour Système/Point chaud, vert pour Message d'intégration/Question).
2. **Taille unique et fixe** pour tous les post-its (`POST_IT_SIZE = { w: 200, h: 200 }` dans [eventStormingPostIts.ts](../../../apps/web/src/shapes/eventStormingPostIts.ts)), imposée par `FixedSizeGeoShapeUtil` — exigence explicite du spec (« Post-its de taille fixe et homogène »).
3. **Le type est porté par `meta.esKind`**, pas déduit de la couleur — la couleur ne sert de repli (`LEGACY_KIND_ID_BY_COLOR` dans [resolveEventStormingKind.ts](../../../apps/web/src/shapes/resolveEventStormingKind.ts)) que pour les post-its créés avant l'introduction de ce marquage.

Recherche menée en amont (voir conversation) : la légende communautaire de référence ([DDD Crew — EventStorming Glossary & Cheat Sheet](https://ddd-crew.github.io/eventstorming-glossary-cheat-sheet/)) définit un **Query Model** vert (« l'information nécessaire pour prendre une décision »), sans élément « Query » séparé pour l'action de la demander. Elle place aussi l'Agrégat en jaune (grand format, par opposition au petit acteur jaune), le Système en rose, la Politique en lilas.

Palette tldraw disponible (13 valeurs, confirmées depuis le code source `tlschema`) : `black, grey, light-violet, violet, blue, light-blue, yellow, orange, green, light-green, light-red, red, white`. Il n'existe pas de couleur nommée « pink » : `light-red` est la teinte la plus proche du rose/saumon canonique du Système.

## Goals / Non-Goals

**Goals:**
- Réaligner Agrégat, Système, Politique et Message d'intégration sur les couleurs canoniques les plus proches disponibles dans la palette tldraw.
- Introduire le Query Model comme type de post-it à part entière, inclus dans l'export Mermaid.
- Conserver la lisibilité de la barre d'outils malgré le partage du jaune entre Acteur et Agrégat.
- Ne perdre aucun post-it existant ni son type lors de la bascule (aucune migration de données).

**Non-Goals:**
- Ne pas introduire d'élément « Query » séparé du Query Model (non conforme à la convention communautaire, cf. recherche en amont).
- Ne pas modifier Point chaud, Question, Domain Event ou Commande (hors périmètre, déjà conformes au canon).
- Ne pas généraliser la taille variable à d'autres types que l'Acteur — l'exception reste ponctuelle et documentée, pas un nouveau mécanisme de style libre.
- Ne pas modifier le format de persistance ni la logique de sauvegarde/synchronisation.

## Decisions

### 1. Nouvelle table de couleurs

| Type | Couleur avant | Couleur après | Intensité | Taille |
|---|---|---|---|---|
| Domain Event | orange | orange (inchangé) | tinted | 200×200 |
| Commande | blue | blue (inchangé) | tinted | 200×200 |
| Acteur | yellow | yellow (inchangé) | tinted | **160×160 (réduit)** |
| Agrégat | grey | **yellow** | tinted | 200×200 |
| Politique | violet | **light-violet** | tinted | 200×200 |
| Système | red | **light-red** | tinted | 200×200 |
| Message d'intégration | green | **grey** | tinted | 200×200 |
| Point chaud | red | red (inchangé) | strong | 200×200 |
| Question | green | green (inchangé) | strong | 200×200 |
| **Query Model (nouveau)** | — | **green** | tinted | 200×200 |

Vérification d'unicité du couple (couleur, intensité) sur l'ensemble des 10 types : toutes les paires sont uniques **sauf** Acteur/Agrégat (`yellow`/`tinted` partagé) — cas traité au point 2 ci-dessous. `green`/`tinted` (Query Model) est libre, car Message d'intégration quitte le vert au profit du gris libéré par l'Agrégat — un jeu de chaises tournantes déjà présent dans la demande initiale, pas une improvisation de cette conception.

**Alternative envisagée pour le Système** : réutiliser `light-violet` ou une couleur totalement neuve (`light-green`) pour éviter toute proximité avec `red` (Point chaud). Écartée : `light-red` reste la teinte la plus proche du rose/saumon canonique, et le nom de couleur (pas juste le rendu) suffit déjà à la distinguer de `red` — aucune ambiguïté d'unicité.

### 2. Acteur vs Agrégat : distinction par la taille, pas par l'intensité

Décision utilisateur explicite (tranchée en amont) : contrairement au mécanisme existant pour rouge/vert (intensité de fond), Acteur et Agrégat restent tous deux à fond **teinté** et se distinguent uniquement par la **taille** du post-it — fidèle à la convention (petit Acteur, grand Agrégat).

Conséquences à traiter explicitement dans le code :
- `POST_IT_SIZE` ne peut plus être une constante unique appliquée à tous les types : il faut une taille par `EventStormingKind` (ex. un champ `size` optionnel sur `EventStormingKind`, avec 200×200 par défaut et 160×160 pour l'Acteur seul).
- `FixedSizeGeoShapeUtil` doit lire cette taille par type au lieu d'une constante globale, aussi bien à la création qu'au verrouillage du redimensionnement.
- `KindSwatch` (barre d'outils, [EventStormingToolbar.tsx](../../../apps/web/src/components/EventStormingToolbar.tsx)) doit refléter cette taille relative pour rester distinguable — sinon Acteur et Agrégat produisent la même pastille 14×14px, en contradiction avec le scénario « Aperçu du type dans la barre d'outils » du spec existant. Proposition : dimensionner la pastille proportionnellement (ex. 12×12 pour l'Acteur, 14×14 pour les autres), plutôt que d'ajouter un deuxième indice visuel (police, icône) qui alourdirait la lecture de la barre.

**Alternative envisagée** (rejetée par l'utilisateur) : donner à l'Agrégat un fond `strong` (plein) au lieu de `tinted`, comme pour Système/Point chaud. Aurait évité toute modification de `POST_IT_SIZE`/`KindSwatch`, au prix d'un écart au canon (rien n'indique que l'Agrégat doive avoir un fond plein).

### 3. Query Model : inclusion dans l'export Mermaid

Le Query Model n'est **pas** ajouté à `MERMAID_EXCLUDED_KIND_IDS` (qui ne contient que `hotspot` et `question`). Justification : ces deux exclusions représentent des incertitudes d'atelier (« pas des étapes du flux », cf. commentaire existant dans `buildMermaidFlowchart.ts`), alors que le Query Model représente une information réellement consultée dans le flux métier, au même titre qu'un Domain Event ou une Commande. Confirmé explicitement par l'utilisateur.

### 4. Raccourci clavier du Query Model

Lettres déjà prises : `e c x a p s i h q`. Proposition : **`r`** (Requête), mnémotechnique en français comme en anglais (Query). À vérifier à l'implémentation, selon la méthode déjà appliquée aux 9 raccourcis existants (cf. commentaire dans `WorkshopPage.tsx`) : si `r` correspond à un raccourci natif tldraw actif, l'neutraliser ou le déplacer via `EDITOR_OVERRIDES`, comme cela a été fait pour `e/x/a/h/q`.

### 5. Table `LEGACY_KIND_ID_BY_COLOR` : ne pas la modifier

Cette table fige la correspondance couleur → type telle qu'elle existait **avant** l'introduction de `meta.esKind`, à une époque où chaque couleur ne désignait qu'un seul type (`grey: 'aggregate'`, `red: 'hotspot'`, `green: 'question'`, etc.). Elle ne doit **pas** être mise à jour pour refléter les nouvelles couleurs de `EVENT_STORMING_KINDS` : ce sont deux tables désormais indépendantes qui répondent à deux questions différentes (« quelle couleur avait ce type historiquement, avant le marquage explicite » vs « quelle couleur ce type a-t-il aujourd'hui »). Tout post-it créé depuis l'introduction du marquage — donc tout post-it Agrégat/Système/Politique/Message d'intégration actuellement présent dans un atelier existant — porte déjà `meta.esKind` et n'emprunte jamais ce chemin de repli ; seule sa couleur affichée changera après la mise à jour du code.

### 6. Valeurs hexadécimales dans `KIND_COLOR_HEX`

`light-violet` et `light-red` doivent être ajoutées à `KIND_COLOR_HEX` (utilisé par la pastille de la barre d'outils et par le style du diagramme Mermaid exporté). Ces valeurs doivent être relevées empiriquement depuis l'éditeur tldraw en cours d'implémentation — comme cela semble avoir été fait pour les entrées actuelles, qui ne citent aucune source externe — plutôt que supposées : aucune valeur hex fiable n'a pu être confirmée en amont pour ces deux couleurs spécifiquement.

## Risks / Trade-offs

- **[Risque]** Une capture manuelle imprécise des hex `light-violet`/`light-red` désynchronise la pastille de la barre d'outils et le style Mermaid exporté (la même valeur doit être utilisée aux deux endroits, cf. commentaire « seule source de vérité de la palette » dans `eventStormingKinds.ts`). → **Mitigation** : relever la valeur directement depuis les DevTools sur un post-it réel, une seule fois, et la réutiliser telle quelle aux deux endroits.
- **[Risque]** Le raccourci `r` entre en conflit avec un outil natif tldraw non documenté ici. → **Mitigation** : suivre la méthode déjà en place (test manuel + entrée dans `EDITOR_OVERRIDES` si besoin), avant de livrer.
- **[Risque]** Un utilisateur habitué à l'ancienne palette (Agrégat gris, Système rouge, Politique violet, Message d'intégration vert) est temporairement dérouté par le changement de couleurs sur des ateliers déjà en cours. → **Mitigation** : aucune action technique requise (le type est préservé), mais à mentionner dans les notes de version si l'application en tient.
- **[Trade-off]** Introduire une taille par type casse la simplicité actuelle de `POST_IT_SIZE` (une seule constante). C'est un choix assumé par l'utilisateur pour rester fidèle au canon ; il ouvre la porte à des demandes futures de tailles différenciées pour d'autres types, qu'il faudra alors trancher au cas par cas plutôt que de généraliser un mécanisme de style libre (hors non-goals).

## Migration Plan

Aucune migration de données : le type de chaque post-it existant est déjà porté par `meta.esKind`, indépendant de la couleur affichée. Le déploiement se limite à une mise à jour du code front (`apps/web`) ; au rechargement, les post-its existants s'affichent avec leur nouvelle couleur de type sans perte ni altération. Rollback : revert du commit, sans effet sur les données persistées.

## Open Questions

- Valeur hex exacte de `light-violet` et `light-red` à confirmer à l'implémentation (cf. Décision 6).
- Confirmation que `r` est libre de tout raccourci natif tldraw (cf. Décision 4) ; à défaut, choisir une autre lettre.
