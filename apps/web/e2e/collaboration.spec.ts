import { expect, test } from '@playwright/test'

test('two participants collaborate on the same workshop canvas in real time', async ({
  page,
  browser,
}) => {
  await page.goto('/')
  await page.getByPlaceholder(/votre nom/i).fill('Alice')
  await page.getByRole('button', { name: /continuer/i }).click()

  await page.getByPlaceholder(/nom de l'atelier/i).fill('Atelier e2e')
  await page.getByRole('button', { name: /créer un atelier/i }).click()
  await page.waitForURL(/\/atelier\//)
  const workshopUrl = page.url()

  const secondContext = await browser.newContext()
  const secondPage = await secondContext.newPage()
  await secondPage.goto('/')
  await secondPage.getByPlaceholder(/votre nom/i).fill('Bob')
  await secondPage.getByRole('button', { name: /continuer/i }).click()
  await secondPage.goto(workshopUrl)

  await page.locator('.tl-canvas').waitFor()
  await secondPage.locator('.tl-canvas').waitFor()

  // Participant 1 adds a typed "Domain Event" sticky and labels it.
  await page.getByTitle(/^Domain Event/).click()
  await page.locator('.tl-canvas').click({ position: { x: 400, y: 300 } })
  // Wait for the shape's rich text editor to actually receive focus before typing,
  // otherwise the first keystroke can land before edit mode is ready and gets dropped.
  await page.locator('[contenteditable]').first().waitFor()
  await page.keyboard.type('Commande créée')
  // Wait for the shape's rendered label (not the raw contenteditable buffer, which can be
  // ambiguous since tldraw also keeps an offscreen measurement clone) to actually reflect
  // the full typed text before leaving edit mode — otherwise Escape can commit a shape prop
  // that lags behind a still-in-flight debounced update.
  await expect(page.getByText('Commande créée').locator('visible=true')).toHaveCount(1, {
    timeout: 10_000,
  })
  await page.keyboard.press('Escape')
  // Leaving edit mode can momentarily re-render the label from a shape prop that is one
  // tick behind the debounced rich-text sync (it self-corrects quickly) — re-assert the
  // full text has settled locally before checking that it propagated to the other tab,
  // otherwise this can flake on the *sender's own* transient state, not on sync at all.
  await expect(page.getByText('Commande créée').locator('visible=true')).toHaveCount(1, {
    timeout: 10_000,
  })

  // Participant 2 sees it appear without reloading (realtime-collaboration spec).
  // tldraw renders each text shape twice (a visible layer plus an offscreen measurement
  // clone), so assert that at least one of the matches is visible rather than picking one.
  await expect(secondPage.getByText('Commande créée').locator('visible=true')).toHaveCount(1, {
    timeout: 10_000,
  })

  // Participant 2 shows up as a collaborator to participant 1 (presence), each identified
  // by name (realtime-collaboration spec).
  await expect(page.getByText(/2 en ligne/)).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('Alice (vous)')).toBeVisible()
  await expect(page.getByText('Bob')).toBeVisible()

  // The workshop link can be copied from tldraw's own main menu (realtime-collaboration spec) —
  // the app no longer has its own header button for this.
  await page.getByTestId('main-menu.button').click()
  await expect(page.getByTestId('main-menu.copy-link')).toBeVisible()
  await page.keyboard.press('Escape')

  // Exporting the workshop produces a downloadable PNG, via tldraw's own main menu
  // (workshop-export spec) — the app no longer duplicates this in its own header button.
  await page.getByTestId('main-menu.button').click()
  await page.getByTestId('main-menu-sub.export-all-as-button').click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByTestId('main-menu.export-all-as-png').click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.png$/)

  // Renaming the workshop updates its title (eventstorming-canvas spec).
  await page.getByTitle("Renommer l'atelier").click()
  await page.keyboard.press('End')
  await page.keyboard.type(' (renommé)')
  await page.keyboard.press('Enter')
  await expect(page.getByTitle("Renommer l'atelier")).toHaveText('Atelier e2e (renommé)')

  // "Quitter l'atelier" in the main menu returns to the workshop list, which reflects the new
  // name (eventstorming-canvas spec) — the app no longer has its own header back button.
  // Scoped by href (not text) since repeated local runs can leave several
  // similarly-named workshops in the list.
  const workshopPath = new URL(workshopUrl).pathname
  await page.getByTestId('main-menu.button').click()
  await page.getByTestId('main-menu.leave-workshop').click()
  await expect(page).toHaveURL('/')
  await expect(page.locator(`a[href="${workshopPath}"]`)).toHaveText('Atelier e2e (renommé)')

  await secondContext.close()
})
