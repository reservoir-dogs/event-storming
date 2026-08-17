# workshop-export

## Purpose

TBD

## Requirements

### Requirement: Export de l'atelier en image PNG
Le système SHALL permettre d'exporter le contenu visuel du canvas d'un atelier sous forme d'un fichier image PNG téléchargeable.

#### Scenario: Export réussi
- **WHEN** un utilisateur déclenche l'export PNG depuis un atelier
- **THEN** le système génère un fichier PNG représentant l'état actuel du canvas et le propose au téléchargement

### Requirement: Export de l'atelier en diagramme Mermaid
Le système SHALL permettre de copier dans le presse-papier une représentation du contenu de l'atelier sous forme de code Mermaid (`flowchart`), avec un nœud par post-it, un regroupement (`subgraph`) par couloir de nage, et une arête par lien entre deux éléments, y compris lorsque l'API `navigator.clipboard` est indisponible (contexte non sécurisé, ex. déploiement en HTTP simple). Les post-its de type "point chaud" et "question" SHALL être exclus du diagramme, ainsi que tout lien dont l'une des extrémités est un post-it exclu.

#### Scenario: Copie réussie
- **WHEN** un utilisateur sélectionne "Copier le diagramme (Mermaid)" dans le menu principal d'un atelier
- **THEN** le système copie dans le presse-papier un code Mermaid représentant les post-its, couloirs de nage et liens actuellement présents sur le canvas

#### Scenario: Lien non relié ignoré
- **WHEN** un lien du canvas n'est relié à aucun élément à l'une de ses extrémités
- **THEN** ce lien n'apparaît pas comme une arête dans le diagramme Mermaid généré

#### Scenario: Copie réussie en contexte non sécurisé
- **WHEN** un utilisateur sélectionne "Copier le diagramme (Mermaid)" alors que l'API `navigator.clipboard` n'est pas disponible dans son navigateur (ex. atelier servi en HTTP simple, sans HTTPS)
- **THEN** le système copie tout de même le code Mermaid généré dans le presse-papier via un mécanisme de repli, sans lever d'erreur visible pour l'utilisateur

#### Scenario: Point chaud et question exclus du diagramme
- **WHEN** le canvas contient des post-its de type "point chaud" et "question"
- **THEN** aucun nœud correspondant à ces post-its n'apparaît dans le diagramme Mermaid généré, y compris à l'intérieur des `subgraph` de couloirs de nage

#### Scenario: Lien vers un point chaud ou une question exclu
- **WHEN** un lien du canvas relie un post-it exporté à un post-it de type "point chaud" ou "question"
- **THEN** ce lien n'apparaît pas comme une arête dans le diagramme Mermaid généré, et le diagramme ne référence aucun nœud absent

#### Scenario: Couloir de nage ne contenant que des éléments exclus
- **WHEN** un couloir de nage ne contient que des post-its de type "point chaud" ou "question"
- **THEN** le diagramme généré reste un diagramme Mermaid valide, sans nœud issu de ces post-its
