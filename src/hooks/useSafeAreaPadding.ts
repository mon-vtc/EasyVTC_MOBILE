import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
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

/**
 * Comme useBottomInset, mais pour un footer/card fixe (non scrollable) situé
 * dans un KeyboardAvoidingView : quand le clavier est ouvert, il occupe déjà
 * la zone couverte par insets.bottom (barre de navigation Android) — ajouter
 * insets.bottom en plus crée un espace vide entre le clavier et le contenu.
 * On n'ajoute donc insets.bottom que quand le clavier est fermé.
 */
export function useKeyboardAwareBottomInset(base = 0): number {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const subHide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  return base + (keyboardVisible ? 0 : insets.bottom);
}
