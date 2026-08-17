## Why

Les experts métier animent des ateliers d'event storming mais n'ont aujourd'hui aucun outil dédié pour les mener en ligne à plusieurs : ils dépendent de post-its physiques ou d'outils génériques non adaptés, ce qui limite fortement la collaboration à distance. Un outil web graphique dédié permettrait de concevoir l'event storming directement en ligne, à plusieurs, sans compétence technique.

## What Changes

- Ajout d'un canvas web graphique pour poser, typer (domain event, commande, acteur, agrégat, politique, point chaud, etc.) et organiser les éléments d'un event storming.
- Ajout d'une collaboration en temps réel : plusieurs experts métier travaillent simultanément sur le même atelier, sans mode lecture seule, avec présence et curseurs visibles.
- Aucune fonctionnalité existante n'est modifiée : ce projet est un nouveau produit (le dépôt est actuellement vide de toute spécification).

## Capabilities

### New Capabilities
- `eventstorming-canvas`: espace de travail graphique où l'expert métier crée, type, déplace et relie les éléments d'un event storming (stickies, swimlanes, timeline).
- `realtime-collaboration`: sessions d'atelier partagées où plusieurs utilisateurs voient et modifient le même canvas en temps réel (présence, curseurs, verrouillage léger des éléments en cours d'édition).

### Modified Capabilities
_Aucune — projet initial, pas de spécification existante à modifier._

## Impact

- Nouveau frontend web graphique (canvas interactif) et backend de collaboration temps réel (synchronisation d'état, gestion de sessions).
- Nouveau modèle de données pour les ateliers d'event storming.
- Aucun système existant impacté (dépôt neuf).

## Notes

La notion de dashboard de synthèse (vue agrégée exportable/partageable, éventuellement issue d'un ou plusieurs ateliers) a été écartée du périmètre pour le moment. Elle pourra faire l'objet d'un changement ultérieur une fois l'atelier collaboratif de base validé.
