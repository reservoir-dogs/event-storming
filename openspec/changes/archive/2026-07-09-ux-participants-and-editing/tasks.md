## 1. Identification du participant

- [x] 1.1 Créer un composant `RequireParticipantName` (ou hook `useParticipantName`) qui lit/écrit le nom du participant dans `localStorage` (`event-storming:participant-name`)
- [x] 1.2 Monter ce composant au-dessus du routeur dans `App.tsx` pour bloquer l'accès à `HomePage` et `WorkshopPage` tant qu'aucun nom n'est enregistré
- [x] 1.3 Afficher un formulaire de saisie du nom (validation : non vide) tant que le nom n'est pas défini
- [x] 1.4 Propager le nom enregistré aux préférences utilisateur tldraw (`editor.user.updateUserPreferences({ name })`) lors du montage de `WorkshopPage`

## 2. Présence et couleurs des participants

- [x] 2.1 Définir une palette fixe de couleurs dédiée aux participants (distincte de la palette des post-its) dans un module partagé
- [x] 2.2 Dans `WorkshopPage`, après connexion au store de sync, comparer la couleur du participant courant à celles de `editor.getCollaboratorsOnCurrentPage()` et réattribuer la première couleur libre via `editor.user.updateUserPreferences({ color })` en cas de collision
- [x] 2.3 Mettre à jour `ParticipantsPanel.tsx` pour afficher le nom de chaque participant (déjà disponible via `collaborator.userName`) à côté de son indicateur de couleur
- [x] 2.4 Vérifier manuellement que le curseur de chaque participant s'affiche avec sa couleur et à sa position réelle (comportement déjà porté par tldraw, à confirmer après les changements de couleur)

## 3. Navigation et renommage d'un atelier

