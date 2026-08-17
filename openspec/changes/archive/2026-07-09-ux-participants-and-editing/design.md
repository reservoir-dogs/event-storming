## Context

L'atelier repose sur `tldraw` (canvas + presence + style panel) et `@tldraw/sync` (temps réel), avec un serveur Express/SQLite qui ne gère que la création/lecture d'ateliers (`apps/server/src/routes/workshops.ts`). Le front (`apps/web`) surcharge déjà deux emplacements du framework via `TLComponents` (`Toolbar` → `EventStormingToolbar`, `InFrontOfTheCanvas` → `WorkshopOverlay`) mais laisse le `StylePanel` et l'identité utilisateur à leurs valeurs par défaut. L'identité du participant (nom, couleur) est actuellement un préréglage tldraw arbitraire et persistant par navigateur (pas de saisie explicite, pas de garantie de couleur distincte entre participants).

## Goals / Non-Goals

**Goals:**
- Faire de la saisie du nom une étape obligatoire avant d'accéder à la liste des ateliers ou à un atelier.
- Réutiliser le système de présence tldraw existant (`editor.user`, `getCollaboratorsOnCurrentPage`) plutôt que de reconstruire une couche de presence.
- Retirer du panneau de style tout ce qui n'est pas strictement nécessaire pour l'event storming (in fine : le panneau entier), en s'appuyant sur les composants officiels de `TLComponents` plutôt que sur du CSS fragile.
- Garder les changements de navigation/renommage/export légers (pas de nouvel état serveur complexe).

**Non-Goals:**
- Authentification réelle des participants (pas de compte, pas de mot de passe) : le nom reste déclaratif.
- Garantie absolue d'unicité des couleurs en cas de connexions strictement simultanées (accepté comme risque mineur, cf. Risques).
- Refonte du modèle de données du canvas (les shapes/kinds existants ne changent pas de forme).
- Export dans d'autres formats que PNG (SVG/PDF hors périmètre).

## Decisions

### 1. Porte de saisie du nom au niveau du routeur, pas par page
On introduit un composant `RequireParticipantName` (ou équivalent) monté au-dessus des routes dans `App.tsx`, qui lit/écrit le nom dans `localStorage` (ex: clé `event-storming:participant-name`) et affiche un formulaire bloquant tant qu'aucun nom n'est enregistré. Une fois le nom présent, il est propagé à tldraw via les préférences utilisateur (`editor.user.updateUserPreferences({ name })`, ou prop `userPreferences`/`user` de `<Tldraw>`), qui persiste déjà nativement côté tldraw.
- **Alternative rejetée** : demander le nom séparément sur `HomePage` et sur `WorkshopPage`. Rejeté car cela duplique la logique et autorise un accès à la liste des ateliers sans nom, contrairement à la demande.

### 2. Attribution de couleur : palette fixe + résolution de collision côté client
On définit une palette fixe de couleurs (les couleurs `tldraw` déjà utilisées ailleurs, ex. `#f76707, #4263eb, #2f9e44, #7048e8, #e03131, #f2c40c, #868e96, ...`) distincte de la palette des post-its pour éviter la confusion visuelle. À la connexion à un atelier :
1. Le client lit sa couleur persistée (ou en tire une au hasard si absente).
2. Il consulte `editor.getCollaboratorsOnCurrentPage()` une fois la connexion établie ; si sa couleur est déjà prise, il choisit la première couleur libre de la palette et appelle `editor.user.updateUserPreferences({ color })`.
- **Alternative rejetée** : attribution de couleur côté serveur (nécessiterait un canal serveur dédié aux participants, hors périmètre du serveur actuel qui ne connaît que les ateliers, pas les sessions). Le choix client est cohérent avec le modèle "peer-to-peer via sync" déjà en place.

