# azure-devops-deployment Specification

## Purpose
TBD - créé automatiquement par `openspec sync-specs` à partir du changement `add-azure-devops-pipeline`. Décrit le comportement du pipeline Azure DevOps qui construit, déploie et vérifie l'application (server + web) via Docker Compose sur un agent auto-hébergé dédié.

## Requirements

### Requirement: Déclenchement automatique du pipeline
Le pipeline Azure DevOps SHALL se déclencher automatiquement sur tout push vers les branches `main` ou `develop`, à l'exception des modifications portant uniquement sur `README.md` ou les fichiers sous `docs/`.

#### Scenario: Push sur develop avec changement de code
- **WHEN** un commit modifiant `apps/server` ou `apps/web` est poussé sur `develop`
- **THEN** le pipeline se déclenche automatiquement et exécute le stage Build

#### Scenario: Push ne modifiant que la documentation
- **WHEN** un commit modifiant uniquement `README.md` est poussé sur `main`
- **THEN** le pipeline ne se déclenche pas

### Requirement: Construction des images Docker
Le pipeline SHALL construire une image Docker pour `apps/server` et une image Docker pour `apps/web` lors du stage Build, chacune taguée avec le `Build.BuildId` et `latest`.

#### Scenario: Build réussi des deux images
- **WHEN** le stage Build s'exécute sur un commit valide
- **THEN** les deux images Docker (server et web) sont construites et taguées avec le `Build.BuildId` et `latest`

#### Scenario: Échec de build d'une image
- **WHEN** la construction de l'image `server` ou `web` échoue (ex: erreur TypeScript ou dépendance manquante)
- **THEN** le stage Build échoue et le stage Deploy ne s'exécute pas

### Requirement: Déploiement via Docker Compose
Le pipeline SHALL déployer les services `server` et `web` sur l'agent via `docker compose up -d --build --force-recreate`, après avoir arrêté les conteneurs existants et nettoyé les anciennes images, uniquement si le stage Build a réussi.

#### Scenario: Déploiement après build réussi
- **WHEN** le stage Build se termine avec succès
- **THEN** le stage Deploy arrête les conteneurs existants, nettoie les anciennes images du projet, puis relance `docker compose up -d --build --force-recreate`

#### Scenario: Persistance de la base de données entre deux déploiements
- **WHEN** un nouveau déploiement remplace les conteneurs existants
- **THEN** les données SQLite du service `server` (volume `server-data`) sont conservées et accessibles au nouveau conteneur

### Requirement: Vérification post-déploiement
Le pipeline SHALL exécuter des health checks HTTP sur le service `server` (port hôte 4000) et le service `web` (port hôte 4173) après le déploiement, et faire échouer le stage Deploy si l'un des deux ne répond pas.

#### Scenario: Services sains après déploiement
- **WHEN** les conteneurs `server` et `web` sont démarrés et répondent sur leurs ports respectifs
- **THEN** le stage Deploy se termine avec succès et affiche le statut des conteneurs ainsi que leurs logs

#### Scenario: Service server ne répond pas
- **WHEN** le health check HTTP sur le port 4000 échoue après le déploiement
- **THEN** le stage Deploy échoue

### Requirement: Nettoyage automatique en cas d'échec
Le pipeline SHALL exécuter un stage Cleanup qui arrête les conteneurs et nettoie les ressources Docker inutilisées lorsque le stage Deploy échoue.

#### Scenario: Rollback après échec de déploiement
- **WHEN** le stage Deploy échoue (health check ou erreur de démarrage)
- **THEN** le stage Cleanup s'exécute automatiquement, arrête les conteneurs `event-storming-*` et nettoie les ressources Docker orphelines

#### Scenario: Pas de nettoyage si le déploiement réussit
- **WHEN** le stage Deploy se termine avec succès
- **THEN** le stage Cleanup ne s'exécute pas

### Requirement: Exécution sur agent auto-hébergé dédié
Le pipeline SHALL s'exécuter sur le pool d'agents `ArchitectureC4` et déployer vers un environment Azure DevOps nommé `Production`.

#### Scenario: Exécution sur le pool configuré
- **WHEN** le pipeline est déclenché
- **THEN** les jobs Build et Deploy s'exécutent sur un agent du pool `ArchitectureC4`, et le déploiement cible l'environment `Production`
