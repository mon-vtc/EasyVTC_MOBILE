const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Metro-specific options can be added here.
});

// Polyfill pour le module 'assert' de Node.js.
// Ceci est nécessaire car une dépendance de votre projet l'utilise,
// mais il n'est pas disponible dans l'environnement React Native.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  assert: require.resolve('assert/'),
};

module.exports = config;
// On force l'utilisation de la version compatible navigateur.
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    assert: require.resolve('assert/'),
  },
};

module.exports = config;