### 3. Panneau de style : retrait complet
Un premier essai a conservé un panneau de style custom (composant construit sur `useRelevantStyles` et les pickers unitaires exportés par `tldraw`, n'omettant que couleur/opacité/police/alignement) mais l'utilisateur a ensuite demandé sa **suppression totale**. `components.StylePanel = null` retire donc entièrement le panneau, sans composant de remplacement : couleur, police, remplissage et trait des post-its sont désormais intégralement pilotés par le type sélectionné dans `EventStormingToolbar` (décision 4bis), sans possibilité d'ajustement manuel après création.
- **Alternative rejetée** : conserver un panneau réduit (taille, trait, remplissage, flèches). Remplacé sur demande explicite de l'utilisateur ("Supprime le panel de style").
- **Alternative rejetée** : masquer les contrôles via CSS (`display: none` sur des sélecteurs `data-testid`). Rejeté car fragile aux montées de version de tldraw et moins explicite dans le code.

### 3bis. Police fixe et professionnelle pour les post-its
Puisque le choix de police est retiré du panneau, une police par défaut doit être imposée pour rester lisible et homogène. On fixe `DefaultFontStyle` à la valeur `sans` (police professionnelle et neutre proposée nativement par `tldraw`, cohérente avec l'esprit d'un atelier métier), appliquée via `editor.setStyleForNextShapes(DefaultFontStyle, 'sans')` au même endroit que l'attribution de couleur par type dans `EventStormingToolbar` (et, si nécessaire, en migrant silencieusement les shapes texte existantes lors du montage de l'atelier pour homogénéiser l'existant).
- **Alternative rejetée** : laisser la police par défaut de `tldraw` (`draw`, à rendu manuscrit). Rejeté car moins lisible/professionnel pour un atelier d'entreprise.

### 4. Toolbar de gauche : composant custom avec état réduit/déplié et raccourcis sans modificateur
`EventStormingToolbar` est une colonne verticale positionnée au milieu du bord gauche du canvas (`top:50%, left:8`, translation verticale — voir décision 6bis) avec un état local `expanded: boolean` :
- **Réduit** : chaque bouton affiche uniquement le swatch de couleur (post-its) ou une icône (sélection, swimlane, lien, gomme).
- **Déplié** : chaque bouton affiche en plus le libellé et son raccourci clavier.

Historique des raccourcis des 7 types de post-its (qui partagent tous l'outil `geo`, différencié par `DefaultColorStyle`, et n'ont donc pas de raccourci individuel nativement) :
1. Combinaisons `Ctrl+<lettre>` mnémotechniques : entraient en conflit avec des raccourcis navigateur/OS/tldraw déjà établis (`Ctrl+C` copier, `Ctrl+A` tout sélectionner, `Ctrl+P` imprimer). Retirées après retour utilisateur.
2. Suppression pure et simple des raccourcis (clic uniquement) : rejetée à son tour, l'utilisateur voulant les conserver sous une autre forme ("transformer" plutôt que supprimer).
3. **Retenu** : touches seules, sans modificateur. Un gestionnaire `keydown` dédié dans `EventStormingToolbar` vérifie qu'aucun modificateur n'est actif, que l'utilisateur ne saisit pas de texte (`target.isContentEditable`, `<input>`/`<textarea>`) et qu'aucune forme n'est en cours d'édition (`editor.getEditingShapeId()`) avant d'appliquer le style du type puis d'activer l'outil `geo` (même effet qu'un clic sur le bouton).

Choix des lettres : évite systématiquement celles déjà utilisées en clair par tldraw, qu'il s'agisse d'un outil (`v` sélection, `h` main, `e` gomme, `d`/`b`/`x` dessin, `r` rectangle, `o` ellipse, `a` flèche, `l` ligne, `f` cadre, `t` texte, `n` note, `k` laser) ou d'une action globale (`g` "dernier outil géométrique utilisé", `q` verrouillage d'outil, `z` outil zoom) :

| Type de post-it | Touche | Mnémonique |
| --- | --- | --- |
| Domain Event | `M` | do**M**ain |
| Commande | `C` | **C**ommande |
| Acteur | `I` | arbitraire (lettres du mot déjà toutes prises) |
| Agrégat | `J` | arbitraire (lettres du mot déjà toutes prises) |
| Politique | `P` | **P**olitique |
| Point chaud | `U` | point cha**U**d |
| Question | `S` | que**S**tion |

- **Alternative rejetée** : `Ctrl+<lettre>`. Conflits navigateur/OS confirmés par l'utilisateur.
- **Alternative rejetée** : aucun raccourci. Rejetée à son tour par l'utilisateur, qui souhaitait une transformation et non une suppression pure.
- **Alternative rejetée** : raccourcis numériques `1`–`7`. Écartés avant même l'essai `Ctrl+<lettre>` : moins mnémotechniques qu'une lettre du mot.
- **Alternative rejetée** : garder une seule version horizontale avec un simple bouton "plus d'options". Rejeté car ne répond pas explicitement à la demande d'un bandeau vertical réduit/déplié.

### 4bis. Post-its : rectangles à bordure solide et fond teinté
Le shape `note` de tldraw (utilisé initialement pour les post-its) n'expose ni style de trait (`dash`) ni style de remplissage (`fill`) — son rendu est une carte à fond plein non personnalisable sur ces axes. Pour obtenir une bordure solide, les 7 types de post-its créent désormais un rectangle (`GeoShapeGeoStyle = 'rectangle'`, outil `geo`) avec `DefaultDashStyle = 'solid'`, la couleur du type étant appliquée à la bordure (`DefaultColorStyle`).

Pour le remplissage, la demande a évolué en deux temps :
1. Fond transparent (`DefaultFillStyle = 'none'`) : premier réglage.
2. Fond dans la même couleur que la bordure, à ~30% d'opacité perçue : demande affinée ensuite. `tldraw` ne propose pas de curseur d'opacité de remplissage en pourcentage exact ; parmi les styles natifs, `DefaultFillStyle = 'solid'` est celui qui correspond réellement à un remplissage teinté dans la couleur du type — malgré son nom, `GeoShapeUtil` calcule sa couleur de remplissage via le bucket `semi` (teinte pastel/atténuée) de la couleur choisie, ex. bleu → bleu pastel (`#dce1f8`), ce qui est visuellement l'équivalent le plus proche d'un fond à faible opacité de la même couleur sur un canvas blanc. Le style `fill` réellement nommé `'semi'` a été écarté : son rendu utilise une couleur de recouvrement neutre (`colors.solid`, la couleur "pleine" du thème), indépendante de la couleur du type — il aurait donné un fond gris/blanc plutôt qu'une teinte de la couleur du post-it.

Contrepartie du passage à l'outil `geo` : contrairement à l'outil `note`, un simple clic ne bascule pas automatiquement en édition du libellé (comportement natif de tldraw, cf. `GeoShapeTool`/`Pointing.ts`). Pour conserver le confort de saisie immédiate ("cliquer puis taper"), `WorkshopPage` enregistre un `editor.sideEffects.registerAfterCreateHandler('shape', ...)` qui détecte la création de tout rectangle (seul usage de l'outil `geo` dans cette application) et déclenche `startEditingShapeWithRichText` à la frame suivante (`editor.timers.requestAnimationFrame`, pour laisser `GeoShapeTool` terminer sa propre séquence de sélection/positionnement avant d'entrer en édition).
- **Alternative rejetée** : garder l'outil `note` et simuler visuellement une bordure/transparence par-dessus. Rejeté : `note` n'a pas de rendu transparent natif, un habillage CSS par-dessus le canvas WebGL/SVG de tldraw serait fragile et non synchronisé avec le zoom/pan.
- **Alternative rejetée** : laisser l'utilisateur double-cliquer pour éditer le libellé après création (comportement par défaut de l'outil `geo`). Rejeté : régression perçue par rapport au confort de saisie immédiate déjà en place avec `note`.
- **Alternative rejetée** : forker/étendre `GeoShapeUtil` pour un rendu SVG à `fill-opacity: 0.3` exact. Rejeté pour l'instant au profit du style `solid` natif (pastel), qui donne un résultat visuel proche sans maintenance d'un shape custom ; à revisiter si l'écart visuel gêne réellement l'usage.

