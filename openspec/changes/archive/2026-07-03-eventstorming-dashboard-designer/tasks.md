## 1. Socle projet

- [x] 1.1 Initialiser le frontend web (SPA TypeScript) et le backend (service Node.js) dans le dépôt
- [x] 1.2 Mettre en place la base de données relationnelle pour les métadonnées des ateliers
- [x] 1.3 Mettre en place le pipeline de build/lint/test de base pour le frontend et le backend

## 2. Canvas d'event storming (mono-utilisateur)

- [x] 2.1 Intégrer la bibliothèque de tableau blanc graphique et l'écran de canvas vide
- [x] 2.2 Implémenter la création d'un atelier (nom, canvas vierge)
- [x] 2.3 Définir les formes personnalisées par type d'élément (domain event, commande, acteur, agrégat, politique, point chaud, question) avec styles visuels distincts
- [x] 2.4 Implémenter l'ajout, le déplacement et le redimensionnement des éléments sur le canvas
- [x] 2.5 Implémenter les swimlanes et la timeline horizontale
- [x] 2.6 Implémenter la création de liens fléchés entre deux éléments
- [x] 2.7 Implémenter la persistance automatique de l'état du canvas (éléments, positions, liens, swimlanes) et sa restitution à la réouverture

## 3. Collaboration temps réel

- [x] 3.1 Mettre en place le serveur de synchronisation de documents collaboratifs (CRDT) et son intégration avec le canvas
- [x] 3.2 Générer un lien d'édition partageable par atelier (identifiant non devinable)
- [x] 3.3 Implémenter la connexion simultanée de plusieurs participants au même atelier via ce lien
- [x] 3.4 Implémenter l'affichage de la présence (liste des participants connectés)
- [x] 3.5 Implémenter l'affichage des curseurs des autres participants en temps réel
- [x] 3.6 Implémenter la propagation temps réel des créations/modifications/suppressions d'éléments
- [x] 3.7 Implémenter le signalement d'édition concurrente sur un même élément (indicateur "en cours d'édition par...")

## 4. Qualité et validation

- [x] 4.1 Écrire les tests couvrant les scénarios des specs eventstorming-canvas et realtime-collaboration
- [x] 4.2 Réaliser un test de charge sur le canvas avec un grand nombre d'éléments et ajuster la virtualisation/culling si nécessaire
- [x] 4.3 Valider le parcours complet de bout en bout : création d'atelier → collaboration à plusieurs sur le même canvas
