// hooks/usePushNotifications.ts
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { notificationsApi } from '../services/api/notifications.api';
import { useAuthStore } from '../store/auth.store';
import { useNotificationsStore } from '../store/notifications.store';
import { navigateFromNotification } from '../utils/notificationNavigation';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push: appareil physique requis');
    return null;
  }

  // Les notifications push distantes ne sont plus supportées par Expo Go
  // depuis le SDK 53 (nécessite un development build) — on évite de tenter
  // l'enregistrement plutôt que de laisser getExpoPushTokenAsync() planter l'app.
  // Note : appOwnership est déprécié au profit de executionEnvironment, mais ce
  // dernier ('storeClient') regroupe Expo Go ET les development builds (qui, eux,
  // supportent le push) — appOwnership === 'expo' reste le seul moyen de cibler
  // précisément Expo Go.
  if (Constants.appOwnership === 'expo') {
    console.warn('Push: notifications distantes indisponibles sous Expo Go (SDK 53+) — utiliser un development build.');
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  const { status } = existing !== 'granted'
    ? await Notifications.requestPermissionsAsync()
    : { status: existing };

  if (status !== 'granted') {
    console.warn('Push: permission refusée');
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('Expo Push Token:', token);
    return token;
  } catch (err) {
    console.warn('Push: échec de récupération du token', err);
    return null;
  }
}

export function usePushNotifications() {
  const { accessToken } = useAuthStore();

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const registerAndListen = async () => {
      if (!accessToken) {
        console.log('Access token is null, skipping push notification registration.');
        return;
      }

      const expoPushToken = await getExpoPushToken();
      if (!expoPushToken) return;

      try {
        // Use the notificationsApi service for consistency
        await notificationsApi.registerDeviceToken(accessToken, expoPushToken);
        if (isMounted) {
          console.log('Device token enregistré via notificationsApi ✅');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Erreur enregistrement token via notificationsApi:', err);
        }
      }
    };

    registerAndListen();

    // Cleanup function: remove token when component unmounts or accessToken changes to null
    return () => {
      isMounted = false;
      // Note: Unregistering on unmount might be too aggressive for a mobile app
      // as the user might just navigate away temporarily.
      // The more common pattern is to unregister on explicit logout, which should be handled
      // in the auth.store.ts's logout action, as it has access to the accessToken before it's cleared.
      // For this hook, the primary goal is to register when logged in.
    };
  }, [accessToken]); // Re-run effect when accessToken changes

  // Handle incoming notifications (foreground/background)
  const lastHandledRequestId = useRef<string | null>(null);

  useEffect(() => {
    // Résout une notification (payload ne contient que `notification_id` + data
    // contextuelle) en l'entité complète, puis navigue vers l'écran cible.
    const handleNotificationTap = async (response: Notifications.NotificationResponse) => {
      const requestId = response.notification.request.identifier;
      if (lastHandledRequestId.current === requestId) return; // évite le double traitement (cold start + listener)
      lastHandledRequestId.current = requestId;

      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const notificationId = data?.notification_id as string | undefined;
      const { accessToken, user } = useAuthStore.getState();
      if (!notificationId || !accessToken) return;

      try {
        const res = await notificationsApi.getById(accessToken, notificationId);
        if (!res.ok || !res.data) return;

        if (!res.data.read_at) {
          useNotificationsStore.getState().markAsRead(accessToken, notificationId).catch(() => {});
        }
        navigateFromNotification(res.data, user?.role);
      } catch (err) {
        console.error('Erreur résolution notification push:', err);
      }
    };

    const notificationListener = Notifications.addNotificationReceivedListener(() => {
      // Reçue en foreground : rafraîchir la liste/badge depuis la source de vérité
      // (le payload push ne porte pas assez d'infos pour insérer localement).
      const { accessToken } = useAuthStore.getState();
      if (accessToken) {
        useNotificationsStore.getState().fetchNotifications(accessToken).catch(() => {});
      }
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(handleNotificationTap);

    // App lancée depuis un état "killed" via tap sur la notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationTap(response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);
}