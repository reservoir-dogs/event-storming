## Why

En production, l'atelier est servi en HTTP simple (pas de TLS devant le service `web`, cf. `docker-compose.yml`). Les navigateurs n'exposent `navigator.clipboard` que dans un contexte sécurisé (HTTPS ou `localhost`) ; en HTTP simple sur un nom d'hôte non local, `navigator.clipboard` est `undefined`. Les deux actions de copie du menu principal (`EventStormingMainMenu.tsx`) appellent directement `navigator.clipboard.writeText(...)` sans vérification, ce qui provoque un `TypeError: Cannot read properties of undefined (reading 'writeText')` non catché dès qu'un utilisateur clique sur "Copier le lien de l'atelier" ou "Copier le diagramme (Mermaid)" en production — alors qu'aucune erreur n'apparaît en développement (`http://localhost`, traité comme sécurisé par les navigateurs). Ce risque était déjà anticipé dans un design doc précédent ("prévoir un repli si l'atelier est un jour exposé en HTTP simple"), qui se matérialise maintenant que l'atelier est réellement exposé ainsi.

## What Changes

- Ajout d'un repli de copie utilisable en contexte non sécurisé : quand `navigator.clipboard` est indisponible, le système copie le texte via un mécanisme alternatif (sélection de texte + `document.execCommand('copy')`) plutôt que de laisser l'action échouer silencieusement avec une erreur JavaScript non catchée.
- Ce repli s'applique aux deux actions de copie existantes du menu principal : la copie du lien d'invitation de l'atelier et la copie du diagramme Mermaid.
- Pas de changement d'infrastructure (pas de passage en HTTPS) dans ce change — uniquement un repli côté client.

## Capabilities

### New Capabilities

(aucune)

### Modified Capabilities

- `realtime-collaboration`: la copie du lien d'invitation doit réussir même quand `navigator.clipboard` est indisponible (contexte non sécurisé), via un mécanisme de repli.
- `workshop-export`: la copie du diagramme Mermaid doit réussir même quand `navigator.clipboard` est indisponible (contexte non sécurisé), via le même mécanisme de repli.

## Impact

- Code affecté : `apps/web/src/components/EventStormingMainMenu.tsx` (les deux gestionnaires `handleCopyLink` et `handleCopyMermaid`).
- Aucun impact serveur, API ou base de données.
- Aucun changement d'infrastructure/déploiement (le passage en HTTPS reste une amélioration séparée, non traitée ici).