### 4ter : Masquage du menu de page et de la barre de mise en forme du texte
`components.PageMenu = null` retire le sélecteur de page natif de tldraw (bouton "Page 1..."), inutile puisqu'un atelier ne contient qu'une seule page. `components.RichTextToolbar = null` retire la barre flottante de mise en forme du texte (gras/alignement) qui apparaissait pendant l'édition d'un libellé, redondante avec la simplification déjà apportée au panneau de style (décision 3).
- **Alternative rejetée** : masquer ces éléments par CSS. Rejeté pour la même raison qu'en décision 3 (fragilité, moins explicite).

### 5. Renommage d'un atelier : nouvelle route serveur `PATCH /api/workshops/:id`
Ajout d'une fonction `renameWorkshop(id, name)` dans `apps/server/src/db/database.ts` (met à jour `name` et `updated_at`) et d'une route `PATCH` correspondante, suivant le même style de validation que `POST /` (nom non vide, 400 sinon, 404 si atelier introuvable). Côté client, ajout de `renameWorkshop` dans `api/workshops.ts` et d'une UI d'édition inline du titre dans `WorkshopPage`/un nouveau composant `WorkshopHeader` regroupant bouton retour + titre éditable.
- **Alternative rejetée** : `PUT` complet de l'atelier. Rejeté car seul le nom est modifiable pour l'instant ; `PATCH` reflète mieux une mise à jour partielle.

### 5bis. Copie du lien d'invitation dans le presse-papier
Ajout d'un bouton "Copier le lien" dans `WorkshopHeader`, à côté du titre, qui appelle `navigator.clipboard.writeText(window.location.href)` (l'URL courante de l'atelier est déjà le lien partageable utilisé par `realtime-collaboration`) et affiche une confirmation visuelle brève (ex: changement temporaire du libellé du bouton en "Lien copié !").
- **Alternative rejetée** : générer un lien ou un identifiant d'invitation séparé de l'URL de l'atelier. Rejeté car l'URL de l'atelier est déjà le mécanisme de partage existant (cf. `realtime-collaboration` / "Rejoindre une session collaborative") ; pas besoin d'un nouveau système d'invitation.

### 6bis. Disposition des panneaux flottants pour éviter les chevauchements
Avec l'ajout de `WorkshopHeader`, plusieurs panneaux flottants (toolbar, en-tête d'atelier, participants) se disputaient le même coin haut-gauche ou se chevauchaient visuellement. Disposition retenue (après plusieurs ajustements demandés) :
- `EventStormingToolbar` : **milieu du bord gauche** (`top:50%, left:8`, translation verticale), verticale. Positionnée d'abord en haut-gauche (`top:8, left:8`), déplacée sur demande utilisateur.
- `WorkshopHeader` (titre uniquement, cf. décision 12) : haut-droite, sous la barre d'outils native de tldraw (`top:56, right:8`). N'inclut plus ni bouton d'export PNG (retiré, cf. décision 6), ni lien de retour, ni bouton "Copier le lien" (retirés, cf. décision 12). Positionné initialement à `top:8`, ce qui plaçait le titre — devenu le seul élément de l'en-tête — exactement sous le bouton natif tldraw d'avatars des participants (`.tlui-people-menu__avatars-button`, visible dès que plusieurs participants sont connectés) et interceptait les clics destinés au renommage ; décalé à `top:56` pour passer sous la barre d'outils native.
- `ParticipantsPanel` : milieu du bord droit (`top:50%, right:8`, translation verticale), disposé en colonne (liste empilée nom + couleur) plutôt qu'en ligne, pour occuper une zone encore libre du canvas et rester lisible avec de nombreux participants.
- **Alternative rejetée** : `ParticipantsPanel` en haut-centre (positionnement initial). Rejeté après retour utilisateur car il se superposait visuellement aux autres panneaux sur les écrans étroits.
- **Alternative rejetée** : `EventStormingToolbar` en haut-gauche (positionnement initial). Déplacée au milieu du bord gauche sur demande explicite de l'utilisateur, en miroir du panneau des participants à droite.
- **Alternative rejetée** : conserver `WorkshopHeader` à `top:8` et réduire le z-index natif de tldraw. Rejeté : le z-index de la barre d'outils native n'est pas destiné à être piloté par l'application ; déplacer notre propre panneau est plus simple et robuste aux futures évolutions de tldraw.

