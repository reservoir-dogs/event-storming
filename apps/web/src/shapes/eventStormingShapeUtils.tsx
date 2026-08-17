import { ArrowShapeUtil, GeoShapeUtil } from 'tldraw'
import { POST_IT_SIZE } from './eventStormingPostIts'
import { resolveEventStormingKind } from './resolveEventStormingKind'

// tldraw entoure par défaut le libellé d'un halo (`--tl-text-outline`, un empilement de
// text-shadow dans la couleur de fond du canvas) pour le garder lisible par-dessus un fond de
// couleur variable. Sur les post-its à fond plein (point chaud, question), ce halo est de la même
// couleur que le libellé blanc lui-même : au lieu de rester invisible, il élargit visuellement
// chaque lettre dans plusieurs directions, ce qui donne un texte à l'aspect épaissi, presque gras.
// Cette variable CSS est lue par héritage : la redéfinir à `none` sur un ancêtre du rendu du
// libellé suffit à annuler le halo pour ce seul post-it, sans toucher aux autres types ni à
// l'option `showTextOutline` de `GeoShapeUtil` (globale à tous les `geo`).
const NO_TEXT_OUTLINE_STYLE = { '--tl-text-outline': 'none' } as React.CSSProperties

function hasStrongFill(shape: Parameters<GeoShapeUtil['component']>[0]): boolean {
  return resolveEventStormingKind(shape)?.fillEmphasis === 'strong'
}

// Les post-its (rectangles) ne sont pas redimensionnables manuellement, et gardent toujours la
// même taille quel que soit leur type ou la longueur du libellé saisi : sans ce verrou, tldraw
// agrandit nativement un rectangle pour faire tenir un premier libellé (`GeoShapeUtil.onBeforeUpdate`
// / `expandShapeForFirstLabel`), ce qui produisait des post-its de tailles différentes selon le
// texte tapé.
export class FixedSizeGeoShapeUtil extends GeoShapeUtil {
  canResize() {
    return false
  }

  onBeforeCreate(shape: Parameters<GeoShapeUtil['onBeforeCreate']>[0]) {
    return { ...shape, props: { ...shape.props, ...POST_IT_SIZE, growY: 0 } }
  }

  onBeforeUpdate(_prev: unknown, next: Parameters<GeoShapeUtil['onBeforeUpdate']>[1]) {
    const { w, h, growY } = next.props
    if (w === POST_IT_SIZE.w && h === POST_IT_SIZE.h && growY === 0) return
    return { ...next, props: { ...next.props, ...POST_IT_SIZE, growY: 0 } }
  }

  // La `<div>` ajoutée ici n'a pas de `position` propre : les conteneurs internes de tldraw
  // (`.tl-svg-container`, `.tl-html-container`), positionnés en absolu par leur propre CSS,
  // continuent donc de se positionner par rapport au véritable conteneur du shape, plus haut dans
  // l'arbre, exactement comme sans cette enveloppe.
  component(shape: Parameters<GeoShapeUtil['component']>[0]) {
    if (!hasStrongFill(shape)) return super.component(shape)
    return <div style={NO_TEXT_OUTLINE_STYLE}>{super.component(shape)}</div>
  }

  // Même correction pour l'export (PNG, vignettes d'atelier) : un `<g>` porte la même variable CSS,
  // valide en SVG comme en HTML.
  toSvg(shape: Parameters<GeoShapeUtil['toSvg']>[0], ctx: Parameters<GeoShapeUtil['toSvg']>[1]) {
    if (!hasStrongFill(shape)) return super.toSvg(shape, ctx)
    return <g style={NO_TEXT_OUTLINE_STYLE}>{super.toSvg(shape, ctx)}</g>
  }
}

// Les flèches ne servent qu'à relier des éléments entre eux : elles ne portent pas de libellé.
export class UnlabeledArrowShapeUtil extends ArrowShapeUtil {
  canEdit() {
    return false
  }
}
