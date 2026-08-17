## ADDED Requirements

### Requirement: Export de l'atelier en image PNG
Le système SHALL permettre d'exporter le contenu visuel du canvas d'un atelier sous forme d'un fichier image PNG téléchargeable.

#### Scenario: Export réussi
- **WHEN** un utilisateur déclenche l'export PNG depuis un atelier
- **THEN** le système génère un fichier PNG représentant l'état actuel du canvas et le propose au téléchargement

### Requirement: Export de l'atelier en diagramme Mermaid
Le système SHALL permettre de copier dans le presse-papier une représentation du contenu de l'atelier sous forme de code Mermaid (`flowchart`), avec un nœud par post-it, un regroupement (`subgraph`) par couloir de nage, et une arête par lien entre deux éléments.

#### Scenario: Copie réussie
- **WHEN** un utilisateur sélectionne "Copier le diagramme (Mermaid)" dans le menu principal d'un atelier
- **THEN** le système copie dans le presse-papier un code Mermaid représentant les post-its, couloirs de nage et liens actuellement présents sur le canvas

#### Scenario: Lien non relié ignoré
- **WHEN** un lien du canvas n'est relié à aucun élément à l'une de ses extrémités
- **THEN** ce lien n'apparaît pas comme une arête dans le diagramme Mermaid généré
