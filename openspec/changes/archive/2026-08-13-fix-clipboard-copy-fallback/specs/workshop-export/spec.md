## MODIFIED Requirements

### Requirement: Export de l'atelier en diagramme Mermaid
Le système SHALL permettre de copier dans le presse-papier une représentation du contenu de l'atelier sous forme de code Mermaid (`flowchart`), avec un nœud par post-it, un regroupement (`subgraph`) par couloir de nage, et une arête par lien entre deux éléments, y compris lorsque l'API `navigator.clipboard` est indisponible (contexte non sécurisé, ex. déploiement en HTTP simple).

#### Scenario: Copie réussie
- **WHEN** un utilisateur sélectionne "Copier le diagramme (Mermaid)" dans le menu principal d'un atelier
- **THEN** le système copie dans le presse-papier un code Mermaid représentant les post-its, couloirs de nage et liens actuellement présents sur le canvas

#### Scenario: Lien non relié ignoré
- **WHEN** un lien du canvas n'est relié à aucun élément à l'une de ses extrémités
- **THEN** ce lien n'apparaît pas comme une arête dans le diagramme Mermaid généré

#### Scenario: Copie réussie en contexte non sécurisé
- **WHEN** un utilisateur sélectionne "Copier le diagramme (Mermaid)" alors que l'API `navigator.clipboard` n'est pas disponible dans son navigateur (ex. atelier servi en HTTP simple, sans HTTPS)
- **THEN** le système copie tout de même le code Mermaid généré dans le presse-papier via un mécanisme de repli, sans lever d'erreur visible pour l'utilisateur
