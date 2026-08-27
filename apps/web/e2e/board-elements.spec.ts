import { expect, test, type Page } from '@playwright/test'

// Le presse-papier est lu pour vérifier l'export Mermaid, qui n'a pas d'autre sortie observable.
test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

type BoardShape = {
  type: string
  kind?: string
  color?: string
  fill?: string
  labelColor?: string
  width?: number
  height?: number
  parentType?: string
  bindingCount?: number
}

// Lit l'état réel du board depuis l'éditeur tldraw exposé en développement, plutôt que d'inférer
// depuis le rendu : le type d'un post-it et les liaisons d'un lien ne sont pas lisibles à l'écran.
async function readBoard(page: Page): Promise<BoardShape[]> {
  return page.evaluate(() => {
    const editor = window.__tldrawEditor
    if (!editor) throw new Error('tldraw editor not exposed')
    return editor.getCurrentPageShapes().map((shape) => {
      const parent = editor.getShape(shape.parentId as never)
      const props = shape.props as {
        color?: string
        fill?: string
        labelColor?: string
        w?: number
        h?: number
      }
      return {
        type: shape.type,
        kind: shape.meta?.esKind as string | undefined,
        color: props.color,
        fill: props.fill,
        labelColor: props.labelColor,
        width: props.w,
        height: props.h,
        parentType: parent?.type,
        bindingCount: shape.type === 'arrow' ? editor.getBindingsFromShape(shape.id, 'arrow').length : undefined,
      }
    })
  })
}

async function openNewWorkshop(page: Page, name: string) {
  await page.goto('/')
  await page.getByPlaceholder(/votre nom/i).fill('Alice')
  await page.getByRole('button', { name: /continuer/i }).click()
  await page.getByPlaceholder(/nom de l'atelier/i).fill(name)
  await page.getByRole('button', { name: /créer un atelier/i }).click()
  await page.waitForURL(/\/atelier\//)
  await page.locator('.tl-canvas').waitFor()
}

async function typeLabel(page: Page, label: string) {
  await page.locator('[contenteditable]').first().waitFor()
  await page.keyboard.type(label)
  await expect(page.getByText(label).locator('visible=true')).toHaveCount(1, { timeout: 10_000 })
  await page.keyboard.press('Escape')
}

// Centre à l'écran d'un post-it, repéré par son type : point de départ des gestes de survol et de
// glissé, indépendant du zoom et du défilement du canvas.
async function screenCenterOfKind(page: Page, kindId: string) {
  return page.evaluate((kind) => {
    const editor = window.__tldrawEditor
    if (!editor) throw new Error('tldraw editor not exposed')
    const shape = editor.getCurrentPageShapes().find((candidate) => candidate.meta?.esKind === kind)
    if (!shape) throw new Error(`No post-it of kind ${kind}`)
    const bounds = editor.getShapePageBounds(shape.id)
    if (!bounds) throw new Error(`No bounds for kind ${kind}`)
    const { x, y } = editor.pageToScreen({ x: bounds.center.x, y: bounds.center.y })
    return { x, y }
  }, kindId)
}

test('the toolbar offers the ten event storming element types, in order', async ({ page }) => {
  await openNewWorkshop(page, 'Atelier types')

  const kindTitles = await page.locator('[data-es-toolbar] button[draggable="true"]').evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute('title')),
  )

  expect(kindTitles).toEqual([
    'Actor (X)',
    'Domain Event (E)',
    'Command (C)',
    'Query Model (R)',
    'Aggregate (A)',
    'Policy (P)',
    'System (S)',
    'Integration Message (I)',
    'Hotspot (H)',
    'Question (Q)',
  ])
})

test('a type dragged from the toolbar creates a labelled post-it where it is dropped', async ({ page }) => {
  await openNewWorkshop(page, 'Atelier glisser-déposer')

  await page.dragAndDrop('[data-es-toolbar] button[title^="System"]', '.tl-canvas', {
    targetPosition: { x: 500, y: 300 },
  })
  await typeLabel(page, 'Facturation')

  const shapes = await readBoard(page)
  expect(shapes).toHaveLength(1)
  expect(shapes[0]).toMatchObject({ type: 'geo', kind: 'system', color: 'light-red', width: 200, height: 200 })
})

