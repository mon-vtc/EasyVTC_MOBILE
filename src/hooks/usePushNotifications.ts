// hooks/usePushNotifications.ts
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { notificationsApi } from '../services/api/notifications.api';
import { useAuthStore } from '../store/auth.store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push: appareil physique requis');
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

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  console.log('Expo Push Token:', token);
  return token;
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
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // You might want to dispatch this to your notifications store
      // useNotificationsStore.getState().addNotificationLocally(notification.request.content);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      // Handle user interaction with the notification
      // e.g., navigate to a specific screen based on notification data
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);
}