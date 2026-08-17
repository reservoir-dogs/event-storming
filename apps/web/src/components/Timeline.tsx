import { track, useEditor } from 'tldraw'

const STEP = 400 // page-space distance between ticks

export const Timeline = track(function Timeline() {
  const editor = useEditor()
  const pageBounds = editor.getViewportPageBounds()

  const firstTick = Math.floor(pageBounds.minX / STEP) * STEP
  const ticks: number[] = []
  for (let pageX = firstTick; pageX <= pageBounds.maxX + STEP; pageX += STEP) {
    ticks.push(pageX)
  }

  return (
    <div
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 24,
        background: 'rgba(255,255,255,0.85)',
        borderBottom: '1px solid #dee2e6',
        zIndex: 200,
        overflow: 'hidden',
      }}
    >
      {ticks.map((pageX) => {
        const { x: viewportX } = editor.pageToViewport({ x: pageX, y: 0 })
        return (
          <div
            key={pageX}
            style={{
              position: 'absolute',
              left: viewportX,
              top: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 4,
              borderLeft: '1px solid #ced4da',
              fontSize: 10,
              color: '#868e96',
            }}
          >
            {pageX}
          </div>
        )
      })}
    </div>
  )
})