- [x] 3.1 Ajouter `renameWorkshop(id, name)` dans `apps/server/src/db/database.ts` (met à jour `name` et `updated_at`)
- [x] 3.2 Ajouter la route `PATCH /api/workshops/:id` dans `apps/server/src/routes/workshops.ts` (validation nom non vide → 400, atelier introuvable → 404)
- [x] 3.3 Ajouter la fonction cliente `renameWorkshop` dans `apps/web/src/api/workshops.ts`
- [x] 3.4 Créer un composant `WorkshopHeader` (bouton retour vers `/` + titre de l'atelier éditable en ligne) et l'intégrer à `WorkshopPage.tsx`
- [x] 3.5 Répercuter le nouveau nom dans la liste des ateliers (`HomePage.tsx`) après un renommage réussi
- [x] 3.6 Ajouter dans `WorkshopHeader` un bouton "Copier le lien" qui appelle `navigator.clipboard.writeText(window.location.href)` et affiche une confirmation visuelle temporaire

## 4. Simplification du panneau d'édition (bloc de droite)

- [x] 4.1 Identifier dans `tldraw` les briques du `StylePanel` par défaut à conserver (taille, type de trait/remplissage, tête de flèche, etc.) et celles à exclure (couleur, opacité, police, alignement) en s'appuyant sur `useRelevantStyles` et les pickers exportés (`StylePanelColorPicker`, `StylePanelOpacityPicker`, `StylePanelFontPicker`, `StylePanelTextAlignPicker`/`StylePanelLabelAlignPicker`)
- [x] 4.2 Créer un composant `EventStormingStylePanel` qui recompose le panneau sans les pickers exclus
- [x] 4.3 Enregistrer ce composant via `components.StylePanel` dans `WorkshopPage.tsx`
- [x] 4.4 Fixer `DefaultFontStyle` à `sans` (police professionnelle) pour les nouveaux éléments, appliqué au même endroit que l'attribution de couleur par type dans `EventStormingToolbar.tsx`
- [x] 4.5 Vérifier visuellement, pour chaque type d'élément (post-it, swimlane, lien), qu'aucun réglage exclu n'apparaît encore et que la police reste homogène

## 5. Toolbar de gauche réductible

- [x] 5.1 Réorganiser `EventStormingToolbar.tsx` en colonne verticale positionnée à gauche du canvas
- [x] 5.2 Ajouter un état local `expanded` (bouton bascule) contrôlant l'affichage réduit (couleur/icône seule) vs déplié (libellé + raccourci)
- [x] 5.3 ~~Raccourcis clavier `Ctrl+<lettre>` des 7 types de post-its~~ — implémentés puis **retirés** (voir section 8) après confirmation que ces combinaisons entraient en conflit avec des raccourcis navigateur/OS/tldraw déjà établis
- [x] 5.4 Afficher les raccourcis existants de tldraw (sélection, swimlane, lien, gomme) dans la version dépliée
- [x] 5.5 Vérifier que la sélection de l'outil actif reste visible dans les deux versions (réduite et dépliée)

## 6. Export PNG

- [x] 6.1 Ajouter un bouton "Exporter en PNG" dans `WorkshopHeader` (ou `WorkshopOverlay`)
- [x] 6.2 Implémenter l'appel à `exportAs(editor, [...editor.getCurrentPageShapeIds()], { format: 'png', name: workshop.name })`
- [x] 6.3 Vérifier que le fichier téléchargé reflète fidèlement l'état courant du canvas

## 7. Vérification finale

- [x] 7.1 Mettre à jour/ajouter des tests (web: `RequireParticipantName` ; server: `renameWorkshop`) couvrant les nouveaux comportements
- [x] 7.2 Parcourir manuellement le scénario complet : saisie du nom → liste des ateliers → création/renommage d'un atelier → édition avec la nouvelle toolbar → export PNG → retour à la liste, avec deux navigateurs ouverts simultanément pour valider la présence multi-participants (couvert par `e2e/collaboration.spec.ts`, mis à jour et exécuté avec succès)

## 8. Corrections après retour utilisateur

- [x] 8.1 Retirer les raccourcis `Ctrl+<lettre>` (conflits confirmés) : suppression du gestionnaire `keydown` et du champ `shortcutKey` dans `eventStormingKinds.ts` ; les 4 outils non liés aux post-its (Sélection/Swimlane/Lien/Gomme) conservent l'affichage de leur raccourci natif tldraw (non concerné par le conflit)
- [x] 8.2 Créer les post-its comme des rectangles (`GeoShapeGeoStyle = 'rectangle'`, outil `geo`) avec bordure solide (`DefaultDashStyle = 'solid'`) et fond transparent (`DefaultFillStyle = 'none'`) au lieu du fond plein du shape `note`
- [x] 8.3 Restaurer le confort de saisie immédiate perdu par le passage à l'outil `geo` via un `editor.sideEffects.registerAfterCreateHandler('shape', ...)` qui déclenche `startEditingShapeWithRichText` juste après la création d'un rectangle
- [x] 8.4 Masquer la barre flottante de mise en forme du texte (`components.RichTextToolbar = null`) qui apparaissait encore pendant l'édition d'un libellé
- [x] 8.5 Masquer le sélecteur de page natif de tldraw (`components.PageMenu = null`), un atelier ne comportant qu'une seule page
- [x] 8.6 Repositionner `ParticipantsPanel` au milieu-droite en colonne verticale (`top:50%, right:8`) pour éliminer les chevauchements avec `EventStormingToolbar` (haut-gauche) et `WorkshopHeader` (haut-droite)
- [x] 8.7 Mettre à jour `design.md`/specs pour refléter ces changements, et adapter `e2e/collaboration.spec.ts` (porte de saisie du nom, sélecteur de titre insensible aux raccourcis, création de post-it via `geo`, assertion de renommage scopée par lien pour éviter les faux positifs entre exécutions locales successives)

## 9. Deuxième retour utilisateur

- [x] 9.1 Restaurer des raccourcis clavier pour les 7 types de post-its, sous forme de touches seules sans modificateur (`M`/`C`/`I`/`J`/`P`/`U`/`S`, cf. `eventStormingKinds.ts` et `design.md` décision 4), en évitant toutes les lettres déjà utilisées nativement par tldraw (outils et actions globales) ; gestionnaire `keydown` gardé contre la saisie de texte et l'édition de forme, validé par un diagnostic dédié (log temporaire retiré) confirmant qu'aucun raccourci ne se déclenche pendant la frappe d'un libellé
- [x] 9.2 Changer le remplissage des post-its de transparent (`fill: 'none'`) à teinté dans la couleur du type (`fill: 'solid'`, qui utilise en réalité la teinte pastel de la couleur — voir design.md décision 4bis pour l'analyse des options natives tldraw)
- [x] 9.3 Repositionner `EventStormingToolbar` du haut-gauche vers le milieu du bord gauche (`top:50%, left:8`, translation verticale), en miroir de `ParticipantsPanel` à droite
- [x] 9.4 Supprimer entièrement le panneau de style (`components.StylePanel = null`) et le composant `EventStormingStylePanel.tsx`, devenu inutile
- [x] 9.5 Mettre à jour `design.md`, les specs (`eventstorming-canvas`) et ce fichier pour refléter ces changements
- [x] 9.6 Fiabiliser `e2e/collaboration.spec.ts` : attendre le rendu visible du texte complet (plutôt que le buffer `[contenteditable]`, ambigu à cause du clone de mesure hors-écran de tldraw) avant de quitter le mode édition, sur l'expéditeur comme après la sortie d'édition, avant de vérifier la propagation vers le second onglet
- [ ] 9.7 Investiguer la flakiness résiduelle de propagation cross-onglet du test e2e de collaboration (le texte se synchronise parfois avec un délai dépassant 10-15s) — suspectée liée à l'accumulation de rooms serveur en mémoire après de nombreuses exécutions successives du test dans une même session de développement plutôt qu'à une régression produit ; à reconfirmer après redémarrage propre des serveurs de dev

## 10. Troisième retour utilisateur

- [x] 10.1 Forcer la couleur des liens (flèches) à toujours être noire via `editor.sideEffects.registerBeforeCreateHandler('shape', ...)` dans `WorkshopPage`, quel que soit le type de post-it précédemment sélectionné et quel que soit le point d'entrée (bouton "Lien" ou raccourci natif tldraw `a`)
- [x] 10.2 Activer en permanence le mode grille (`editor.updateInstanceState({ isGridMode: true })`) et l'accrochage aux points (`editor.user.updateUserPreferences({ isSnapMode: true })`) au montage de l'atelier, et retirer les bascules correspondantes (`ToggleGridItem`, `ToggleSnapModeItem`) du menu principal pour qu'elles ne puissent pas être désactivées
- [x] 10.3 Retirer le bouton "Exporter en PNG" de `WorkshopHeader`, désormais redondant avec l'action "Export as → PNG" déjà présente dans le menu principal natif de tldraw ; adapter `e2e/collaboration.spec.ts` pour déclencher l'export via ce menu (`data-testid` `main-menu.button` / `main-menu-sub.export-all-as-button` / `main-menu.export-all-as-png`)
- [x] 10.4 Créer `EventStormingMainMenu` (composant `components.MainMenu`) qui recompose le menu principal de tldraw en retirant les actions "Insérer l'intégration" et "Charger un média" (`ExtrasGroup`), non pertinentes pour un atelier d'event storming
- [x] 10.5 Ajouter dans `EventStormingMainMenu` un item "Copier le lien de l'atelier", en complément du bouton déjà présent dans `WorkshopHeader`
- [x] 10.6 Rendre les post-its non redimensionnables via un `FixedSizeGeoShapeUtil` (sous-classe de `GeoShapeUtil` avec `canResize()` retournant `false`, enregistré via `shapeUtils` sur `<Tldraw>`) ; vérifier que la hauteur du post-it continue de s'ajuster automatiquement au contenu du libellé (mécanisme natif `growY`, indépendant du redimensionnement manuel — satisfait la demande d'un texte dont la taille s'adapte au contenu sans code supplémentaire)
- [x] 10.7 Empêcher la saisie de texte sur les liens via un `UnlabeledArrowShapeUtil` (sous-classe de `ArrowShapeUtil` avec `canEdit()` retournant `false`)
- [x] 10.8 Mettre à jour `design.md` (décisions 6 à 10) et les specs (`eventstorming-canvas`, `realtime-collaboration`) pour refléter ces changements
- [x] 10.9 Vérifier manuellement via un test Playwright ad hoc (non conservé) : grille visible, absence de "Insérer l'intégration"/"Charger un média" et présence de "Copier le lien" dans le menu principal, absence de poignées de redimensionnement sur un post-it sélectionné, absence d'édition de libellé sur un lien après double-clic, couleur d'un lien toujours noire (`black`) même juste après un post-it "Domain Event" (orange) ; re-exécuter la suite complète (`typecheck`, `lint`, `test`, `playwright test`)

## 11. Quatrième retour utilisateur

- [x] 11.1 Aligner la taille de tous les post-its sur celle du post-it "Acteur" : investigation via un test Playwright ad hoc (non conservé) confirmant que l'écart de taille venait de `GeoShapeUtil.onBeforeUpdate` (agrandissement natif au premier libellé, `expandShapeForFirstLabel`, puis à chaque frappe), "Acteur" (libellé le plus court) ne déclenchant jamais cet agrandissement ; `FixedSizeGeoShapeUtil` surcharge `onBeforeCreate`/`onBeforeUpdate` pour forcer `w: 200, h: 200, growY: 0` sur tout rectangle, quel que soit le contenu du libellé
- [x] 11.2 Retirer de `WorkshopHeader` le lien de retour vers la liste des ateliers et le bouton "Copier le lien" ; ajouter un item "Quitter l'atelier" dans `EventStormingMainMenu` (`useNavigate()` vers `/`)
- [x] 11.3 Corriger le chevauchement révélé par le retrait ci-dessus : le titre de `WorkshopHeader`, devenu seul élément de l'en-tête, se retrouvait exactement sous le bouton natif tldraw d'avatars des participants (`.tlui-people-menu__avatars-button`, visible dès 2 participants connectés) et interceptait ses clics ; `WorkshopHeader` repositionné de `top:8` à `top:56` pour passer sous la barre d'outils native
- [x] 11.4 Aligner la police de `ParticipantsPanel` sur celle de `EventStormingToolbar` (police système des `<button>` plutôt que la police serif par défaut des `<span>`), via une pile de polices système explicite
- [x] 11.5 Adapter `e2e/collaboration.spec.ts` : renommage et export déjà via le menu principal (section 10), retour à la liste des ateliers désormais via l'item "Quitter l'atelier" du menu principal (`data-testid` `main-menu.leave-workshop`) plutôt que le lien du header
- [x] 11.6 Mettre à jour `design.md` (décisions 6bis, 9, 11, 12) et les specs (`eventstorming-canvas`, `realtime-collaboration`) pour refléter ces changements ; re-exécuter la suite complète (`typecheck`, `lint`, `test`, `playwright test`)

## 12. Cinquième retour utilisateur

- [x] 12.1 Ajouter la suppression d'un atelier depuis le menu principal, avec confirmation bloquante (`globalThis.confirm`) : route `DELETE /api/workshops/:id`, `deleteWorkshop(id)` (`database.ts`, supprime la ligne `workshops` et l'éventuelle ligne `workshop_snapshots`) et `deleteRoomData(id)` (`roomManager.ts`, ferme la room en mémoire si active et supprime les tables SQL dédiées `room_<id>_documents`/`_tombstones`/`_metadata` créées dynamiquement par `SQLiteSyncStorage`)
- [x] 12.2 Ajouter la génération d'un diagramme Mermaid (`flowchart TD`) dans le presse-papier depuis le menu principal (`buildMermaidFlowchart`, nouveau module `export/buildMermaidFlowchart.ts`) : un nœud par post-it (libellé en texte brut via `renderPlaintextFromRichText`, couleur reprise du type), un `subgraph` par couloir de nage (contenant les post-its qui lui appartiennent, via `editor.getSortedChildIdsForParent`), une arête par lien résolu via `getArrowBindings` (liens non reliés à un élément à chaque extrémité ignorés)
- [x] 12.3 Renuméroter les raccourcis clavier des 7 types de post-its (Événement de domaine=E, Commande=C, Acteur=X, Agrégat=A, Politique=P, Point chaud=U inchangé, Question=Q) et des 3 outils natifs renommés (Couloir de nage=N, Lien=L, Gomme=G), en désactivant ou déplaçant via la prop `overrides` de `<Tldraw>` (`EDITOR_OVERRIDES` dans `WorkshopPage.tsx`) tous les raccourcis natifs tldraw en conflit (`eraser`, `arrow`, `frame`, `note`, `line`, l'alias `x` de l'outil dessin, les actions `toggle-tool-lock` et `select-geo-tool`)
- [x] 12.4 Mettre à jour les libellés affichés dans `EventStormingToolbar` (raccourcis N/L/G pour Couloir de nage/Lien/Gomme, renommage du libellé "Swimlane" en "Couloir de nage")
- [x] 12.5 Ajouter des tests serveur (`deleteWorkshop`, `deleteRoomData`) et web (unicité/format des nouvelles lettres de raccourci dans `eventStormingKinds.test.ts`) ; vérifier manuellement via un test Playwright ad hoc (non conservé) l'ensemble du nouveau schéma de raccourcis, l'export Mermaid (nœuds, arête, styles de couleur) et la suppression d'atelier avec confirmation
- [x] 12.6 Mettre à jour `design.md` (décisions 13, 14, 15) et les specs (`eventstorming-canvas`, `workshop-export`) pour refléter ces changements ; re-exécuter la suite complète (`typecheck`, `lint`, `test`, `playwright test`)
