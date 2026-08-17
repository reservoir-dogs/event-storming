import { track, useEditor } from 'tldraw'

export const ParticipantsPanel = track(function ParticipantsPanel() {
  const editor = useEditor()
  const collaborators = editor.getCollaboratorsOnCurrentPage()
  const me = editor.user

  return (
    <div
      style={{
        pointerEvents: 'all',
        position: 'absolute',
        top: '50%',
        right: 8,
        transform: 'translateY(-50%)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6,
        padding: '8px 10px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.95)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        fontSize: 12,
        // Aligne la police sur celle de `EventStormingToolbar` : ses libellés sont rendus dans des
        // `<button>`, qui héritent nativement de la police UI du système, alors que ce panneau
        // n'utilise que des `<span>` (police serif par défaut du navigateur sans cette précision).
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <span style={{ color: '#495057' }}>{collaborators.length + 1} en ligne</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: me.getColor(),
            border: '1px solid white',
            boxShadow: '0 0 0 1px #adb5bd',
          }}
        />
        {me.getName()} (vous)
      </span>
      {collaborators.map((collaborator) => (
        <span key={collaborator.userId} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: collaborator.color,
              border: '1px solid white',
              boxShadow: '0 0 0 1px #adb5bd',
            }}
          />
          {collaborator.userName || 'Participant'}
        </span>
      ))}
    </div>
  )
})
