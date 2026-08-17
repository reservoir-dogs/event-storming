import { expect, test } from '@playwright/test'

const SHAPE_COUNT = 500
const MAX_SEED_MS = 8_000
const MAX_INTERACTION_MS = 1_000

test('the canvas stays responsive with a large number of elements', async ({ page, request }) => {
  const created = await request.post('http://localhost:4000/api/workshops', {
    data: { name: 'Atelier volumineux' },
  })
  expect(created.ok()).toBeTruthy()
  const { workshop } = await created.json()

  await page.addInitScript(() => {
    localStorage.setItem('event-storming:participant-name', 'Testeur de charge')
  })
  await page.goto(`/atelier/${workshop.id}`)
  await page.locator('.tl-canvas').waitFor()
  await page.waitForFunction(() => Boolean(window.__tldrawEditor))

  const seedMs = await page.evaluate((count) => {
    const editor = window.__tldrawEditor!
    const start = performance.now()
    const shapes = Array.from({ length: count }, (_, i) => ({
      type: 'note' as const,
      x: (i % 25) * 220,
      y: Math.floor(i / 25) * 220,
      props: { color: (['orange', 'blue', 'yellow', 'grey', 'violet', 'red', 'green'] as const)[i % 7] },
    }))
    editor.createShapes(shapes)
    return performance.now() - start
  }, SHAPE_COUNT)

  console.log(`Seeded ${SHAPE_COUNT} shapes in ${seedMs.toFixed(0)}ms`)
  expect(seedMs).toBeLessThan(MAX_SEED_MS)

  const shapeCount = await page.evaluate(() => window.__tldrawEditor!.getCurrentPageShapeIds().size)
  expect(shapeCount).toBe(SHAPE_COUNT)

  // A basic interaction (select-all + zoom-to-fit) should stay snappy: tldraw only
  // renders/hit-tests shapes intersecting the viewport, so this doesn't degrade
  // linearly with the total shape count as long as that culling is working.
  const interactionMs = await page.evaluate(() => {
    const editor = window.__tldrawEditor!
    const start = performance.now()
    editor.selectAll()
    editor.zoomToFit()
    return performance.now() - start
  })

  console.log(`Select-all + zoom-to-fit took ${interactionMs.toFixed(0)}ms`)
  expect(interactionMs).toBeLessThan(MAX_INTERACTION_MS)
})
