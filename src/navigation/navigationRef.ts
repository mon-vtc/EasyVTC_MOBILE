// ══════════════════════════════════════════════════════════════════════════════
// Référence de navigation globale — permet de naviguer depuis en dehors de
// l'arbre React (ex: listeners de notifications push dans usePushNotifications).
// ══════════════════════════════════════════════════════════════════════════════

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as (...args: unknown[]) => void)(name, params);
  }
}
