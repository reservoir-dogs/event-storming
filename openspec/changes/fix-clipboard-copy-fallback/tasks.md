## 1. Repli de copie dans le presse-papier

- [x] 1.1 Ajouter une fonction `copyToClipboard(text: string): Promise<void>` dans `apps/web/src/components/EventStormingMainMenu.tsx` : utilise `navigator.clipboard.writeText` quand `navigator.clipboard` existe, sinon repli via un `<textarea>` hors écran (`select()` + `document.execCommand('copy')`, puis suppression de l'élément).
- [x] 1.2 Remplacer l'appel direct dans `handleCopyLink` par `await copyToClipboard(globalThis.location.href)`.
- [x] 1.3 Remplacer l'appel direct dans `handleCopyMermaid` par `await copyToClipboard(buildMermaidFlowchart(editor))`.

## 2. Vérification

- [x] 2.1 `npm run build` (ou le script build de `apps/web`) sans erreur TypeScript.
- [ ] 2.2 Test manuel en local (contexte sécurisé) : les deux actions du menu principal ("Copier le lien de l'atelier", "Copier le diagramme (Mermaid)") copient toujours correctement via `navigator.clipboard`.
- [ ] 2.3 Test manuel en contexte simulé non sécurisé (DevTools : `Object.defineProperty(navigator, 'clipboard', {value: undefined})`) : les deux mêmes actions copient via le repli, sans lever d'erreur dans la console.
- [ ] 2.4 Si possible, valider sur l'environnement de production réel (`http://eventstorming.d1.esme.infra:4173`) que le clic sur les deux items de menu ne provoque plus le `TypeError` observé.
