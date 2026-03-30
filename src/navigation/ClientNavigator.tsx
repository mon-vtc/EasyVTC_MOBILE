import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DrawerContent             from './DrawerContent';
import { Colors }                from '../theme/colors';

// Screens — placeholders Sprint 3
import ClientHomeScreen        from '../screens/client/ClientHomeScreen';
import MyReservationsScreen    from '../screens/client/MyReservationsScreen';
import CreateReservationScreen from '../screens/client/CreateReservationScreen';
import ClientProfileScreen     from '../screens/client/ClientProfileScreen';
import type { ClientDrawerParamList } from '../types/auth.types';

const Drawer = createDrawerNavigator<ClientDrawerParamList>();

const drawerScreenOptions = {
  headerStyle:            { backgroundColor: Colors.bordeaux },
  headerTintColor:        Colors.white,
  headerTitleStyle:       { fontWeight: '700' as const, fontSize: 18 },
  drawerStyle:            { backgroundColor: Colors.surface, width: 280 },
  drawerActiveTintColor:  Colors.bordeaux,
  drawerInactiveTintColor: Colors.textSecondary,
  drawerActiveBackgroundColor: Colors.overlayLight,
};

export default function ClientNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={drawerScreenOptions}
    >
      <Drawer.Screen
        name="ClientHome"
        component={ClientHomeScreen}
        options={{ title: 'Accueil', drawerLabel: '🏠  Accueil' }}
      />
      <Drawer.Screen
        name="MyReservations"
        component={MyReservationsScreen}
        options={{ title: 'Mes réservations', drawerLabel: '📋  Mes réservations' }}
      />
      <Drawer.Screen
        name="CreateReservation"
        component={CreateReservationScreen}
        options={{ title: 'Nouvelle réservation', drawerLabel: '➕  Nouvelle réservation' }}
      />
      <Drawer.Screen
        name="ClientProfile"
        component={ClientProfileScreen}
        options={{ title: 'Mon profil', drawerLabel: '👤  Mon profil' }}
      />
    </Drawer.Navigator>
  );
}