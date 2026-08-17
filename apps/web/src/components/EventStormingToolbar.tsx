import { useEffect, useState } from 'react'
import { track, useEditor, type Editor } from 'tldraw'
import { createEventStormingLink } from '../shapes/createEventStormingLink'
import { TOOLBAR_DROP_GUARD_ATTRIBUTE, setDraggedKind } from '../shapes/eventStormingKindDrag'
import { getSelectedKind } from '../shapes/eventStormingKindSelection'
import { EVENT_STORMING_KINDS, KIND_COLOR_HEX, type EventStormingKind } from '../shapes/eventStormingKinds'
import { armPostItTool } from '../shapes/eventStormingPostIts'
import { resolveEventStormingKind } from '../shapes/resolveEventStormingKind'

function SelectIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <path d="M2 1.5L13 8L7.5 9L5.5 14L2 1.5Z" fill="#495057" />
    </svg>
  )
}

function SwimlaneIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3" width="13" height="10" rx="1" stroke="#495057" strokeWidth="1.5" />
      <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="#495057" strokeWidth="1.5" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <line x1="2" y1="13" x2="13" y2="3" stroke="#495057" strokeWidth="1.5" />
      <path d="M8 3H13V8" stroke="#495057" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function LinkSelectionIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="2" width="5" height="4" rx="1" stroke="#495057" strokeWidth="1.5" />
      <rect x="10" y="10" width="5" height="4" rx="1" stroke="#495057" strokeWidth="1.5" />
      <path d="M4 7V10H9" stroke="#495057" strokeWidth="1.5" fill="none" />
      <path d="M7 8L9.5 10L7 12" stroke="#495057" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function EraserIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <rect
        x="2.5"
        y="6.5"
        width="11"
        height="6"
        rx="1"
        transform="rotate(-15 8 9)"
        stroke="#495057"
        strokeWidth="1.5"
      />
    </svg>
  )
}

// Aperçu du type : bordure dans la couleur du type, et intérieur rempli de cette même couleur pour
// les types à fond appuyé (point chaud, question). Sans ce remplissage, deux types partageant une
// couleur — système et point chaud en rouge, message d'intégration et question en vert — auraient le
// même aperçu.
function KindSwatch({ kind }: Readonly<{ kind: EventStormingKind }>) {
  const color = KIND_COLOR_HEX[kind.color]

  return (
    <span
      style={{
        width: 14,
        height: 14,
        borderRadius: 3,
        border: `2px solid ${color}`,
        background: kind.fillEmphasis === 'strong' ? color : 'transparent',
        flexShrink: 0,
      }}
    />
  )
}

function ToolButton({
  label,
  shortcutLabel,
  isActive,
  isDisabled,
  expanded,
  swatch,
  icon,
  onClick,
  onDragStart,
}: Readonly<{
  label: string
  shortcutLabel?: string
  isActive: boolean
  isDisabled?: boolean
  expanded: boolean
  swatch?: React.ReactNode
  icon?: React.ReactNode
  onClick: () => void
  onDragStart?: (event: React.DragEvent<HTMLButtonElement>) => void
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      draggable={onDragStart !== undefined}
      onDragStart={onDragStart}
      title={shortcutLabel ? `${label} (${shortcutLabel})` : label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: expanded ? '6px 10px' : '6px',
        borderRadius: 6,
        border: isActive ? '2px solid #1971c2' : '1px solid #ced4da',
        background: isActive ? '#e7f5ff' : 'white',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.45 : 1,
        fontSize: 12,
        whiteSpace: 'nowrap',
        width: '100%',
        justifyContent: expanded ? 'flex-start' : 'center',
      }}
    >
      {swatch ?? icon}
      {expanded && (
        <span style={{ display: 'flex', flex: 1, justifyContent: 'space-between', gap: 8 }}>
          <span>{label}</span>
          {shortcutLabel && <span style={{ color: '#868e96' }}>{shortcutLabel}</span>}
        </span>
      )}
    </button>
  )
}

function isTypingInFormField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

