import type { TLDefaultColorStyle } from 'tldraw'

// Intensité du fond du post-it : fond teinté clair et libellé sombre (cas général), ou fond dans la
// couleur pleine du type et libellé blanc, qui distingue le point chaud et la question des deux
// types partageant leur couleur.
export type EventStormingFillEmphasis = 'tinted' | 'strong'

export interface EventStormingKind {
  id: string
  label: string
  color: TLDefaultColorStyle
  fillEmphasis: EventStormingFillEmphasis
  // Touche seule (sans modificateur) qui sélectionne ce type de post-it. Plusieurs de ces
  // lettres coïncident avec des raccourcis natifs de tldraw (outil gomme/e, dessin/x, flèche/a,
  // action "verrouiller l'outil"/q) ; ces raccourcis natifs sont désactivés ou déplacés vers une
  // autre lettre via la prop `overrides` de `<Tldraw>` (voir `EDITOR_OVERRIDES` dans
  // `WorkshopPage.tsx`) pour éviter tout conflit.
  shortcutKey: string
  // Taille fixe propre à ce type, si elle diffère de la taille standard (`DEFAULT_POST_IT_SIZE`
  // dans `eventStormingPostIts.ts`). Seul l'acteur en porte une aujourd'hui, plus petite que les
  // autres types, seul moyen de le distinguer de l'agrégat depuis que les deux partagent couleur
  // et intensité de fond (voir le commentaire sur `EVENT_STORMING_KINDS` ci-dessous).
  size?: { w: number; h: number }
}

// Couleurs alignées sur la convention communautaire EventStorming/DDD (légende DDD Crew), mappées
// sur la palette de 13 couleurs de tldraw (qui n'a ni jaune pâle/pink dédié, ni troisième niveau
// d'intensité, d'où certains écarts : système en `light-red` plutôt que rose, politique en
// `light-violet` plutôt que lilas).
// Deux couleurs sont partagées par deux types : rouge (système / point chaud) et vert
// (message d'intégration / question). C'est l'intensité du fond qui les distingue, et c'est le
// couple (couleur, intensité) qui est unique par type — voir `resolveEventStormingKind` pour la
// lecture du type d'un post-it.
//   → Correction : depuis l'alignement sur le canon, l'agrégat rejoint l'acteur en jaune/teinté,
//     seul couple partagé qui n'est PAS distingué par l'intensité (les deux restent teinté) — voir
//     `size` ci-dessus : la taille de l'acteur, réduite, est ce qui les distingue, comme dans la
//     convention (petit acteur / grand agrégat). Le vert/teinté, lui, se libère (message
//     d'intégration migre vers le gris) pour le nouveau type query model.
// Ordre d'affichage dans la toolbar (indépendant de l'ordre logique ci-dessus avant refonte) :
// l'acteur ouvre la liste juste après l'outil de sélection, et le query model suit directement la
// commande, comme pendant en lecture du couple commande/domain event en écriture.
export const EVENT_STORMING_KINDS: EventStormingKind[] = [
  {
    id: 'actor',
    label: 'Actor',
    color: 'yellow',
    fillEmphasis: 'tinted',
    shortcutKey: 'x',
    size: { w: 160, h: 160 },
  },
  { id: 'domain-event', label: 'Domain Event', color: 'orange', fillEmphasis: 'tinted', shortcutKey: 'e' },
  { id: 'command', label: 'Command', color: 'blue', fillEmphasis: 'tinted', shortcutKey: 'c' },
  {
    id: 'query-model',
    label: 'Query Model',
    color: 'green',
    fillEmphasis: 'tinted',
    shortcutKey: 'r',
  },
  { id: 'aggregate', label: 'Aggregate', color: 'yellow', fillEmphasis: 'tinted', shortcutKey: 'a' },
  { id: 'policy', label: 'Policy', color: 'light-violet', fillEmphasis: 'tinted', shortcutKey: 'p' },
  { id: 'system', label: 'System', color: 'light-red', fillEmphasis: 'tinted', shortcutKey: 's' },
  {
    id: 'integration-message',
    label: 'Integration Message',
    color: 'grey',
    fillEmphasis: 'tinted',
    shortcutKey: 'i',
  },
  { id: 'hotspot', label: 'Hotspot', color: 'red', fillEmphasis: 'strong', shortcutKey: 'h' },
  { id: 'question', label: 'Question', color: 'green', fillEmphasis: 'strong', shortcutKey: 'q' },
]

// Équivalent hexadécimal des couleurs tldraw utilisées par les types, seule source de vérité de
// la palette : les pastilles de la barre d'outils et les styles du diagramme Mermaid exporté
// doivent afficher exactement la même teinte par type.
// `light-violet` et `light-red` ont été relevées sur le trait (`stroke`) d'un post-it Politique et
// Système réels, rendus par un éditeur tldraw (inspection du SVG produit), le même principe que les
// autres entrées de cette table.
export const KIND_COLOR_HEX: Record<string, string> = {
  orange: '#f76707',
  blue: '#4263eb',
  yellow: '#f2c40c',
  grey: '#868e96',
  violet: '#7048e8',
  'light-violet': '#e085f4',
  red: '#e03131',
  'light-red': '#f87777',
  green: '#2f9e44',
}

export function colorHexForKind(kind: EventStormingKind): string {
  return KIND_COLOR_HEX[kind.color]
}

export function kindById(id: string): EventStormingKind | undefined {
  return EVENT_STORMING_KINDS.find((kind) => kind.id === id)
}

// Le point chaud et la question matérialisent des incertitudes d'atelier, pas des étapes du flux :
// ils sont exclus du diagramme Mermaid exporté (voir `buildMermaidFlowchart`), tout comme les liens
// dont ils sont une extrémité.
export const MERMAID_EXCLUDED_KIND_IDS: readonly string[] = ['hotspot', 'question']