test('a query model dragged from the toolbar creates a labelled post-it, included in the Mermaid export', async ({
  page,
}) => {
  await openNewWorkshop(page, 'Atelier query model')

  await page.dragAndDrop('[data-es-toolbar] button[title^="Query Model"]', '.tl-canvas', {
    targetPosition: { x: 500, y: 300 },
  })
  await typeLabel(page, 'Liste des produits')

  const shapes = await readBoard(page)
  expect(shapes).toHaveLength(1)
  expect(shapes[0]).toMatchObject({ type: 'geo', kind: 'query-model', color: 'green', width: 200, height: 200 })

  await page.getByTestId('main-menu.button').click()
  await page.getByTestId('main-menu.copy-mermaid').click()
  const mermaid = await page.evaluate(() => navigator.clipboard.readText())
  expect(mermaid).toContain('Liste des produits')
})

test('dropping a type on the toolbar itself creates nothing', async ({ page }) => {
  await openNewWorkshop(page, 'Atelier dépôt annulé')

  await page.dragAndDrop(
    '[data-es-toolbar] button[title^="System"]',
    '[data-es-toolbar] button[title^="Question"]',
  )

  expect(await readBoard(page)).toHaveLength(0)
})

test('a post-it dropped inside a swimlane belongs to it', async ({ page }) => {
  await openNewWorkshop(page, 'Atelier couloir')

  await page.getByTitle(/^Swimlane/).click()
  await page.locator('.tl-canvas').click({ position: { x: 500, y: 350 } })
  await page.keyboard.press('Escape')

  await page.dragAndDrop('[data-es-toolbar] button[title^="Command"]', '.tl-canvas', {
    targetPosition: { x: 500, y: 350 },
  })
  await typeLabel(page, 'Passer commande')

  const postIt = (await readBoard(page)).find((shape) => shape.kind === 'command')
  expect(postIt?.parentType).toBe('frame')
})

test('question and query model stand out from each other despite sharing green', async ({ page }) => {
  await openNewWorkshop(page, 'Atelier couleurs partagées (vert)')

  await page.getByTitle(/^Question/).click()
  await page.locator('.tl-canvas').click({ position: { x: 400, y: 250 } })
  await typeLabel(page, 'Et si le stock manque ?')

  await page.getByTitle(/^Query Model/).click()
  await page.locator('.tl-canvas').click({ position: { x: 800, y: 250 } })
  await typeLabel(page, 'Liste des produits')

  const shapes = await readBoard(page)
  const kindsByColor = shapes.filter((shape) => shape.color === 'green').map((shape) => shape.kind)
  expect(kindsByColor.sort()).toEqual(['query-model', 'question'].sort())

  // Fond dans la couleur pleine du type et libellé blanc pour la question, fond teinté et libellé
  // sombre pour le query model : les deux verts ne se confondent pas.
  expect(shapes.find((shape) => shape.kind === 'question')).toMatchObject({
    fill: 'fill',
    labelColor: 'white',
  })
  expect(shapes.find((shape) => shape.kind === 'query-model')).toMatchObject({
    fill: 'solid',
    labelColor: 'black',
  })
})

test('actor and aggregate stand out from each other by size despite sharing yellow and its intensity', async ({
  page,
}) => {
  await openNewWorkshop(page, 'Atelier couleurs partagées (jaune)')

  await page.getByTitle(/^Actor/).click()
  await page.locator('.tl-canvas').click({ position: { x: 400, y: 250 } })
  await typeLabel(page, 'Client')

  await page.getByTitle(/^Aggregate/).click()
  await page.locator('.tl-canvas').click({ position: { x: 800, y: 250 } })
  await typeLabel(page, 'Commande')

  const shapes = await readBoard(page)
  const kindsByColor = shapes.filter((shape) => shape.color === 'yellow').map((shape) => shape.kind)
  expect(kindsByColor.sort()).toEqual(['actor', 'aggregate'].sort())

  expect(shapes.find((shape) => shape.kind === 'actor')).toMatchObject({ width: 160, height: 160 })
  expect(shapes.find((shape) => shape.kind === 'aggregate')).toMatchObject({ width: 200, height: 200 })
})

test('dragging a connection handle onto another post-it links the two', async ({ page }) => {
  await openNewWorkshop(page, 'Atelier poignées')

  await page.getByTitle(/^Command/).click()
  await page.locator('.tl-canvas').click({ position: { x: 400, y: 250 } })
  await typeLabel(page, 'Passer commande')

  await page.getByTitle(/^Domain Event/).click()
  await page.locator('.tl-canvas').click({ position: { x: 800, y: 250 } })
  await typeLabel(page, 'Commande passée')

  const from = await screenCenterOfKind(page, 'command')
  const to = await screenCenterOfKind(page, 'domain-event')

  // Les poignées n'apparaissent qu'au survol, avec l'outil de sélection actif.
  await page.mouse.move(from.x, from.y)
  const handles = page.locator('button[title*="créer un lien"]')
  await expect(handles).toHaveCount(4)

  // Poignée du bord droit, face au post-it cible.
  await handles.nth(1).hover()
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 10 })
  await page.mouse.up()

  const link = (await readBoard(page)).find((shape) => shape.type === 'arrow')
  expect(link?.bindingCount).toBe(2)

  // Les poignées disparaissent dès que le pointeur quitte le post-it.
  await page.mouse.move(20, 700)
  await expect(handles).toHaveCount(0)
})

