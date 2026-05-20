import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar }        from 'expo-status-bar';
import AppNavigator         from './src/navigation/AppNavigator';
import { Colors }           from './src/theme/colors';
import { usePushNotifications } from './src/hooks/usePushNotifications';

export default function App() {  
  usePushNotifications();
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={Colors.bordeaux} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}