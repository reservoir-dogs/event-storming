# Event Storming

Outil web graphique et collaboratif permettant à des experts métier de mener des ateliers
d'event storming en ligne, à plusieurs et en temps réel : canvas de post-its typés
(domain event, commande, acteur, agrégat, politique, point chaud, question), swimlanes,
timeline horizontale et liens entre éléments.

Voir `openspec/changes/eventstorming-dashboard-designer/` pour la proposition, les
spécifications et le design ayant guidé cette implémentation.

# Getting Started

Prérequis : Node.js 20+ et npm.

```bash
npm install
npm run dev:server   # démarre l'API + le serveur de synchronisation temps réel sur :4000
npm run dev:web      # démarre le frontend sur :5173, dans un second terminal
```

Ouvrez http://localhost:5173, créez un atelier, puis partagez son URL (`/atelier/<id>`)
avec d'autres participants pour collaborer en temps réel sur le même canvas.

## Structure du dépôt

- `apps/web` — frontend React + tldraw (canvas, collaboration, présence)
- `apps/server` — API des ateliers (Express) + serveur de synchronisation temps réel
  (`@tldraw/sync-core`), avec persistance SQLite

# Build and Test

```bash
npm run build   # build de production des deux applications
npm run lint    # eslint sur les deux applications
npm run test    # tests unitaires (vitest) des deux applications
npm run e2e --workspace apps/web   # tests de bout en bout (Playwright)
```

# Contribute

Ce projet suit le workflow OpenSpec : les changements sont proposés, spécifiés puis
implémentés sous `openspec/changes/`. Voir `/opsx:propose` et `/opsx:apply`.