// Les deux post-its à relier par la commande « Relier la sélection », dans l'ordre de sélection,
// ou `undefined` si la sélection ne s'y prête pas (nombre d'éléments, couloir de nage, lien).
function selectedPostItPair(editor: Editor) {
  const selectedIds = editor.getSelectedShapeIds()
  if (selectedIds.length !== 2) return undefined

  const areAllPostIts = selectedIds.every((id) => {
    const shape = editor.getShape(id)
    return shape !== undefined && resolveEventStormingKind(shape) !== undefined
  })

  return areAllPostIts ? ([selectedIds[0], selectedIds[1]] as const) : undefined
}

export const EventStormingToolbar = track(function EventStormingToolbar() {
  const editor = useEditor()
  const currentToolId = editor.getCurrentToolId()
  const selectedKind = getSelectedKind()
  const postItPairToLink = selectedPostItPair(editor)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isTypingInFormField(event.target) || editor.getEditingShapeId()) return

      const kind = EVENT_STORMING_KINDS.find((candidate) => candidate.shortcutKey === event.key.toLowerCase())
      if (!kind) return

      event.preventDefault()
      armPostItTool(editor, kind)
    }

    globalThis.addEventListener('keydown', handleKeyDown)
    return () => globalThis.removeEventListener('keydown', handleKeyDown)
  }, [editor])

  return (
    <div
      {...{ [TOOLBAR_DROP_GUARD_ATTRIBUTE]: '' }}
      style={{
        pointerEvents: 'all',
        position: 'absolute',
        top: '50%',
        left: 8,
        transform: 'translateY(-50%)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        width: expanded ? 220 : 44,
        maxHeight: 'calc(100vh - 16px)',
        overflowY: 'auto',
        padding: 8,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.95)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        title={expanded ? 'Réduire la boîte à outils' : 'Déplier la boîte à outils'}
        style={{ alignSelf: expanded ? 'flex-end' : 'center', border: 'none', background: 'none', cursor: 'pointer' }}
      >
        {expanded ? '«' : '»'}
      </button>

      <ToolButton
        label="Sélection"
        shortcutLabel="V"
        expanded={expanded}
        isActive={currentToolId === 'select'}
        icon={<SelectIcon />}
        onClick={() => editor.setCurrentTool('select')}
      />

      {EVENT_STORMING_KINDS.map((kind) => (
        <ToolButton
          key={kind.id}
          label={kind.label}
          shortcutLabel={kind.shortcutKey.toUpperCase()}
          expanded={expanded}
          swatch={<KindSwatch kind={kind} />}
          // Le type armé est mémorisé explicitement : le déduire des styles du prochain shape ne
          // permettrait pas de distinguer deux types de même couleur.
          isActive={currentToolId === 'geo' && selectedKind.id === kind.id}
          onClick={() => armPostItTool(editor, kind)}
          onDragStart={(event) => {
            if (event.dataTransfer) setDraggedKind(event.dataTransfer, kind)
          }}
        />
      ))}

      <ToolButton
        label="Couloir de nage"
        shortcutLabel="N"
        expanded={expanded}
        isActive={currentToolId === 'frame'}
        icon={<SwimlaneIcon />}
        onClick={() => editor.setCurrentTool('frame')}
      />
      <ToolButton
        label="Lien"
        shortcutLabel="L"
        expanded={expanded}
        isActive={currentToolId === 'arrow'}
        icon={<LinkIcon />}
        onClick={() => editor.setCurrentTool('arrow')}
      />
      <ToolButton
        label="Relier la sélection"
        expanded={expanded}
        isActive={false}
        isDisabled={postItPairToLink === undefined}
        icon={<LinkSelectionIcon />}
        onClick={() => {
          if (!postItPairToLink) return
          createEventStormingLink(editor, postItPairToLink[0], postItPairToLink[1])
        }}
      />
      <ToolButton
        label="Gomme"
        shortcutLabel="G"
        expanded={expanded}
        isActive={currentToolId === 'eraser'}
        icon={<EraserIcon />}
        onClick={() => editor.setCurrentTool('eraser')}
      />
    </div>
  )
})
