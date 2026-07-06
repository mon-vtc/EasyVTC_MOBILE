/** @type {import('expo/config').ExpoConfig} */
export default {
  name: "EasyVTC_Mobile_App",
  slug: "easyvtc",
  owner: "easyvtc",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/logo.png",
    resizeMode: "native",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.EasyVTC",
    infoPlist: {
      NSCameraUsageDescription: "Pour photographier vos documents chauffeur et votre photo de profil.",
      NSPhotoLibraryUsageDescription: "Pour sélectionner votre photo de profil ou vos documents depuis la galerie.",
      NSLocationWhenInUseUsageDescription: "Pour indiquer votre position de prise en charge lors d'une réservation.",
      NSUserNotificationsUsageDescription: "Pour recevoir les notifications de course, rappels et alertes importantes.",
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: "com.EasyVTC",
    usesCleartextTraffic: true,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  // Deep linking — intercepte easyvtc://... après OAuth Google
  scheme: "easyvtc",

  plugins: [
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#1E3A5F",
        sounds: [],
      },
    ],
  ],

  // ── EAS Build config ─────────────────────────────────────────────────────
  // Décommenter pour les builds EAS (production/preview)
  extra: {
    eas: {
      projectId: "df291dc3-7c81-4a3f-89f7-f0bd17d74a32",
    },
  },
};