### 6. Export PNG via l'API `exportAs` de tldraw
Ajout initial d'un bouton "Exporter en PNG" (dans `WorkshopHeader`) qui appelait `exportAs(editor, editor.getCurrentPageShapeIds(), 'png', { name: workshop.name })`. **Superseded** : l'utilisateur a remarqué que le menu principal natif de tldraw propose déjà "Export as… → PNG" (`ExportFileContentSubMenu`, conservé dans `EventStormingMainMenu`, cf. décision 7) ; le bouton custom du header a donc été retiré pour ne pas dupliquer la fonctionnalité. Le comportement fonctionnel (export de la page courante en PNG téléchargeable) reste inchangé, seul le point d'entrée change.
- **Alternative rejetée** : génération de l'image côté serveur (nécessiterait un rendu headless du canvas côté serveur). Rejeté car `tldraw` fournit déjà un export client fiable et suffisant pour le besoin exprimé.

### 7. Menu principal personnalisé : retrait insertion média/intégration, ajout de la copie de lien
`components.MainMenu` est surchargé par `EventStormingMainMenu`, qui recompose le contenu de `DefaultMainMenuContent` de tldraw (via les briques exportées `EditSubmenu`, `ViewSubmenu`, `ExportFileContentSubMenu`, `TldrawUiMenuGroup`) en :
- retirant `ExtrasGroup` (actions `insert-embed` / "Insérer l'intégration" et `insert-media` / "Charger un média"), non pertinentes pour un atelier d'event storming ;
- ajoutant un item "Copier le lien de l'atelier" (`navigator.clipboard.writeText`), en plus du bouton déjà présent dans `WorkshopHeader` — les deux points d'entrée coexistent car retirer le bouton du header n'a pas été demandé (contrairement à l'export PNG, dont la duplication a été explicitement signalée).

Le groupe des préférences (`PreferencesGroup`) est également recomposé sans ses deux bascules `ToggleGridItem`/`ToggleSnapModeItem`, retirées pour cohérence avec la décision 8 (grille et accrochage imposés en permanence, pas de bascule possible).

Détail d'implémentation notable : les exports `TldrawUiMenuGroup`/`TldrawUiMenuSubmenu` de cette version de tldraw portent un type de retour `.d.ts` élargi à `bigint` (probablement généré avec des types React 19), incompatible avec les types React 18 de ce projet lorsqu'utilisés directement comme composants JSX. Contournement : un re-typage local (`as unknown as (props: TLUiMenuGroupProps) => JSX.Element`) dans `EventStormingMainMenu.tsx`, les props réels restant ceux exportés par `tldraw` (`TLUiMenuGroupProps`/`TLUiMenuSubmenuProps`).
- **Alternative rejetée** : masquer les actions `insert-embed`/`insert-media` via CSS (`display:none`). Rejeté pour la même raison qu'en décision 3 (fragilité, moins explicite).
- **Alternative rejetée** : retirer le bouton "Copier le lien" du header maintenant qu'il existe dans le menu. Non demandé explicitement à ce stade ; fait depuis (cf. décision 12).

### 8. Mode grille et accrochage aux points toujours actifs
`WorkshopPage.handleMount` appelle `editor.updateInstanceState({ isGridMode: true })` et `editor.user.updateUserPreferences({ isSnapMode: true })` pour activer ces deux réglages dès l'ouverture d'un atelier, afin de faciliter l'alignement des post-its. Comme ces réglages ne doivent pas pouvoir être désactivés, leurs bascules (`ToggleGridItem`, `ToggleSnapModeItem`) sont retirées du menu principal (décision 7) plutôt que simplement pré-cochées.
- **Alternative rejetée** : laisser les bascules dans le menu mais les initialiser à `true`. Rejeté car un participant pourrait les désactiver par inadvertance, contrairement à la demande ("toujours activés").

### 9. Post-its non redimensionnables, puis de taille strictement fixe et homogène
Un `FixedSizeGeoShapeUtil` (sous-classe de `GeoShapeUtil` avec `canResize()` retournant `false`) remplace l'utilitaire natif du shape `geo` (`shapeUtils={[FixedSizeGeoShapeUtil, ...]}` sur `<Tldraw>`, qui remplace par type via `mergeArraysAndReplaceDefaults`). Les poignées de redimensionnement n'apparaissent donc plus à la sélection d'un post-it.

Dans un premier temps, la hauteur du post-it continuait à s'ajuster automatiquement au contenu du libellé via `growY` (mécanisme natif de `GeoShapeUtil`, indépendant de `canResize`). **Superseded** : l'utilisateur a constaté que les post-its n'avaient pas tous la même taille à la création et a demandé d'aligner toutes les dimensions sur celles du post-it "Acteur". Investigation : la taille de base d'un rectangle créé d'un simple clic est bien la même pour tous les types (200×200, cf. `Pointing.complete()` dans `GeoShapeTool`, qui retombe sur ce défaut faute de `defaultSize` déclaré pour le type `rectangle`) — l'écart observé provient de `GeoShapeUtil.onBeforeUpdate` (méthode `expandShapeForFirstLabel` sur la saisie du premier libellé, puis recalcul de `growY`/largeur à chaque frappe) qui agrandit un rectangle pour faire tenir un libellé, à une hauteur et parfois une largeur différentes selon la longueur du texte tapé — "Acteur" (le plus court des 7 libellés) ne déclenchait jamais cet agrandissement et restait donc à la taille de base 200×200, contrairement aux autres.

`FixedSizeGeoShapeUtil` surcharge donc aussi `onBeforeCreate` et `onBeforeUpdate` pour forcer inconditionnellement `w: 200, h: 200, growY: 0` sur tout rectangle, quel que soit le contenu de son libellé — verrouillant la taille de tous les post-its sur celle, déjà native, du post-it "Acteur", et désactivant de fait l'auto-ajustement au contenu (décision antérieure, remplacée par celle-ci).
- **Alternative rejetée** : forker `GeoShapeUtil` pour ajouter un auto-ajustement de la largeur également. Rejeté avant le retour ci-dessus : non demandé explicitement à l'époque, et une largeur variable par post-it nuirait à l'alignement visuel en grille — argument invalidé depuis par la demande explicite d'une taille strictement fixe.
- **Alternative rejetée** : ne fixer que la hauteur (garder `expandShapeForFirstLabel` pour la largeur). Rejeté : l'écart de taille observé par l'utilisateur touchait aussi bien la largeur (labels longs sur une ligne) que la hauteur (labels qui débordent en plusieurs lignes) ; seul un verrouillage complet des deux dimensions garantit l'homogénéité demandée.

### 10. Flèches sans libellé et toujours noires
Deux comportements natifs des flèches tldraw ne convenaient pas à un usage de simple "lien" entre éléments :
- **Pas de texte sur une flèche** : un `UnlabeledArrowShapeUtil` (sous-classe de `ArrowShapeUtil` avec `canEdit()` retournant `false`, même mécanisme de remplacement par type que décision 9) empêche l'entrée en édition de libellé (double-clic), `canEdit` étant le point de contrôle central vérifié par l'éditeur avant d'ouvrir un mode d'édition.
- **Couleur toujours noire** : la couleur d'une flèche suit par défaut `DefaultColorStyle`, partagé avec le dernier type de post-it sélectionné (ex: une flèche tracée juste après un post-it "Commande" hériterait du bleu). Plutôt que de figer la couleur uniquement au clic sur le bouton "Lien" (ce qui n'aurait pas couvert le raccourci natif tldraw `a`), `WorkshopPage` enregistre un `editor.sideEffects.registerBeforeCreateHandler('shape', ...)` qui force `props.color = 'black'` sur toute flèche nouvellement créée, quel que soit le point d'entrée.
- **Alternative rejetée (couleur)** : appeler `setStyleForNextShapes(DefaultColorStyle, 'black')` uniquement dans le gestionnaire du bouton "Lien" de la toolbar. Rejeté : n'aurait pas couvert la création d'une flèche via le raccourci natif de l'outil flèche, quelle que soit la lettre qui lui est assignée (`a` à l'origine, `l` depuis la décision 15), puisque ce raccourci ne passe pas par ce bouton.

