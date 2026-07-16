import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/auth.store';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const CHECK_INTERVAL_MS = 15 * 1000;

/**
 * Déconnexion automatique après 5 minutes sans interaction (sécurité) —
 * l'utilisateur doit ressaisir ses identifiants pour continuer.
 * L'horloge du timer JS ne tourne pas de façon fiable en arrière-plan sur
 * mobile : on note l'heure de mise en arrière-plan et on vérifie le délai
 * écoulé au retour au premier plan, en plus du contrôle périodique.
 */
export function useInactivityLogout() {
  const lastActivityRef = useRef(Date.now());
  const backgroundedAtRef = useRef<number | null>(null);

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const { accessToken, logout } = useAuthStore.getState();
      if (!accessToken) return;
      if (Date.now() - lastActivityRef.current >= INACTIVITY_TIMEOUT_MS) {
        logout();
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        if (backgroundedAtRef.current != null) {
          const elapsedInBackground = Date.now() - backgroundedAtRef.current;
          if (elapsedInBackground >= INACTIVITY_TIMEOUT_MS) {
            const { accessToken, logout } = useAuthStore.getState();
            if (accessToken) logout();
          }
          backgroundedAtRef.current = null;
        }
        recordActivity();
      } else {
        backgroundedAtRef.current = Date.now();
      }
    };

    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, [recordActivity]);

  return { recordActivity };
}
