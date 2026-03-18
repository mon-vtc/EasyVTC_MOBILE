import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar }        from 'expo-status-bar';
import AppNavigator         from './src/navigation/AppNavigator';
import { Colors }           from './src/theme/colors';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={Colors.bordeaux} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}