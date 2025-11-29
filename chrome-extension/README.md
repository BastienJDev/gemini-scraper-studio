# ScrapAI Auto-Login - Extension Chrome

## Installation

1. Ouvre Chrome et va à `chrome://extensions/`
2. Active le **Mode développeur** (en haut à droite)
3. Clique sur **Charger l'extension non empaquetée**
4. Sélectionne ce dossier `chrome-extension`

## Utilisation

### Sauvegarder un site
1. Clique sur l'icône de l'extension
2. Remplis l'URL de connexion, email et mot de passe
3. (Optionnel) Configure les sélecteurs CSS si les champs ne sont pas détectés automatiquement
4. Clique sur "Sauvegarder ce site"

### Se connecter
- **Méthode 1** : Clique sur "Se connecter maintenant" après avoir rempli les champs
- **Méthode 2** : Clique sur "Connecter" à côté d'un site sauvegardé
- **Méthode 3** : Visite simplement la page de login - l'extension remplira automatiquement les champs

## Trouver les sélecteurs CSS

Si l'auto-login ne fonctionne pas :
1. Ouvre la page de login
2. Fais clic droit sur le champ email → Inspecter
3. Copie l'attribut `name` ou `id` (ex: `input[name="email"]` ou `#email`)
4. Répète pour le champ mot de passe et le bouton submit

## Sécurité

⚠️ Les identifiants sont stockés localement dans Chrome (chrome.storage.local).
Ils ne sont jamais envoyés à un serveur externe.
