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
}

// Colors follow the classic event storming color coding, mapped onto tldraw's
// built-in note-shape palette (which has no pale-yellow/pink, hence the substitutions
// for aggregate/hotspot/question).
// Deux couleurs sont partagées par deux types : rouge (système / point chaud) et vert
// (message d'intégration / question). C'est l'intensité du fond qui les distingue, et c'est le
// couple (couleur, intensité) qui est unique par type — voir `resolveEventStormingKind` pour la
// lecture du type d'un post-it.
export const EVENT_STORMING_KINDS: EventStormingKind[] = [
  { id: 'domain-event', label: 'Domain Event', color: 'orange', fillEmphasis: 'tinted', shortcutKey: 'e' },
  { id: 'command', label: 'Commande', color: 'blue', fillEmphasis: 'tinted', shortcutKey: 'c' },
  { id: 'actor', label: 'Acteur', color: 'yellow', fillEmphasis: 'tinted', shortcutKey: 'x' },
  { id: 'aggregate', label: 'Agrégat', color: 'grey', fillEmphasis: 'tinted', shortcutKey: 'a' },
  { id: 'policy', label: 'Politique', color: 'violet', fillEmphasis: 'tinted', shortcutKey: 'p' },
  { id: 'system', label: 'Système', color: 'red', fillEmphasis: 'tinted', shortcutKey: 's' },
  {
    id: 'integration-message',
    label: "Message d'intégration",
    color: 'green',
    fillEmphasis: 'tinted',
    shortcutKey: 'i',
  },
  { id: 'hotspot', label: 'Point chaud', color: 'red', fillEmphasis: 'strong', shortcutKey: 'h' },
  { id: 'question', label: 'Question', color: 'green', fillEmphasis: 'strong', shortcutKey: 'q' },
]

// Équivalent hexadécimal des couleurs tldraw utilisées par les types, seule source de vérité de
// la palette : les pastilles de la barre d'outils et les styles du diagramme Mermaid exporté
// doivent afficher exactement la même teinte par type.
export const KIND_COLOR_HEX: Record<string, string> = {
  orange: '#f76707',
  blue: '#4263eb',
  yellow: '#f2c40c',
  grey: '#868e96',
  violet: '#7048e8',
  red: '#e03131',
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
