## Context

Le dépôt est actuellement vide de toute implémentation : ce changement pose les fondations techniques d'un nouveau produit web permettant à des experts métier (non techniques) de mener des ateliers d'event storming collaboratifs. Les contraintes principales sont : accessibilité par simple lien (pas de friction d'installation), édition graphique fluide type "tableau blanc", et synchronisation temps réel fiable entre plusieurs participants.

## Goals / Non-Goals

**Goals:**
- Offrir un canvas graphique performant et intuitif pour poser des éléments typés d'event storming.
- Garantir une collaboration temps réel fiable (présence, curseurs, propagation des modifications, gestion des éditions concurrentes).
- Rester accessible à un public non technique : pas de configuration, connexion par lien.

**Non-Goals:**
- Dashboard de synthèse (vue agrégée, export, partage dédié) — écarté du périmètre pour le moment.
- Authentification avancée, gestion d'organisations/rôles ou SSO (V1 utilise des liens partageables).
- Analyse automatique/IA du contenu de l'event storming (suggestions, détection de patterns).
- Applications natives mobiles ou mode hors-ligne.
- Export multi-format avancé (PDF, image haute résolution).
- Mode de consultation en lecture seule (à réévaluer pour une V2).

## Decisions

- **Canvas graphique : bibliothèque de tableau blanc dédiée (type tldraw) plutôt qu'un framework de diagramme générique (type React Flow).**
  Alternative considérée : construire le rendu du canvas à la main sur `<canvas>`/SVG. Rejeté car trop coûteux pour un MVP (gestion du zoom, du drag, de la sélection multiple, etc. déjà résolue par les bibliothèques de whiteboard existantes). Une bibliothèque de whiteboard offre nativement le zoom/pan infini, la sélection multiple et un système de formes personnalisables adapté aux swimlanes et post-its typés.

- **Synchronisation temps réel : moteur de synchronisation officiel de tldraw (`@tldraw/sync`) plutôt qu'un CRDT générique (type Yjs) relié manuellement au canvas.**
  Alternative considérée initialement : Yjs + serveur de collaboration générique (type Hocuspocus), avec un binding maison entre le store tldraw et un document Yjs. Rejeté après évaluation technique : `@tldraw/sync` est conçu spécifiquement pour synchroniser un canvas tldraw et fournit nativement la présence, les curseurs et la mise en évidence des éléments en cours d'édition par d'autres participants, sans risque d'un binding personnalisé fragile entre deux modèles de données distincts.

- **Serveur de collaboration : serveur WebSocket applicatif dédié, hébergeant une `TLSocketRoom` (`@tldraw/sync-core`) par atelier, plutôt qu'un serveur de collaboration générique.**
  Le serveur gère une room par atelier (le nom de la room correspond à l'identifiant de l'atelier) et persiste un snapshot du document à chaque changement significatif.

- **Persistance : un snapshot de document tldraw par atelier, sauvegardé côté serveur (base SQLite embarquée pour les snapshots et les métadonnées d'atelier, sans dépendance à un service externe).**

- **Partage par lien d'édition collaboratif par atelier (pas de lien en lecture seule pour le moment).**
  Alternative considérée : un compte utilisateur avec droits par atelier. Rejeté pour le MVP afin de ne pas introduire de friction d'inscription pour des experts métier occasionnels ; le lien utilise un identifiant long et non devinable en attendant un éventuel modèle d'authentification plus fin.

## Risks / Trade-offs

- [Absence d'authentification et de lecture seule] → toute personne disposant du lien d'un atelier peut le modifier. Mitigation : identifiant non devinable (haute entropie) pour chaque lien ; une lecture seule ou une gestion de droits pourra être introduite en V2 si le besoin se confirme.
- [Courbe d'apprentissage du moteur de synchronisation] → risque de retard sur le MVP. Mitigation : s'appuyer sur `@tldraw/sync`/`@tldraw/sync-core`, briques officielles maintenues par l'éditeur de tldraw, plutôt que développer la synchronisation en interne.
- [Performance du canvas avec un grand nombre d'éléments] → un atelier très riche peut ralentir le rendu. Mitigation : virtualisation/culling des éléments hors du viewport, à valider par des tests de charge avant généralisation.

## Migration Plan

Projet neuf : aucune migration de données existantes. Déploiement incrémental proposé :
1. Canvas d'event storming mono-utilisateur persistant.
2. Ajout de la collaboration temps réel (présence, synchronisation, édition concurrente).
Chaque étape est livrable et utilisable indépendamment ; en cas de problème sur une étape, revenir à la version précédente ne nécessite pas de rollback de données (pas de migration destructive entre étapes).

## Open Questions

- Faut-il une limite au nombre de participants simultanés par atelier pour la V1 ?
- Quelle politique de rétention/suppression des ateliers inactifs ?
- Quel sera le modèle d'authentification pour une V2 (comptes, organisations, droits fins) ?
- Le dashboard de synthèse (écarté ici) fera-t-il l'objet d'un changement ultérieur, et selon quel modèle (canvas indépendant, ou lié à un atelier) ?