### 11. Retrait du lien de retour et du bouton "Copier le lien" du header, ajout de "Quitter l'atelier" au menu principal
Sur le même principe que le retrait du bouton d'export PNG (décision 6), le lien de retour vers la liste des ateliers (`← `, `title="Retour à la liste des ateliers"`) et le bouton "Copier le lien" sont retirés de `WorkshopHeader`. Le lien de retour est remplacé par un nouvel item "Quitter l'atelier" dans `EventStormingMainMenu` (`useNavigate()` de `react-router-dom`, navigation vers `/`) ; "Copier le lien" reste disponible uniquement via l'item déjà ajouté au menu principal (décision 7), sans équivalent dans le header. `WorkshopHeader` ne contient donc plus que le titre éditable de l'atelier (cf. décision 6bis pour le repositionnement qui en découle).
- **Alternative rejetée** : garder le lien de retour dans le header et ajouter "Quitter l'atelier" en plus dans le menu (deux façons de faire la même chose). Rejeté : contraire à la demande explicite de retirer le premier.

### 12. Police du panneau des participants alignée sur celle de la toolbar
Les libellés de `EventStormingToolbar` sont rendus dans de véritables éléments `<button>`, qui héritent nativement de la police des contrôles de formulaire du navigateur (une police système sans-serif, ex. Arial/Segoe UI selon l'OS). `ParticipantsPanel`, en revanche, n'utilisait que des `<span>` sans `fontFamily` explicite, qui héritent de la police par défaut du navigateur pour le texte courant (serif, ex. Times New Roman) — d'où un rendu visuellement incohérent entre les deux panneaux. Correction : `fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'` explicite sur le conteneur de `ParticipantsPanel` (la pile de polices système standard, celle que les navigateurs utilisent en interne pour les contrôles natifs).
- **Alternative rejetée** : le mot-clé CSS générique `system-ui` seul. Fonctionnellement équivalent dans un navigateur réel, mais son nom n'est pas résolu de la même façon que la police effectivement utilisée par un `<button>` dans `getComputedStyle` (vérifié en environnement de test Chromium headless) ; la pile explicite est le standard de facto (GitHub, Bootstrap) et documente clairement l'intention.

### 13. Suppression d'un atelier depuis le menu principal, avec confirmation
Ajout d'un item "Supprimer l'atelier" dans un groupe dédié (`event-storming-danger`, séparé visuellement des autres actions par la convention de regroupement de tldraw) de `EventStormingMainMenu`. Une confirmation bloquante (`globalThis.confirm(...)`) est demandée avant toute suppression effective, l'action étant irréversible ; en cas d'annulation, rien n'est appelé côté serveur.

Côté serveur, supprimer un atelier ne se limite pas à sa ligne dans la table `workshops` :
- `deleteWorkshop(id)` (`database.ts`) supprime la ligne `workshops` et l'éventuelle ligne `workshop_snapshots` associée (table de snapshot devenue vestigiale depuis le passage à `SQLiteSyncStorage`, mais toujours référencée par une contrainte de clé étrangère — supprimée par prudence, sans dépendre de `PRAGMA foreign_keys`, désactivé par défaut sur cette connexion SQLite).
- `deleteRoomData(id)` (`roomManager.ts`) ferme la room en mémoire si elle est active (`TLSocketRoom.close()`, déconnecte les participants encore présents) et supprime les tables SQL dédiées créées dynamiquement par `SQLiteSyncStorage`/`NodeSqliteWrapper` à la première connexion (`room_<id>_documents`, `_tombstones`, `_metadata`) — ces tables ne sont pas couvertes par le schéma déclaratif de `database.ts`.
- La route `DELETE /api/workshops/:id` n'appelle `deleteRoomData` qu'après confirmation que `deleteWorkshop` a bien supprimé une ligne existante : comme seuls des ids déjà au format valide peuvent correspondre à une ligne réelle, cela évite d'avoir à revalider explicitement le format de l'id avant de l'interpoler dans les noms de table.
- **Alternative rejetée** : une boîte de dialogue personnalisée (via le système `addDialog` de tldraw) plutôt que `window.confirm`. Rejeté pour l'instant : `confirm` est bloquant, toujours disponible sans dépendance supplémentaire, et suffisant pour une action ponctuelle et peu fréquente ; à revisiter si une confirmation plus riche (ex. taper le nom de l'atelier) est demandée.
- **Alternative rejetée** : compter sur `PRAGMA foreign_keys = ON` et `ON DELETE CASCADE` (déjà déclaré dans le schéma) pour nettoyer `workshop_snapshots` automatiquement. Rejeté : cette pragma n'est pas activée sur la connexion actuelle, donc la cascade déclarée dans le schéma n'a aucun effet réel ; suppression explicite à la place.

### 14. Export d'un diagramme Mermaid dans le presse-papier
Ajout d'un item "Copier le diagramme (Mermaid)" dans `EventStormingMainMenu`, qui construit une chaîne `flowchart TD` (`buildMermaidFlowchart(editor)`, nouveau module `export/buildMermaidFlowchart.ts`) et la copie via `navigator.clipboard.writeText`. Construction :
- Chaque post-it (`geo`) devient un nœud Mermaid, étiqueté avec son texte brut (`renderPlaintextFromRichText`, exporté par `tldraw`) ; un post-it sans libellé est étiqueté `(sans libellé)` plutôt que de produire un nœud vide.
- Chaque couloir de nage (`frame`) devient un `subgraph` Mermaid, contenant les post-its qui lui appartiennent au sens de la hiérarchie native tldraw (`editor.getSortedChildIdsForParent(frame.id)` — déposer un post-it dans un couloir de nage en fait déjà un enfant du frame, sans code supplémentaire à écrire pour cette relation).
- Chaque lien (`arrow`) devient une arête (`-->`) entre les deux éléments qu'il relie, résolus via `getArrowBindings(editor, shape)` (déjà utilisé en décision 10). Un lien dont une extrémité n'est reliée à aucun élément est ignoré : il n'a pas de sens dans un graphe de nœuds identifiés.
- Chaque nœud post-it reçoit une directive `style` reprenant la couleur de son type (même palette que `COLOR_SWATCH` dans `EventStormingToolbar`), en teinte à faible opacité (`<hex>33`) pour le fond et pleine pour le contour — cohérent avec l'apparence des post-its sur le canvas (décision 4bis/9).
- Les identifiants Mermaid (`n0`, `n1`, ...) sont générés séquentiellement plutôt que dérivés des ids de shape tldraw, qui contiennent des caractères (`:`) invalides pour un identifiant Mermaid nu.
- **Alternative rejetée** : dériver un identifiant Mermaid valide à partir de l'id de shape (ex: en retirant les caractères invalides). Rejeté : plus complexe qu'un simple compteur, pour un gain nul (les ids Mermaid ne sont jamais affichés, seuls les libellés le sont).
- **Alternative rejetée** : représenter les couloirs de nage par un simple préfixe de libellé plutôt qu'un `subgraph`. Rejeté : Mermaid supporte nativement les sous-graphes, qui rendent visuellement le regroupement au lieu de le suggérer par du texte.

### 15. Renumérotation complète des raccourcis clavier, avec désactivation des raccourcis natifs tldraw en conflit
Nouvelle affectation demandée par l'utilisateur : Événement de domaine = `E`, Commande = `C`, Acteur = `X`, Agrégat = `A`, Politique = `P`, Question = `Q`, Couloir de nage = `N`, Lien = `L`, Gomme = `G` (Point chaud non mentionné, conserve sa lettre existante `U`, déjà sans conflit).

Contrairement au précédent schéma (décision 4, lettres choisies pour éviter systématiquement tout raccourci natif), la majorité de ces nouvelles lettres coïncident avec des raccourcis déjà utilisés par tldraw : `e` (outil gomme), `x` (alias de l'outil dessin, avec `d`/`b`), `a` (outil flèche), `q` (action "verrouiller l'outil"), et — pour les 3 outils natifs renommés eux-mêmes — `n` (outil note, alors que Couloir de nage doit prendre `n` pour le frame), `l` (outil ligne, alors que Lien doit prendre `l` pour la flèche). Le gestionnaire `keydown` custom de `EventStormingToolbar` (qui gère uniquement les 7 types de post-its) ne peut pas empêcher le système de raccourcis natif de tldraw de réagir en parallèle à la même touche : les deux gestionnaires sont enregistrés indépendamment (l'un sur `document.body` par tldraw via `useKeyboardShortcuts`, l'autre sur `window` par `EventStormingToolbar`), et `event.preventDefault()` dans l'un n'empêche pas l'autre de s'exécuter.

Résolution via la prop `overrides` de `<Tldraw>` (`EDITOR_OVERRIDES` dans `WorkshopPage.tsx`), qui permet de modifier ou retirer le champ `kbd` des outils/actions natifs concernés avant qu'ils ne soient enregistrés :
- `tools.arrow.kbd` : `'a'` → `'l'` (Lien prend la lettre nativement associée à l'outil flèche lui-même — pas de gestionnaire custom nécessaire pour ce bouton, contrairement aux 7 types de post-its).
- `tools.eraser.kbd` : `'e'` → `'g'` (Gomme, même principe).
- `tools.frame.kbd` : `'f'` → `'n'` (Couloir de nage, même principe ; `f` redevient libre sans être réattribué).
- `tools.note.kbd` et `tools.line.kbd` : retirés (`undefined`). Ces deux outils natifs (note, ligne) ne sont pas utilisés dans cette application (les post-its sont des rectangles `geo`, les liens sont des flèches) ; leurs lettres d'origine (`n`, `l`) sont désormais prises par frame/flèche ci-dessus, donc ces raccourcis devenaient soit inertes soit doublement liés — retirés pour éviter toute ambiguïté.
- `actions['toggle-tool-lock'].kbd` et `actions['select-geo-tool'].kbd` : retirés (`undefined`), libérant respectivement `q` (Question) et `g` (déjà repris pour Gomme ci-dessus).
- `tools.draw.kbd` : `'d,b,x'` → `'d,b'` (retire uniquement l'alias `x`, conservé pour Acteur ; `d`/`b` restent des raccourcis valides pour l'outil dessin).

Avec ces changements, chaque lettre n'est plus enregistrée qu'à un seul endroit (soit le système natif de tldraw pour les 3 outils renommés, soit le gestionnaire custom pour les 7 types de post-its), éliminant tout risque de double déclenchement. Vérifié par un test Playwright ad hoc (non conservé) : chaque lettre du nouveau schéma sélectionne l'outil attendu (`editor.getCurrentToolId()`), et l'ancienne lettre `f` (frame) ne sélectionne plus rien.
- **Alternative rejetée** : garder le gestionnaire custom pour les 3 outils natifs renommés (Couloir de nage/Lien/Gomme) plutôt que de modifier directement `tools.*.kbd`. Rejeté : ces boutons appellent déjà directement `editor.setCurrentTool(...)`, sans logique spécifique à l'event storming (contrairement aux 7 types de post-its, qui doivent aussi fixer couleur/police/trait/remplissage) ; modifier leur `kbd` natif est plus direct et évite un second point de vérité pour la même touche.
- **Alternative rejetée** : `stopPropagation()`/`stopImmediatePropagation()` dans le gestionnaire custom pour empêcher le système natif de réagir. Rejeté : les deux gestionnaires sont attachés à des cibles différentes (`body` vs `window`) dans l'ordre de bulle DOM, donc le gestionnaire natif de tldraw (sur `body`, plus proche de la cible) s'exécuterait de toute façon *avant* le nôtre (sur `window`) et ne peut pas être arrêté depuis ce dernier.

## Risks / Trade-offs

- [Collision de couleur entre deux participants qui se connectent au même instant] → Acceptable pour la taille d'atelier visée (quelques participants) ; mitigation partielle par re-vérification côté client après connexion. Documenté comme limitation connue plutôt que résolu strictement.
- **BREAKING** [Retrait complet du panneau de style] → Plus aucun réglage de taille/trait/remplissage/tête de flèche n'est ajustable manuellement, y compris pour les outils natifs tldraw (flèches, frames). Assumé sur demande explicite de l'utilisateur ; l'apparence des post-its reste entièrement pilotée par leur type, ce qui est l'objectif recherché.
- [Fixer la police à `sans` peut décevoir un participant habitué au rendu manuscrit par défaut de tldraw] → Assumé comme un choix délibéré de professionnalisme demandé par l'utilisateur ; réversible facilement (une seule constante) si retour négatif.
- [`navigator.clipboard.writeText` nécessite un contexte sécurisé (HTTPS ou `localhost`)] → Sans impact en développement (`localhost`) ni en production si servi en HTTPS ; prévoir un repli (sélection manuelle du texte) si l'atelier est un jour exposé en HTTP simple.
- [Raccourcis clavier sans modificateur pour les post-its peuvent se déclencher par erreur si le focus n'est ni dans un champ de saisie ni en édition de forme, mais que l'utilisateur pensait taper ailleurs] → Mitigé par la vérification stricte (`isContentEditable`, `<input>`/`<textarea>`, `editor.getEditingShapeId()`) avant d'agir ; validé par le test e2e qui tape un texte contenant plusieurs des lettres-raccourcis (`Commande créée` contient `m`, `c`) pendant l'édition d'un libellé sans déclenchement intempestif.
- [Passage de l'outil `note` à l'outil `geo` pour les post-its change le comportement interne de création (`GeoShapeTool` ne bascule pas nativement en édition après un clic)] → Compensé par un gestionnaire `registerAfterCreateHandler` dédié (décision 4bis) ; couvert par le test e2e de collaboration qui crée puis type un libellé juste après le clic.
- [Le style de remplissage `solid` (pastel) n'est pas un vrai alpha à 30% — il ne s'assombrit pas au-dessus d'un fond non blanc ni ne se mélange avec des formes superposées] → Assumé comme approximation native suffisante ; à revisiter avec un shape custom si l'écart visuel pose problème en usage réel.
- [Le remplacement de `GeoShapeUtil`/`ArrowShapeUtil` par des sous-classes (décisions 9, 10) suit le mécanisme `mergeArraysAndReplaceDefaults("type", ...)` de tldraw, non documenté publiquement comme API stable de personnalisation] → Vérifié directement dans le code source de `tldraw` 5.2.2 et confirmé par test e2e manuel (absence de poignées de redimensionnement, absence d'édition de libellé sur une flèche) ; à revalider à chaque montée de version majeure de `tldraw`.
- [Les exports `TldrawUiMenuGroup`/`TldrawUiMenuSubmenu` nécessitent un re-typage local pour rester utilisables comme JSX avec les types React 18 du projet (décision 7)] → Contournement ponctuel documenté dans le code ; à retirer si une future version de `tldraw` corrige son `.d.ts`, ou si le projet migre vers React 19.
- **BREAKING** [Taille de post-it strictement fixe (décision 9) : un libellé trop long pour tenir dans 200×200 déborde visuellement au lieu d'agrandir le post-it] → Assumé sur demande explicite de l'utilisateur (homogénéité visuelle prioritaire sur l'adaptation au contenu) ; à revisiter si le débordement gêne réellement la lisibilité en usage réel (ex: limiter la longueur du libellé, ou réduire automatiquement la taille de police).
- [Le repositionnement de `WorkshopHeader` (décision 6bis) dépend de la hauteur actuelle de la barre d'outils native de tldraw, non garantie stable d'une version à l'autre] → Valeur (`top:56`) choisie empiriquement et validée par le test e2e de collaboration (renommage réussi avec deux participants connectés, donc le bouton natif d'avatars visible) ; à réajuster si une montée de version de `tldraw` change la hauteur de sa barre d'outils.
- [La pile de polices système explicite (décision 12) reste une approximation : le rendu exact dépend des polices réellement installées sur la machine du participant] → Assumé comme suffisant pour l'objectif (cohérence visuelle entre panneaux flottants, pas une police de marque spécifique) ; sans impact fonctionnel si une police de la pile est absente (repli sur la suivante, puis sur `sans-serif`).
- **BREAKING** [Suppression d'un atelier (décision 13) est irréversible et supprime tout son contenu, y compris pour des participants encore connectés au moment de la suppression] → Mitigé par la confirmation bloquante avant toute suppression effective ; les participants connectés sont explicitement déconnectés (`TLSocketRoom.close()`) plutôt que laissés dans un état incohérent silencieux.
- [Le diagramme Mermaid (décision 14) est un instantané au moment de la copie, non synchronisé avec les évolutions ultérieures du canvas] → Comportement attendu d'un export ponctuel dans le presse-papier, cohérent avec l'export PNG existant (décision 6) qui a la même limitation.
- [La renumérotation des raccourcis (décision 15) modifie le comportement de touches déjà connues des participants habitués à tldraw (ex: `a` ne trace plus une flèche, `e` n'active plus la gomme)] → Assumé sur demande explicite de l'utilisateur ; les nouvelles lettres sont affichées dans la version dépliée de la toolbar (libellé + raccourci) pour faciliter le réapprentissage.
- [S'appuyer sur `overrides.tools`/`overrides.actions` pour modifier le `kbd` d'outils/actions natifs (décision 15) dépend d'une structure interne (`{ id, kbd, onSelect, ... }`) documentée comme API publique de personnalisation par tldraw, mais dont le détail exact des champs n'est garanti que par les types exportés] → Vérifié directement dans le code source de `tldraw` 5.2.2 (`useTools.js`, `actions.js`) et confirmé par test e2e manuel ; à revalider à chaque montée de version majeure de `tldraw`, comme pour le remplacement de shape utils (risque ci-dessus).

## Migration Plan

- Aucune migration de données existantes : les ateliers, positions et éléments déjà persistés restent valides (seul `name`/`updated_at` gagnent un chemin de mise à jour supplémentaire côté serveur).
- Déploiement en une fois (front + back) car le nouveau endpoint `PATCH` et le nouveau flux de nom sont additifs et n'invalident pas le comportement existant tant que le front n'appelle pas encore la route.
- Pas de flag de bascule : le changement d'UX est direct dès le déploiement du front.

## Open Questions

- Le nom du participant doit-il pouvoir être modifié après la première saisie (ex: lien "changer de nom") ? Non explicitement demandé, à trancher lors de l'implémentation si le besoin apparaît trivialement.
