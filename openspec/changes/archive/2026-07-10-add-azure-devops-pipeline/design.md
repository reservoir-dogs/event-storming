## Context

Event-storming est un monorepo npm workspaces avec deux applications :
- `apps/server` : Node.js/Express/WebSocket (sync tldraw), écoute sur `PORT` (défaut `4000`), persiste son état dans une base SQLite (`better-sqlite3`) sous `apps/server/data/`.
- `apps/web` : React/Vite, servi en mode dev sur le port interne `5173`, exposé côté hôte sur le port `4173` pour rester distinct de tout autre usage du port Vite par défaut sur l'agent partagé.

Aucun Dockerfile ni docker-compose n'existe actuellement. Le projet frère `poker-planning` (repos séparés `backend`/`frontend`, sans workspaces) dispose d'un pipeline Azure DevOps mature (`pipelines/azure-pipeline.yaml`) : stages Build → Deploy → Cleanup, déploiement `docker compose` sur un agent auto-hébergé du pool `ArchitectureC4`, health checks HTTP post-déploiement, rollback automatique en cas d'échec. L'objectif est de reproduire ce même pattern pour event-storming, en l'adaptant à la structure monorepo et à la persistance SQLite.

## Goals / Non-Goals

**Goals:**
- Reproduire la structure du pipeline poker-planning (3 stages, mêmes noms, mêmes déclencheurs, même pool `ArchitectureC4`, même environment `Production`).
- Fournir des `Dockerfile` pour `apps/server` et `apps/web` compatibles avec la structure npm workspaces (installation des dépendances depuis la racine du monorepo).
- Garantir la persistance de la base SQLite du serveur entre deux redéploiements via un volume Docker nommé.
- Documenter le pipeline dans `DEPLOYMENT.md` sur le même modèle que celui de poker-planning.

**Non-Goals:**
- Ne pas migrer `apps/web` vers un build de production optimisé (Nginx statique) : on reproduit le pattern actuel de poker-planning qui sert le frontend en mode `vite dev` même en "production", pour rester cohérent avec l'approche existante. Une migration vers un build statique pourra faire l'objet d'un changement ultérieur.
- Ne pas ajouter de tests automatisés au pipeline au-delà de ce qui existe déjà (`npm run lint`, `npm run test`) — pas de nouvelle suite de tests à écrire.
- Ne pas gérer plusieurs environnements (staging/prod) : un seul environment `Production`, comme poker-planning.

## Decisions

