import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar }        from 'expo-status-bar';
import AppNavigator         from './src/navigation/AppNavigator';
import { Colors }           from './src/theme/colors';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { ToastProvider }    from './src/components/common/ToastProvider';

export default function App() {  
  usePushNotifications();
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <StatusBar style="light" backgroundColor={Colors.bordeaux} />
        <AppNavigator />
      </ToastProvider>
    </SafeAreaProvider>
  );
}