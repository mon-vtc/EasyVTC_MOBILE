/** @type {import('expo/config').ExpoConfig} */
export default {
  name: "EazyVTC_Mobile_App",
  slug: "EazyVTC_Mobile_App",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.EazyVTC",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: "com.EazyVTC",
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  // Deep linking — intercepte easyvtc://... après OAuth Google
  scheme: "easyvtc",

  plugins: ["expo-secure-store"],

  // ── EAS Build config ─────────────────────────────────────────────────────
  // Décommenter pour les builds EAS (production/preview)
  // extra: {
  //   eas: {
  //     projectId: "983978ef-6a7b-428d-92a6-ae5f8dc773ac",
  //   },
  // },
};
