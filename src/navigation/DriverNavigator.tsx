import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerNavigationOptions } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppIcon } from '../components/common/AppIcon';
import DrawerContent from './DrawerContent';
import { Colors } from '../theme/colors';

import DriverHomeScreen         from '../screens/driver/DriverHomeScreen';
import DriverReservationsScreen from '../screens/driver/DriverReservationsScreen';
import DriverReservationScreen  from '../screens/driver/DriverReservationScreen';
import DriverTripsScreen        from '../screens/driver/DriverTripsScreen';
import DriverDocumentsScreen    from '../screens/driver/DriverDocumentsScreen';
import DriverAvailabilityScreen from '../screens/driver/DriverAvailabilityScreen';
import DriverProfileScreen      from '../screens/driver/DriverProfileScreen';
import DriverOrdersScreen         from '../screens/driver/orders/DriverOrdersScreen';
import DriverOrderDetailsScreen   from '../screens/driver/orders/DriverOrderDetailsScreen';
import DriverInvoiceDetailScreen   from '../screens/driver/invoices/DriverInvoiceDetailsScreen';
import DriverInvoicesScreen       from '../screens/driver/invoices/DriverInvoicesScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import NotificationDetailsScreen from '../screens/notifications/NotificationDetailsScreen';


import type { DriverDrawerParamList, DriverReservationsStackParamList, DriverOrdersStackParamList, DriverNotificationsStackParamList } from '../types/auth.types';

import { Logo }                  from  '../constants/logo';

const DriverReservationsStack = createNativeStackNavigator<DriverReservationsStackParamList>();

function DriverReservationsStackScreen() {
  return (
    <DriverReservationsStack.Navigator screenOptions={{ headerShown: false }}>
      <DriverReservationsStack.Screen name="DriverReservationsList" component={DriverReservationsScreen} />
      <DriverReservationsStack.Screen name="DriverReservationDetails" component={DriverReservationScreen} />
    </DriverReservationsStack.Navigator>
  );
}
const DriverNotificationsStack = createNativeStackNavigator<DriverNotificationsStackParamList>();
function DriverNotificationsStackScreen() {
  return (
    <DriverNotificationsStack.Navigator screenOptions={{ headerShown: false }}>
      <DriverNotificationsStack.Screen name="NotificationsList" component={NotificationsScreen} />
      <DriverNotificationsStack.Screen name="NotificationDetails" component={NotificationDetailsScreen} />
    </DriverNotificationsStack.Navigator>
  );
}
const DriverOrdersStack = createNativeStackNavigator<DriverOrdersStackParamList>();

function DriverOrdersStackScreen() {
  return (
    <DriverOrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <DriverOrdersStack.Screen name="DriverOrdersList"   component={DriverOrdersScreen} />
      <DriverOrdersStack.Screen name="DriverOrderDetails" component={DriverOrderDetailsScreen} />
    </DriverOrdersStack.Navigator>
  );
}

const DriverInvoicesStack = createNativeStackNavigator();

function DriverInvoicesStackScreen() {
  return (
    <DriverInvoicesStack.Navigator screenOptions={{ headerShown: false }}>
      <DriverInvoicesStack.Screen name="DriverInvoicesList" component={DriverInvoicesScreen} />
      <DriverInvoicesStack.Screen name="DriverInvoiceDetails" component={DriverInvoiceDetailScreen} />
    </DriverInvoicesStack.Navigator>
  );
}

const Drawer = createDrawerNavigator<DriverDrawerParamList>();

const getDrawerScreenOptions = ({ navigation }: any): DrawerNavigationOptions => ({


  headerStyle: { 
    backgroundColor: Colors.bordeaux, 
    height: 100,
    elevation: 0, 
    shadowOpacity: 0
  },
  headerTintColor: Colors.white,
  headerTitleAlign: 'center',

  headerTitle: () => (
    <Image 
      source={Logo.LogoEasyVTC} 
      style={{ width: 40, height: 40, resizeMode: 'contain' }} 
    />
  ),

  // --- Bouton Menu à Gauche ---
  headerLeft: () => (
    <TouchableOpacity 
      onPress={() => navigation.toggleDrawer()} 
      style={{ marginLeft: 20 }}
    >
      <AppIcon name="menu-outline" size={28} color={Colors.white} />
    </TouchableOpacity>
  ),

  // --- Bouton Notification à Droite ---
  headerRight: () => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Notifications')}
      style={{ marginRight: 20 }}
    >
      <AppIcon name="notifications-outline" size={24} color={Colors.white} />
    </TouchableOpacity>
  ),

  // --- Style du volet latéral (Drawer) ---
  drawerStyle: { backgroundColor: Colors.surface, width: 280 },
  drawerActiveTintColor: Colors.bordeaux,
  drawerInactiveTintColor: Colors.textSecondary,
  drawerActiveBackgroundColor: Colors.overlayLight,
});

/** Composant pour les labels du menu latéral (Icone + Texte) */
function DrawerLabel({ icon, label }: { icon: React.ComponentProps<typeof AppIcon>['name']; label: string }) {
  return (
    <View style={styles.labelRow}>
      <AppIcon name={icon} size={20} color={Colors.bordeauxDark} />
      <Text style={styles.labelText}>{label}</Text>
    </View>
  );
}

export default function DriverNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={getDrawerScreenOptions}
    >
      <Drawer.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{
          drawerLabel: () => <DrawerLabel icon="home-outline" label="Accueil" />,
        }}
      />

      <Drawer.Screen
        name="Notifications"
        component={DriverNotificationsStackScreen}
        options={{ 
          drawerLabel: () => <DrawerLabel icon="notifications-outline" label="Notifications" /> ,
          
        }}
      />

      <Drawer.Screen
        name="DriverReservations"
        component={DriverReservationsStackScreen}
        options={{
          drawerLabel: () => <DrawerLabel icon="car-outline" label="Mes courses" />,
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="DriverDocuments"
        component={DriverDocumentsScreen}
        options={{
          drawerLabel: () => <DrawerLabel icon="document-text-outline" label="Documents" />,
        }}
      />

      <Drawer.Screen
        name="DriverTrips"
        component={DriverTripsScreen}
        options={{
          drawerLabel: () => <DrawerLabel icon="calendar-outline" label="Planning" />,
        }}
      />

      <Drawer.Screen
        name="DriverAvailability"
        component={DriverAvailabilityScreen}
        options={{
          drawerLabel: () => <DrawerLabel icon="cash-outline" label="Revenus" />,
        }}
      />

      <Drawer.Screen
        name="DriverOrders"
        component={DriverOrdersStackScreen}
        options={{
          drawerLabel: () => <DrawerLabel icon="document-text-outline" label="Bons de commande" />,
          headerShown: false,
        }}
      />
     
      <Drawer.Screen
        name="DriverInvoices"
        component={DriverInvoicesStackScreen}
        options={{
          drawerLabel: () => <DrawerLabel icon="receipt-outline" label="Factures" />,
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="DriverProfile"
        component={DriverProfileScreen}
        options={{
          drawerLabel: () => <DrawerLabel icon="person-outline" label="Mon compte" />,
        }}
      />

      <Drawer.Screen
        name="DriverOrderDetails"
        component={DriverOrderDetailsScreen}
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="DriverReservationDetails"
        component={DriverReservationScreen}
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="DriverInvoiceDetails"
        component={DriverInvoiceDetailScreen}
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />

    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  labelText: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
});
