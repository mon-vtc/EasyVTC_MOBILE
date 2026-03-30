import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DrawerContent             from './DrawerContent';
import { Colors }                from '../theme/colors';

// Screens — placeholders Sprint 4+
import DriverHomeScreen         from '../screens/driver/DriverHomeScreen';
import DriverTripsScreen        from '../screens/driver/DriverTripsScreen';
import DriverDocumentsScreen    from '../screens/driver/DriverDocumentsScreen';
import DriverAvailabilityScreen from '../screens/driver/DriverAvailabilityScreen';
import DriverProfileScreen      from '../screens/driver/DriverProfileScreen';
import type { DriverDrawerParamList } from '../types/auth.types';

const Drawer = createDrawerNavigator<DriverDrawerParamList>();

const drawerScreenOptions = {
  headerStyle:            { backgroundColor: Colors.bordeaux },
  headerTintColor:        Colors.white,
  headerTitleStyle:       { fontWeight: '700' as const, fontSize: 18 },
  drawerStyle:            { backgroundColor: Colors.surface, width: 280 },
  drawerActiveTintColor:  Colors.bordeaux,
  drawerInactiveTintColor: Colors.textSecondary,
  drawerActiveBackgroundColor: Colors.overlayLight,
};

export default function DriverNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={drawerScreenOptions}
    >
      <Drawer.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{ title: 'Mes courses', drawerLabel: '🚗  Mes courses' }}
      />
      <Drawer.Screen
        name="DriverTrips"
        component={DriverTripsScreen}
        options={{ title: 'Historique', drawerLabel: '📊  Historique' }}
      />
      <Drawer.Screen
        name="DriverDocuments"
        component={DriverDocumentsScreen}
        options={{ title: 'Mes documents', drawerLabel: '📄  Mes documents' }}
      />
      <Drawer.Screen
        name="DriverAvailability"
        component={DriverAvailabilityScreen}
        options={{ title: 'Disponibilité', drawerLabel: '🟢  Disponibilité' }}
      />
      <Drawer.Screen
        name="DriverProfile"
        component={DriverProfileScreen}
        options={{ title: 'Mon profil', drawerLabel: '👤  Mon profil' }}
      />
    </Drawer.Navigator>
  );
}