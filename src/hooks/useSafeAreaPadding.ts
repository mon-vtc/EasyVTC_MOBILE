import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Ajoute insets.bottom à un padding existant, sans jamais le remplacer.
 * À utiliser sur les ScrollView/FlatList/footers fixes/bottom-sheets pour
 * éviter que leur contenu soit masqué par la barre de navigation Android
 * en edge-to-edge (SDK57/targetSdk36).
 */
export function useBottomInset(base = 0): number {
  const insets = useSafeAreaInsets();
  return base + insets.bottom;
}

/**
 * Équivalent haut d'écran — utile uniquement pour les headers "faits main"
 * qui ne passent pas par le composant partagé AppHeader (qui gère déjà insets.top).
 */
export function useTopInset(base = 0): number {
  const insets = useSafeAreaInsets();
  return base + insets.top;
}
