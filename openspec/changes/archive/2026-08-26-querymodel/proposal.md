## Why

La palette de couleurs actuelle des post-its s'écarte sur plusieurs points de la convention communautaire EventStorming/DDD (légende DDD Crew, Brandolini) : Agrégat, Système, Politique et Message d'intégration n'utilisent pas les couleurs canoniques, faute d'y avoir prêté attention à leur introduction. Par ailleurs, l'atelier ne permet pas aujourd'hui de modéliser explicitement le côté lecture d'un flux (ex. un appel API déclenché par une action utilisateur qui affiche une liste d'éléments métier) : seul le côté écriture (Commande → Agrégat → Domain Event) est outillé. La convention communautaire couvre ce besoin via le **Query Model** (post-it vert, « l'information nécessaire pour prendre une décision »), sans élément « Query » séparé de son résultat.

## What Changes

- Réaligne la couleur de l'**Agrégat** sur le canon : gris → **jaune**.
- Réaligne la couleur du **Système** sur le canon : rouge → **rose** (`light-red`, la teinte tldraw la plus proche du rose/saumon canonique).
- Réaligne la couleur de la **Politique** sur le canon : violet → **lilas** (`light-violet`).
- Réaligne la couleur du **Message d'intégration** : vert → **gris** (couleur libérée par le départ de l'Agrégat), ce qui libère le vert teinté pour le nouveau type ci-dessous.
- Introduit un nouveau type de post-it **Query Model**, en **vert** (fond teinté), représentant l'information consultée par un acteur ou une politique avant de décider — pas l'action de la demander, conformément à la convention communautaire qui ne distingue pas les deux.
- **BREAKING (convention visuelle)** : l'Agrégat et l'Acteur partagent désormais tous deux le jaune. Contrairement au mécanisme existant (distinction par intensité de fond, ex. Système/Point chaud en rouge), ces deux types restent tous deux à fond teinté et se distinguent uniquement par la **taille** du post-it, fidèlement à la convention (petit Acteur / grand Agrégat) :
  - Réduit la taille de l'**Acteur** : 200×200px → **160×160px**, seul type dérogeant à la taille unique aujourd'hui imposée à tous les post-its.
  - L'Agrégat conserve la taille standard (200×200px).
- Le **Query Model** est inclus dans l'export Mermaid (comme Domain Event et Commande), au contraire de Point chaud/Question qui restent exclus : il représente une étape légitime du flux (l'information consultée), pas une incertitude d'atelier.

## Capabilities

### New Capabilities
(aucune — ces changements font évoluer des exigences déjà couvertes par `eventstorming-canvas`)

### Modified Capabilities
- `eventstorming-canvas`:
  - « Ajout d'éléments typés sur le canvas » : ajout du type Query Model, mise à jour des couleurs Agrégat/Système/Politique/Message d'intégration.
  - « Apparence des post-its en bordure solide et fond teinté » : le Query Model suit la règle générale (bordure + fond teinté).
  - « Post-its de taille fixe et homogène » : introduction d'une exception documentée pour l'Acteur (160×160px), tous les autres types conservant la taille unique de 200×200px.
  - « Aperçu du type dans la barre d'outils » : la pastille de la barre d'outils doit désormais aussi refléter la taille relative du post-it pour distinguer Acteur et Agrégat, qui partagent couleur et intensité.
- `workshop-export`:
  - « Export de l'atelier en diagramme Mermaid » : précise explicitement que le Query Model n'est pas exclu du diagramme (seuls Point chaud et Question le restent), et apparaît comme nœud au même titre que Domain Event ou Commande.

## Impact

- Code : `apps/web/src/shapes/eventStormingKinds.ts` (table des types, couleurs, hex), `apps/web/src/shapes/eventStormingPostIts.ts` (taille fixe → exception Acteur), `apps/web/src/shapes/resolveEventStormingKind.ts` (mapping legacy par couleur, à vérifier pour non-régression), `apps/web/src/components/EventStormingToolbar.tsx` (pastille de prévisualisation, nouveau raccourci clavier), `apps/web/src/pages/WorkshopPage.tsx` (EDITOR_OVERRIDES si le raccourci du Query Model entre en conflit avec un outil natif tldraw).
- Ateliers existants : les post-its déjà créés avec les anciennes couleurs (Agrégat gris, Système rouge, Politique violet, Message d'intégration vert) conservent leur type grâce au marquage explicite (`meta.esKind`) — seule leur teinte affichée change après la mise à jour du code, aucune migration de données n'est nécessaire. Le mapping legacy par couleur (post-its créés avant l'introduction de `meta.esKind`) doit être réexaminé pour éviter toute ambiguïté avec les nouvelles couleurs.
- Aucun impact sur `apps/server` ni sur le format de persistance (le type reste porté par `meta.esKind`, pas par la couleur).