test('linking the selection needs exactly two post-its', async ({ page }) => {
  await openNewWorkshop(page, 'Atelier relier la sélection')

  await page.getByTitle(/^Command/).click()
  await page.locator('.tl-canvas').click({ position: { x: 400, y: 250 } })
  await typeLabel(page, 'Passer commande')

  const linkSelection = page.getByTitle('Link selection')
  await expect(linkSelection).toBeDisabled()

  await page.getByTitle(/^Domain Event/).click()
  await page.locator('.tl-canvas').click({ position: { x: 800, y: 250 } })
  await typeLabel(page, 'Commande passée')
  await expect(linkSelection).toBeDisabled()

  await page.keyboard.press('Control+a')
  await expect(linkSelection).toBeEnabled()
  await linkSelection.click()

  const link = (await readBoard(page)).find((shape) => shape.type === 'arrow')
  expect(link?.bindingCount).toBe(2)

  // Une sélection contenant le lien lui-même n'est plus reliable.
  await page.keyboard.press('Control+a')
  await expect(linkSelection).toBeDisabled()
})

// Post-its des ateliers antérieurs au marquage du type : ils sont reproduits ici en retirant la
// `meta` du shape, ce qui est exactement l'état dans lequel ils ont été persistés. Leur apparence
// n'est pas retouchée — ils gardent celle qu'ils avaient — mais leur type reste reconnu.
test('post-its from older workshops keep their kind and export behaviour', async ({ page }) => {
  await openNewWorkshop(page, 'Atelier antérieur')

  await page.getByTitle(/^Hotspot/).click()
  await page.locator('.tl-canvas').click({ position: { x: 400, y: 250 } })
  await typeLabel(page, 'Qui valide ?')

  await page.getByTitle(/^Domain Event/).click()
  await page.locator('.tl-canvas').click({ position: { x: 800, y: 250 } })
  await typeLabel(page, 'Commande passée')

  await page.evaluate(() => {
    const editor = window.__tldrawEditor
    if (!editor) throw new Error('tldraw editor not exposed')
    // `updateShapes` fusionne la `meta` au lieu de la remplacer : le record est donc réécrit
    // directement dans le store, comme il l'aurait été avant l'introduction du marquage.
    for (const shape of editor.getCurrentPageShapes()) {
      editor.store.update(shape.id, (record) => ({ ...record, meta: {} }))
    }
  })
  expect((await readBoard(page)).map((shape) => shape.kind)).toEqual([undefined, undefined])

  // Les deux post-its restent affichés tels quels, sans marquage de type.
  await expect(page.getByText('Qui valide ?').locator('visible=true')).toHaveCount(1)
  await expect(page.getByText('Commande passée').locator('visible=true')).toHaveCount(1)

  await page.getByTestId('main-menu.button').click()
  await page.getByTestId('main-menu.copy-mermaid').click()
  const mermaid = await page.evaluate(() => navigator.clipboard.readText())
  expect(mermaid).toContain('Commande passée')
  expect(mermaid).not.toContain('Qui valide ?')
})

test('the Mermaid export leaves out hotspots, questions and the links that touch them', async ({ page }) => {
  await openNewWorkshop(page, 'Atelier export Mermaid')

  await page.getByTitle(/^Command/).click()
  await page.locator('.tl-canvas').click({ position: { x: 400, y: 250 } })
  await typeLabel(page, 'Passer commande')

  await page.getByTitle(/^Hotspot/).click()
  await page.locator('.tl-canvas').click({ position: { x: 800, y: 250 } })
  await typeLabel(page, 'Qui valide ?')

  await page.keyboard.press('Control+a')
  await page.getByTitle('Link selection').click()

  await page.getByTestId('main-menu.button').click()
  await page.getByTestId('main-menu.copy-mermaid').click()

  const mermaid = await page.evaluate(() => navigator.clipboard.readText())
  expect(mermaid).toContain('Passer commande')
  expect(mermaid).not.toContain('Qui valide ?')
  expect(mermaid).not.toContain('-->')
})
