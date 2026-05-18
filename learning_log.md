# Journal d'Apprentissage EazyVTC_Mobile

Ce document est un journal des problèmes rencontrés lors du développement de l'application mobile EazyVTC, des solutions apportées et des leçons apprises. Il est destiné à aider les développeurs juniors à comprendre les défis courants et les meilleures pratiques dans un environnement React Native/Expo.

---

## 1. Intégration du hook `usePushNotifications` et gestion des appels API

### Problème Initial
Le hook `usePushNotifications` était conçu pour gérer l'enregistrement des tokens d'appareil pour les notifications push et utilisait un appel `fetch` direct vers le backend, contournant le service `notificationsApi`. De plus, l'API backend avait des routes redondantes pour la gestion des tokens.

### Cause Profonde
1.  **Incohérence des appels API** : L'utilisation d'un `fetch` direct au lieu d'un service API centralisé entraînait une duplication de logique et rendait la maintenance plus difficile.
2.  **Redondance des routes API** : Le backend avait plusieurs endpoints pour la même fonctionnalité, ce qui pouvait prêter à confusion et introduire des erreurs.
3.  **Placement du hook** : La question initiale portait sur l'emplacement optimal du hook dans l'application.

### Solution Apportée
1.  **Centralisation des appels API** : Création de méthodes `registerDeviceToken` et `removeDeviceToken` dans `notifications.api.ts`.
2.  **Utilisation du service API** : Mise à jour du hook `usePushNotifications.ts` pour utiliser ces nouvelles méthodes.
3.  **Nettoyage des routes API** : Suppression des routes dupliquées dans `EazyVTC_API/src/modules/notifications/notifications.routes.ts`.
4.  **Placement du hook** : Le hook `usePushNotifications` a été placé dans le composant racine `App.tsx`.

### Leçons Apprises
*   **Architecture des services API** : Il est crucial de centraliser toutes les interactions avec une API dans des services dédiés. Cela améliore la maintenabilité, la testabilité et la cohérence du code. Chaque service devrait être le seul point d'entrée pour un domaine spécifique de l'API.
*   **Gestion des hooks globaux** : Les hooks qui gèrent des fonctionnalités à l'échelle de l'application (comme les notifications push) doivent être appelés à un niveau élevé dans l'arborescence des composants (souvent `App.tsx`). Cela garantit qu'ils sont initialisés tôt et restent actifs pendant toute la durée de vie de l'application.
*   **Éviter la duplication** : La redondance, qu'elle soit dans le code client ou les routes API, est une source d'erreurs et de complexité. Un refactoring régulier est nécessaire pour maintenir un code propre.

---

## 2. Erreur de résolution du module `assert` (Node.js polyfill)

### Problème Initial
`Android Bundling failed ... Unable to resolve "./internal/assert/assertion_error" from "node_modules/assert/build/assert.js"`

### Cause Profonde
Une dépendance de votre projet (souvent transitive, c'est-à-dire une dépendance d'une dépendance) tentait d'utiliser le module `assert` de Node.js. Cependant, React Native s'exécute dans un environnement JavaScript qui n'est pas Node.js (similaire à un navigateur web), et les modules internes de Node.js ne sont pas disponibles par défaut. Le "bundler" (Metro) ne savait pas comment gérer cet import.

### Solution Apportée
Création ou mise à jour du fichier `metro.config.js` à la racine du projet pour "polyfiller" le module `assert`. Cela indique à Metro de substituer le module `assert` de Node.js par une version compatible avec l'environnement React Native.

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  assert: require.resolve('assert/'),
};

module.exports = config;
```

### Leçons Apprises
*   **Environnements JavaScript** : Comprendre la différence entre l'environnement Node.js (serveur) et l'environnement React Native/navigateur est crucial. Les modules natifs de Node.js ne fonctionnent pas côté client sans polyfills.
*   **Polyfills** : Un polyfill est un code qui implémente une fonctionnalité manquante dans un environnement donné. Pour React Native, `metro.config.js` est l'endroit où l'on configure ces polyfills pour le bundler Metro.
*   **Dépendances Transitives** : Les problèmes peuvent souvent venir de dépendances indirectes. Il est important de savoir comment les outils de build (comme Metro) résolvent les modules.
*   **Vider le cache de Metro** : Après toute modification de `metro.config.js` ou des dépendances, il est **impératif** de redémarrer le serveur Expo avec `npx expo start --clear` pour que les changements soient pris en compte.

---

## 3. Message `Access token is null, skipping push notification registration.`

### Problème Initial
Un message `LOG Access token is null, skipping push notification registration.` apparaissait dans la console.

### Cause Profonde
Ce n'est pas une erreur, mais un comportement attendu. Le hook `usePushNotifications` vérifie si un `accessToken` est disponible (c'est-à-dire si l'utilisateur est connecté) avant de tenter d'enregistrer le token de notification push. Si l'utilisateur n'est pas encore authentifié au moment où le hook s'exécute, l'enregistrement est logiquement ignoré.

### Solution Apportée
Aucune modification de code n'est nécessaire. C'est un message informatif qui indique que la logique conditionnelle du hook fonctionne comme prévu.

### Leçons Apprises
*   **Distinction Erreur/Log** : Il est important de faire la différence entre un message d'erreur qui bloque l'application et un message de log qui décrit un comportement normal ou une condition non critique.
*   **Flux d'authentification** : Les fonctionnalités dépendantes de l'authentification doivent être conçues pour gérer l'état non authentifié de manière gracieuse.

---

## 4. Avertissement `getExpoPushTokenAsync without specifying a projectId is deprecated`

### Problème Initial
Un avertissement `WARN Calling getExpoPushTokenAsync without specifying a projectId is deprecated and will no longer be supported in SDK 49+` était affiché.

### Cause Profonde
Le `projectId` dans `app.config.js` était commenté ou manquant. Expo utilise ce `projectId` pour identifier votre projet auprès de ses services, y compris pour les notifications push via Firebase Cloud Messaging (FCM). Sans ce `projectId`, `expo-notifications` ne peut pas fonctionner correctement dans les versions récentes du SDK Expo.

### Solution Apportée
Décommenter et s'assurer que le `projectId` est correctement configuré dans `app.config.js`.

```diff