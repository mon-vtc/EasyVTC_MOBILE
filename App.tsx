import { useCallback, useEffect } from 'react';
import { View }              from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar }        from 'expo-status-bar';
import * as SplashScreen    from 'expo-splash-screen';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import AppNavigator         from './src/navigation/AppNavigator';
import { Colors }           from './src/theme/colors';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { ToastProvider }    from './src/components/common/ToastProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });
  usePushNotifications();

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ToastProvider>
          <StatusBar style="light" backgroundColor={Colors.bordeaux} />
          <AppNavigator />
        </ToastProvider>
      </SafeAreaProvider>
    </View>
  );
}