### 1. Contexte de build Docker = racine du monorepo
**Décision** : les `Dockerfile` de `apps/server` et `apps/web` utilisent la racine du repo comme `buildContext` (pas le sous-dossier de l'app), car npm workspaces nécessite le `package.json` racine, le `package-lock.json` racine et tous les workspaces pour que `npm ci` résolve correctement les dépendances partagées.
**Alternative rejetée** : builder chaque app dans son propre dossier comme poker-planning (repos non-workspaces) — impossible ici car `npm ci` échouerait sans le contexte racine des workspaces.

### 2. Volume nommé pour la base SQLite
**Décision** : le service `server` du `docker-compose.yml` monte un volume nommé (`server-data`) sur `/app/apps/server/data`, pour que la base `better-sqlite3` survive à un `docker compose up -d --build --force-recreate`.
**Alternative rejetée** : bind mount direct vers `./apps/server/data` — fonctionne mais moins portable entre agents ; on garde toutefois cette option ouverte si l'agent de déploiement l'exige (à ajuster en implémentation si besoin).

### 3. Même structure de pipeline que poker-planning
**Décision** : reprendre à l'identique la structure à 3 stages (Build/Deploy/Cleanup), les mêmes triggers (`main`, `develop`, exclusion `README.md`/`docs/*`), le même pool (`ArchitectureC4`) et le même environment (`Production`), pour minimiser la charge cognitive de maintenance entre les deux pipelines.
**Alternative rejetée** : introduire un stage `Test` distinct avant `Build` — non retenu pour rester fidèle au modèle poker-planning existant ; le lint/test pourra être ajouté dans une itération future si demandé.

### 4. Health checks adaptés aux endpoints event-storming
**Décision** : les health checks du pipeline (exécutés sur l'hôte) ciblent les ports exposés côté hôte : `http://localhost:4000` pour le server et `http://localhost:4173` pour le web, à la place des endpoints poker-planning (`/api/session/create`, port 3001/3000). Les `HEALTHCHECK` internes des Dockerfile ciblent en revanche le port interne du conteneur (`5173` pour le web), puisqu'ils s'exécutent à l'intérieur du conteneur.

### 5. Port hôte du service web distinct du port Vite par défaut
**Décision** : le service `web` du `docker-compose.yml` mappe le port hôte `4173` vers le port interne `5173` (`4173:5173`), plutôt que d'exposer `5173:5173` tel quel. Le port `5173` étant le port par défaut de Vite, il est susceptible d'être déjà utilisé par un autre processus ou une autre stack sur l'agent partagé `ArchitectureC4` ; exposer un port hôte dédié (`4173`, dans la même plage que le `4000` du server) élimine tout risque de collision, y compris avec poker-planning.
**Alternative rejetée** : garder `5173:5173` côté hôte — fonctionne tant qu'aucun autre service Vite n'est déployé sur le même agent, mais fragile à moyen terme.

### 6. Résolution dynamique de l'hôte du server côté front (au lieu d'une URL figée)
**Décision** : `apps/web/src/config.ts` déduit `API_URL`/`SYNC_URL` par défaut à partir de `window.location.hostname` (l'hôte utilisé par le navigateur pour charger la page), plutôt que de figer `http://localhost:4000`/`ws://localhost:4000`. Les variables d'environnement `VITE_API_URL`/`VITE_SYNC_URL` (vides par défaut dans `docker-compose.yml`) restent disponibles pour forcer une autre adresse si le server est un jour exposé sous un domaine différent de celui du front.
**Raison** : avec une valeur figée à `localhost`, un navigateur ouvrant l'application depuis une machine distincte de l'agent de déploiement tentait de joindre `server` sur sa propre machine (`localhost` désigne toujours le poste du client, jamais l'agent) au lieu de l'agent réel — le sync tldraw et les appels API échouaient silencieusement dès que l'accès n'était pas fait depuis l'agent lui-même. Poker-planning contourne ce problème en imposant une variable d'environnement par déploiement (`VITE_SOCKET_URL`) ; ici on préfère une résolution automatique qui fonctionne sans configuration supplémentaire quel que soit l'agent ou l'adresse IP utilisée.
**Alternative rejetée** : imposer `VITE_API_URL`/`VITE_SYNC_URL` explicitement par environnement (comme poker-planning) — fonctionne mais oblige à connaître et maintenir l'adresse de l'agent à chaque déploiement ; la résolution dynamique l'évite tout en gardant la surcharge possible si besoin.

### 7. Déclaration explicite des hôtes autorisés pour le serveur de dev Vite
**Décision** : `apps/web/vite.config.ts` déclare `server.allowedHosts: ['eventstorming.d1.esme.infra', 'localhost']`, sur le même modèle que `poker.d1.esme.infra` dans poker-planning.
**Raison** : Vite (depuis la CVE de rebinding DNS corrigée en v5.4/v6) rejette par défaut toute requête dont l'en-tête `Host` ne correspond pas à `localhost`/une IP locale/un hôte explicitement listé, avec l'erreur `Blocked request. This host (...) is not allowed`. Dès que l'application est accédée via un nom de domaine (ex: `eventstorming.d1.esme.infra`) plutôt que par IP ou `localhost`, le serveur de dev Vite bloque la requête tant que ce host n'est pas explicitement autorisé.
**Alternative rejetée** : désactiver la vérification (`allowedHosts: true`) — supprimerait une protection de sécurité légitime contre le DNS rebinding ; on préfère lister explicitement le seul domaine de déploiement connu.

## Risks / Trade-offs

- [Risque] Le frontend tourne en mode `vite dev` en "production", ce qui n'est pas optimisé pour la performance ni la sécurité → Mitigation : c'est le pattern déjà accepté pour poker-planning ; à réévaluer dans un futur changement si un build statique est souhaité.
- [Risque] Le build Docker depuis la racine du monorepo copie l'ensemble des workspaces dans l'image de chaque app (taille d'image plus grande) → Mitigation : utiliser un `.dockerignore` excluant `node_modules`, `apps/*/data`, `apps/web/test-results`, etc.
- [Risque] Un `docker compose down` suivi d'un `up --force-recreate` sans le bon volume pourrait faire perdre les données SQLite si le volume n'est pas correctement nommé/persisté → Mitigation : volume Docker nommé déclaré explicitement dans `docker-compose.yml`, jamais supprimé par les scripts de nettoyage du pipeline.
- [Risque] Le pool `ArchitectureC4` est partagé avec poker-planning ; deux déploiements simultanés sur le même agent pourraient entrer en conflit sur les ports si mal isolés → Mitigation : ports hôte dédiés (4000/4173) distincts de ceux de poker-planning (3001/3000) et du port Vite par défaut (5173), plus des noms de conteneurs/réseau préfixés `event-storming-*`.

## Migration Plan

1. Ajouter `.dockerignore` à la racine.
2. Ajouter `apps/server/Dockerfile` et `apps/web/Dockerfile`.
3. Ajouter `docker-compose.yml` à la racine avec les deux services, le réseau dédié et le volume nommé `server-data`.
4. Ajouter `pipelines/azure-pipeline.yaml`.
5. Ajouter `DEPLOYMENT.md`.
6. Créer manuellement (hors code, action Azure DevOps) l'environment `Production` et vérifier que l'agent du pool `ArchitectureC4` a Docker installé et les ports 4000/4173 libres.
7. Premier push sur `develop` pour valider le pipeline de bout en bout avant de l'activer sur `main`.

**Rollback** : le stage `Cleanup` existant (identique à poker-planning) arrête les conteneurs en cas d'échec ; un rollback manuel reste possible via `git checkout <commit-stable> && docker compose up -d --build`.

## Open Questions

- Faut-il, à terme, migrer `apps/web` vers un build de production statique servi par Nginx plutôt que `vite dev` ? (hors scope de ce changement, cf. Non-Goals)
- Faut-il un volume nommé ou un bind mount pour `apps/server/data` selon les contraintes de l'agent de déploiement réel ? (décision à confirmer en implémentation selon l'agent cible)
