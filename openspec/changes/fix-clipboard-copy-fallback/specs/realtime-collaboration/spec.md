## MODIFIED Requirements

### Requirement: Copie du lien d'invitation d'un atelier
Le système SHALL permettre de copier dans le presse-papier, depuis un atelier, le lien permettant à une autre personne de le rejoindre, y compris lorsque l'API `navigator.clipboard` est indisponible (contexte non sécurisé, ex. déploiement en HTTP simple).

#### Scenario: Copie réussie du lien depuis le menu principal
- **WHEN** un utilisateur sélectionne l'option de copie du lien dans le menu principal de l'atelier
- **THEN** le système copie le lien de l'atelier dans le presse-papier

#### Scenario: Utilisation du lien copié par un nouveau participant
- **WHEN** une personne ouvre le lien copié
- **THEN** elle rejoint le même atelier que celui depuis lequel le lien a été copié

#### Scenario: Copie réussie en contexte non sécurisé
- **WHEN** un utilisateur sélectionne l'option de copie du lien alors que l'API `navigator.clipboard` n'est pas disponible dans son navigateur (ex. atelier servi en HTTP simple, sans HTTPS)
- **THEN** le système copie tout de même le lien de l'atelier dans le presse-papier via un mécanisme de repli, sans lever d'erreur visible pour l'utilisateur
