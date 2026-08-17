## 1. Conteneurisation de apps/server

- [x] 1.1 Créer `apps/server/Dockerfile` (build multi-stage : `npm ci` + `npm run build` depuis la racine du monorepo, puis image finale avec `node dist/index.js`)
- [x] 1.2 Déclarer `EXPOSE 4000` et un `HEALTHCHECK` ciblant `http://localhost:4000`
- [x] 1.3 Vérifier que le volume `apps/server/data` est bien accessible en écriture dans le conteneur (chemin `/app/apps/server/data`)

## 2. Conteneurisation de apps/web

- [x] 2.1 Créer `apps/web/Dockerfile` (build multi-stage : `npm ci` depuis la racine du monorepo, puis `npm run dev --workspace apps/web` en mode dev, sur le modèle du frontend poker-planning)
- [x] 2.2 Déclarer `EXPOSE 5173` (port interne du conteneur) et un `HEALTHCHECK` interne ciblant `http://localhost:5173`

## 3. Docker Compose

- [x] 3.1 Créer `.dockerignore` à la racine (exclure `node_modules`, `apps/*/data`, `apps/web/test-results`, `.git`)
- [x] 3.2 Créer `docker-compose.yml` à la racine avec les services `server` (port `4000:4000`, volume nommé `server-data` sur `apps/server/data`) et `web` (port `4173:5173` — port hôte dédié distinct du port Vite par défaut et des ports poker-planning)
- [x] 3.3 Ajouter un réseau dédié `event-storming-network` et nommer les conteneurs `event-storming-server` / `event-storming-web`
- [x] 3.4 Ajouter les health checks Docker Compose (mêmes endpoints que les Dockerfiles)
- [x] 3.5 Tester en local : `docker compose up -d --build` puis vérifier `docker compose ps`, les logs et l'accès aux deux services — validé : `event-storming-server` et `event-storming-web` démarrent `healthy`, `GET /health` répond `{"status":"ok"}` (port 4000), `GET /` répond 200 (port 4173)

## 4. Pipeline Azure DevOps

- [x] 4.1 Créer `pipelines/azure-pipeline.yaml` avec le trigger sur `main`/`develop` (exclusion `README.md`, `docs/*`) et le pool `ArchitectureC4`
- [x] 4.2 Stage `Build` : construire les images Docker `server` et `web` (tags `$(Build.BuildId)` et `latest`)
- [x] 4.3 Stage `Deploy` (environment `Production`, `dependsOn: Build`, `condition: succeeded()`) : arrêt des conteneurs existants, nettoyage des anciennes images, `docker compose up -d --build --force-recreate`, affichage du statut et des logs
- [x] 4.4 Ajouter les health checks HTTP post-déploiement dans le stage `Deploy` (port hôte 4000 pour server, port hôte 4173 pour web)
- [x] 4.5 Stage `Cleanup` (`dependsOn: Deploy`, `condition: failed()`) : arrêt des conteneurs et nettoyage des ressources Docker orphelines

## 5. Documentation

- [x] 5.1 Créer `DEPLOYMENT.md` décrivant prérequis (agent `ArchitectureC4`, Docker, ports 4000/4173), architecture du pipeline, configuration de l'environment `Production`, dépannage et rollback
- [x] 5.2 Corriger `apps/web/src/config.ts` pour que le front déduise dynamiquement l'hôte du server (`window.location.hostname`) au lieu de cibler `localhost` en dur, afin que le sync tldraw et les appels API fonctionnent depuis n'importe quel poste accédant à l'agent déployé (variables `VITE_API_URL`/`VITE_SYNC_URL` conservées comme overrides optionnels, vides par défaut dans `docker-compose.yml`)
- [x] 5.3 Ajouter `server.allowedHosts: ['eventstorming.d1.esme.infra', 'localhost']` dans `apps/web/vite.config.ts` pour autoriser l'accès au serveur de dev Vite via le nom de domaine de déploiement (sur le modèle de `poker.d1.esme.infra`), sans quoi Vite bloque la requête (`Blocked request. This host (...) is not allowed`)

## 6. Validation

- [ ] 6.1 Pousser sur `develop` et vérifier l'exécution complète du pipeline (Build → Deploy) sur l'agent _(nécessite un push réel et l'agent Azure DevOps `ArchitectureC4` — hors de portée en local)_
- [x] 6.2 Vérifier que les données SQLite persistent après un second déploiement (`docker compose up -d --build --force-recreate`) — validé en local : un workshop créé avant `--force-recreate` est toujours présent après
- [x] 6.3 Simuler un échec (ex: health check en erreur) pour valider le déclenchement du stage `Cleanup` — commandes `docker compose down` + `docker system prune -f` validées en local : arrêt propre des conteneurs, nettoyage du cache de build, volume `server-data` préservé
