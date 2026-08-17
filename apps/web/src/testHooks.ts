import type { Editor } from 'tldraw'

declare global {
  interface Window {
    __tldrawEditor?: Editor
  }
}

// Exposes the editor instance on `window` in dev builds only, so Playwright specs
// (load test, e2e) can drive the canvas directly instead of through slow UI interactions.
export function exposeEditorForTesting(editor: Editor) {
  if (import.meta.env.DEV) {
    window.__tldrawEditor = editor
  }
}
