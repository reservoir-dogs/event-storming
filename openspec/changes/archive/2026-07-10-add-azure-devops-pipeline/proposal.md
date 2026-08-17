## Why

Le projet event-storming n'a aujourd'hui aucune automatisation de build, de test ni de déploiement : chaque mise à jour doit être faite manuellement sur la machine cible. Le projet frère `poker-planning` dispose déjà d'un pipeline Azure DevOps (build des images Docker, déploiement via `docker compose` sur un agent auto-hébergé, health checks, rollback automatique) qui a fait ses preuves. Reproduire ce même pattern pour event-storming permet un déploiement fiable et reproductible dès qu'un commit atteint `main` ou `develop`.

## What Changes

- Ajout d'un `Dockerfile` pour `apps/server` (build TypeScript + exécution Node, avec volume persistant pour la base SQLite).
- Ajout d'un `Dockerfile` pour `apps/web` (build Vite en mode dev, aligné sur le pattern actuel du frontend poker-planning).
- Ajout d'un `docker-compose.yml` à la racine du repo définissant les services `server` et `web`, leur réseau, leurs health checks et le volume de données SQLite.
- Ajout du pipeline `pipelines/azure-pipeline.yaml` avec les stages **Build** (images Docker `server`/`web`), **Deploy** (déploiement `docker compose up -d --build`, vérifications post-déploiement) et **Cleanup** (rollback automatique en cas d'échec), sur le pool d'agents `ArchitectureC4`.
- Ajout d'une documentation `DEPLOYMENT.md` décrivant prérequis, configuration et dépannage du pipeline, sur le modèle de celle de poker-planning.
- Déclenchement automatique sur push vers `main` et `develop` (hors modifications de `README.md`/`docs/*`).

## Capabilities

### New Capabilities
- `azure-devops-deployment`: pipeline CI/CD Azure DevOps buildant les images Docker de `apps/server` et `apps/web`, les déployant via `docker compose` sur un agent auto-hébergé, avec vérifications de santé post-déploiement et nettoyage automatique en cas d'échec.

### Modified Capabilities
_Aucune capability existante n'est modifiée._

## Impact

- **Nouveaux fichiers**: `pipelines/azure-pipeline.yaml`, `docker-compose.yml`, `apps/server/Dockerfile`, `apps/web/Dockerfile`, `DEPLOYMENT.md`.
- **Infrastructure**: nécessite un environment Azure DevOps `Production` et un agent du pool `ArchitectureC4` avec Docker installé, ports `4000` (server) et `4173` (web, mappé vers le port interne `5173`) disponibles — distincts des ports `3000`/`3001` utilisés par poker-planning sur le même agent.
- **Données**: le volume Docker du service `server` doit persister `apps/server/data/` (base SQLite `better-sqlite3`) entre les redéploiements.
- **Aucun changement** de code applicatif dans `apps/server/src` ou `apps/web/src`.
