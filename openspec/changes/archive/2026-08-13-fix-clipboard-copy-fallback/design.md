## Context

`EventStormingMainMenu.tsx` expose deux actions de copie dans le presse-papier :
- `handleCopyLink` (copie le lien de l'atelier, `globalThis.location.href`)
- `handleCopyMermaid` (copie le diagramme Mermaid généré par `buildMermaidFlowchart`)

Les deux appellent directement `navigator.clipboard.writeText(...)`. Cette API n'existe (`navigator.clipboard` n'est pas `undefined`) que dans un contexte sécurisé (HTTPS, ou `localhost` par exception). L'atelier est actuellement déployé en production sur `http://eventstorming.d1.esme.infra:4173`, en HTTP simple sans reverse proxy TLS (cf. `docker-compose.yml`) : `navigator.clipboard` y est donc `undefined`, et l'appel lève un `TypeError` non catché qui casse silencieusement l'action pour l'utilisateur.

## Goals / Non-Goals

**Goals:**
- Les deux actions de copie du menu principal fonctionnent aussi bien en contexte sécurisé (HTTPS/localhost) qu'en contexte non sécurisé (HTTP simple), sans lever d'erreur.
- Un seul mécanisme de repli, partagé par les deux actions, pour éviter la duplication.

**Non-Goals:**
- Ne traite pas la cause racine côté infrastructure (passage du déploiement de production en HTTPS). Reste une amélioration future indépendante.
- Pas d'ajout d'un système de notification/toast générique pour le projet ; le repli se limite à faire fonctionner la copie elle-même.

## Decisions

**Repli via `document.execCommand('copy')` sur un `<textarea>` hors écran.**
C'est le mécanisme de repli standard utilisé avant l'existence de la Clipboard API asynchrone : créer un `<textarea>` positionné hors du viewport, y injecter le texte, le sélectionner (`select()`), déclencher `document.execCommand('copy')`, puis retirer l'élément du DOM. Bien que `execCommand` soit dépréciée, elle reste supportée par tous les navigateurs ciblés et, contrairement à `navigator.clipboard`, elle ne nécessite pas de contexte sécurisé.
- **Alternative rejetée** : afficher une boîte de dialogue avec le texte pré-sélectionné pour une copie manuelle (Ctrl+C). Rejeté car plus intrusif pour l'utilisateur (une étape manuelle en plus) alors qu'un repli automatique via `execCommand` couvre le même besoin sans friction.
- **Alternative rejetée** : ne rien faire côté client et exiger le passage en HTTPS pour corriger le problème. Rejeté car cela laisse l'action cassée en production tant que le changement d'infrastructure n'est pas fait, sans garantie de délai.

**Fonction utilitaire locale, pas de nouveau module partagé.**
La logique de repli est ajoutée comme une fonction `copyToClipboard(text: string): Promise<void>` directement dans `EventStormingMainMenu.tsx`, réutilisée par les deux gestionnaires existants. Elle n'est utilisée que dans ce fichier ; créer un module séparé (`utils/clipboard.ts`) n'apporterait pas de valeur pour un seul point d'utilisation.

## Risks / Trade-offs

- [`document.execCommand('copy')` est une API dépréciée, potentiellement retirée un jour des navigateurs] → Mitigation : elle n'est utilisée qu'en repli, uniquement quand `navigator.clipboard` est indisponible ; si elle disparaît un jour, le comportement redevient équivalent à l'état actuel (pas de régression sur le chemin `navigator.clipboard`, qui reste prioritaire).
- [Le repli ne corrige pas la cause racine (absence de HTTPS en production)] → Documenté explicitement comme hors périmètre ; à traiter séparément côté infrastructure si souhaité.
- [`execCommand('copy')` peut échouer silencieusement dans certains navigateurs/contextes (ex. sans interaction utilisateur directe)] → Les deux actions restent déclenchées par un clic utilisateur direct sur un item de menu, ce qui satisfait la contrainte usuelle de "user gesture" exigée par les navigateurs pour ce genre d'action.
