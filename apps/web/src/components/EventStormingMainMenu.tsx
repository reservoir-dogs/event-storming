import type { JSX } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AccessibilityMenu,
  ColorSchemeMenu,
  DefaultMainMenu,
  EditSubmenu,
  ExportFileContentSubMenu,
  InputModeMenu,
  KeyboardShortcutsMenuItem,
  TldrawUiMenuGroup as UntypedTldrawUiMenuGroup,
  TldrawUiMenuItem,
  TldrawUiMenuSubmenu as UntypedTldrawUiMenuSubmenu,
  ToggleDebugModeItem,
  ToggleDynamicSizeModeItem,
  ToggleEdgeScrollingItem,
  ToggleFocusModeItem,
  TogglePasteAtCursorItem,
  ToggleToolLockItem,
  ToggleWrapModeItem,
  ViewSubmenu,
  useEditor,
  type TLUiMenuGroupProps,
  type TLUiMenuSubmenuProps,
} from 'tldraw'
import { deleteWorkshop } from '../api/workshops'
import { buildMermaidFlowchart } from '../export/buildMermaidFlowchart'

// tldraw ships `TldrawUiMenuGroup`/`TldrawUiMenuSubmenu` with a `.d.ts` return type widened to
// include `bigint` (a React 19 `ReactNode` artifact), which this project's React 18 types reject
// as a valid JSX component. Re-typing them here is the minimal workaround.
const TldrawUiMenuGroup = UntypedTldrawUiMenuGroup as unknown as (props: TLUiMenuGroupProps) => JSX.Element
const TldrawUiMenuSubmenu = UntypedTldrawUiMenuSubmenu as unknown as (props: TLUiMenuSubmenuProps) => JSX.Element

// `navigator.clipboard` n'existe qu'en contexte sécurisé (HTTPS ou localhost) ; en HTTP simple
// (ex. déploiement de production sans TLS), il est `undefined`. Le repli via `execCommand`
// reste fonctionnel dans les deux cas et ne nécessite pas de contexte sécurisé.
async function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

async function handleCopyLink() {
  await copyToClipboard(globalThis.location.href)
}

function CopyLinkMenuItem() {
  return <TldrawUiMenuItem id="copy-link" label="Copy workshop link" onSelect={handleCopyLink} />
}

function LeaveWorkshopMenuItem() {
  const navigate = useNavigate()
  return <TldrawUiMenuItem id="leave-workshop" label="Leave workshop" onSelect={() => navigate('/')} />
}

function CopyMermaidMenuItem() {
  const editor = useEditor()

  async function handleCopyMermaid() {
    await copyToClipboard(buildMermaidFlowchart(editor))
  }

  return (
    <TldrawUiMenuItem id="copy-mermaid" label="Copy diagram (Mermaid)" onSelect={handleCopyMermaid} />
  )
}

function DeleteWorkshopMenuItem() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  async function handleDelete() {
    if (!id) return
    const confirmed = globalThis.confirm('Permanently delete this workshop? This action is irreversible.')
    if (!confirmed) return
    await deleteWorkshop(id)
    navigate('/')
  }

  return <TldrawUiMenuItem id="delete-workshop" label="Delete workshop" onSelect={handleDelete} />
}

// Reprend `PreferencesGroup` de tldraw en retirant les bascules grille/accrochage : ces deux
// réglages sont imposés en permanence pour cet atelier (voir WorkshopPage.handleMount) et ne
// doivent pas pouvoir être désactivés par un participant.
function EventStormingPreferencesGroup() {
  return (
    <TldrawUiMenuGroup id="preferences">
      <TldrawUiMenuSubmenu id="preferences" label="menu.preferences">
        <TldrawUiMenuGroup id="preferences-actions">
          <ToggleToolLockItem />
          <ToggleWrapModeItem />
          <ToggleFocusModeItem />
          <ToggleEdgeScrollingItem />
          <ToggleDynamicSizeModeItem />
          <TogglePasteAtCursorItem />
          <ToggleDebugModeItem />
        </TldrawUiMenuGroup>
        <TldrawUiMenuGroup id="user-interface-submenus">
          <AccessibilityMenu />
          <InputModeMenu />
          <ColorSchemeMenu />
        </TldrawUiMenuGroup>
      </TldrawUiMenuSubmenu>
      <KeyboardShortcutsMenuItem />
    </TldrawUiMenuGroup>
  )
}

// Reprend `DefaultMainMenuContent` de tldraw en retirant l'insertion d'intégration et de média
// (superflues pour un atelier d'event storming) et en ajoutant la copie du lien de l'atelier.
export function EventStormingMainMenu() {
  return (
    <DefaultMainMenu>
      <TldrawUiMenuGroup id="basic">
        <EditSubmenu />
        <ViewSubmenu />
        <ExportFileContentSubMenu />
      </TldrawUiMenuGroup>
      <TldrawUiMenuGroup id="event-storming">
        <CopyLinkMenuItem />
        <CopyMermaidMenuItem />
        <LeaveWorkshopMenuItem />
      </TldrawUiMenuGroup>
      <TldrawUiMenuGroup id="danger">
        <DeleteWorkshopMenuItem />
      </TldrawUiMenuGroup>
      <EventStormingPreferencesGroup />
    </DefaultMainMenu>
  )
}
