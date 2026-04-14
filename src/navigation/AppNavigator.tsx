import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth }             from '../hooks/useAuth';
import { useAuthStore }        from '../store/auth.store';
import { setOnUnauthorized }   from '../services/auth/auth-callback';
import AuthNavigator           from './AuthNavigator';
import ClientNavigator         from './ClientNavigator';
import DriverNavigator         from './DriverNavigator';
import AdminNavigator          from './AdminNavigator';
import { Colors }              from '../theme/colors';

export default function AppNavigator() {
  const { user, isHydrated }  = useAuth();
  const hydrate               = useAuthStore((s) => s.hydrate);
  const forceLogout           = useAuthStore((s) => s.forceLogout);

  // Configurer le callback pour les erreurs 401
  useEffect(() => {
    setOnUnauthorized(() => {
      forceLogout(); // Nettoyer localement sans appel API
    });
  }, [forceLogout]);

  // Charger le token au démarrage
  useEffect(() => { hydrate(); }, []);

  // Splash pendant l'hydratation
  if (!isHydrated) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
      </View>
    );
  }

  // Routage selon rôle
  const renderNavigator = () => {
    if (!user) return <AuthNavigator />;
    if (user.role === 'driver') return <DriverNavigator />;
    else if (user.role === 'admin') return <AdminNavigator />; // admin → driver nav pour l'instant
    return <ClientNavigator />; // client | admin | manager → client nav pour l'instant
  };


  // Ajouter cette ligne comme attribut de la balise NavigationContainer pour un meilleur debug
  // onStateChange={(state) => console.log('Nouvel État de Navigation:', JSON.stringify(state, null, 2))}
  return (
    <NavigationContainer
    >
      {renderNavigator()}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});