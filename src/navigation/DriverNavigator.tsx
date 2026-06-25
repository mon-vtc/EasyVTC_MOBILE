import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerNavigationOptions } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppIcon } from '../components/common/AppIcon';
import DrawerContent, { DrawerLabel } from './DrawerContent';
import { Colors, Spacing } from '../theme/colors';

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
import ChatScreen from '../screens/chats/ChatScreen';
import MessagesScreen from '../screens/client/MessagesScreen'; // Réutilisé pour les chats de réservation
import SupportListScreen from '../screens/support/SupportListScreen';
import SupportChatScreen from '../screens/support/SupportChatScreen';
import DriverReviewScreen        from '../screens/driver/DriverReviewScreen';
import DriverRevenuesScreen from '../screens/driver/DriverRevenuesScreen';
import CGU from '../screens/CGU';
import type { DriverDrawerParamList, DriverReservationsStackParamList, DriverOrdersStackParamList, DriverNotificationsStackParamList, DriverMessagesStackParamList, SupportStackParamList, DriverTripsStackParamList, RevenuStackParamList } from '../types/auth.types';

import { Logo }                  from  '../constants/logo';
 import { useNotifications } from '../hooks/useNotifications';

const DriverReservationsStack = createNativeStackNavigator<DriverReservationsStackParamList>();

function DriverReservationsStackScreen() {
  return (
    <DriverReservationsStack.Navigator screenOptions={{ headerShown: false }}>
      <DriverReservationsStack.Screen name="DriverReservationsList" component={DriverReservationsScreen} />
      <DriverReservationsStack.Screen name="DriverReservationDetails" component={DriverReservationScreen} />
      <DriverReservationsStack.Screen name="ChatScreen" component={ChatScreen} />
      <DriverReservationsStack.Screen name="DriverInvoiceDetails" component={DriverInvoiceDetailScreen} />
      <DriverReservationsStack.Screen name="SupportList" component={SupportListScreen} />
      <DriverReservationsStack.Screen name="SupportChat" component={SupportChatScreen} />

    </DriverReservationsStack.Navigator>
  );
}
const DriverTripsStack = createNativeStackNavigator<DriverTripsStackParamList>();

function DriverTripsStackScreen() {
  return (
    <DriverTripsStack.Navigator screenOptions={{ headerShown: false }}>
      <DriverTripsStack.Screen name="DriverTripsList" component={DriverTripsScreen} />
      <DriverTripsStack.Screen name="DriverReservationDetails" component={DriverReservationScreen} />
    </DriverTripsStack.Navigator>
  );
}
const DriverNotificationsStack = createNativeStackNavigator<DriverNotificationsStackParamList>();
function DriverNotificationsStackScreen() {
  return (
    <DriverNotificationsStack.Navigator screenOptions={{ headerShown: false }}>
      <DriverNotificationsStack.Screen name="NotificationsList" component={NotificationsScreen} />
      <DriverNotificationsStack.Screen name="NotificationDetails" component={NotificationDetailsScreen} />
      <DriverNotificationsStack.Screen name="ChatScreen" component={ChatScreen} />
      <DriverNotificationsStack.Screen name="DriverReservationDetails" component={DriverReservationScreen} />
      <DriverNotificationsStack.Screen name="SupportList" component ={SupportListScreen} />
      <DriverNotificationsStack.Screen name="SupportChat" component={SupportChatScreen} />
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

const DriverMessagesStack = createNativeStackNavigator<DriverMessagesStackParamList>();
 
function DriverMessagesStackScreen () {
  return (
    <DriverMessagesStack.Navigator screenOptions={{ headerShown: false }}>
      <DriverMessagesStack.Screen name="DriverMessagesList" component={MessagesScreen} />
      <DriverMessagesStack.Screen name="ChatScreen" component={ChatScreen} />
    </DriverMessagesStack.Navigator>
  );
}

const DriverSupportStack = createNativeStackNavigator<SupportStackParamList>();

function  DriverSupportStackScreen() {
  return (
    <DriverSupportStack.Navigator screenOptions={{ headerShown: false }}>
      <DriverSupportStack.Screen name="SupportList" component={SupportListScreen} />
      <DriverSupportStack.Screen name="SupportChat" component={SupportChatScreen} />
    </DriverSupportStack.Navigator>
  );
}

const DriverRevenuStack = createNativeStackNavigator<RevenuStackParamList>();

function DriverRevenuStackScreen() {
  return (
    <DriverRevenuStack.Navigator screenOptions={{ headerShown: false }}>
        <DriverRevenuStack.Screen name="DriverRevenuesList" component={DriverRevenuesScreen} />
        <DriverRevenuStack.Screen name="DriverInvoiceDetails" component={DriverInvoiceDetailScreen} />
    </DriverRevenuStack.Navigator>
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
const DriverRootStack = createNativeStackNavigator();

function DriverDrawerNavigator() {
  const { unreadCount, unreadMessagesCount, unreadSupportCount } = useNotifications();

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
      <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.getParent()?.navigate('DriverNotificationList')}>
        <AppIcon name="notifications-outline" size={26} color={Colors.white} />
        {unreadCount > 0 && (
          <View style={styles.notifBadge}>
            <Text style={styles.notifText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    ),
  
    // --- Style du volet latéral (Drawer) ---
    drawerStyle: { backgroundColor: Colors.surface, width: 280 },
    drawerActiveTintColor: Colors.bordeaux,
    drawerInactiveTintColor: Colors.textSecondary,
    drawerActiveBackgroundColor: Colors.overlayLight,
  });
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
        name="DriverNotifications"
        component={DriverNotificationsStackScreen}
        options={{ 
          drawerLabel: () => <DrawerLabel icon="notifications-outline" label="Notifications" /> ,
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="DriverMessages"
        component={DriverMessagesStackScreen}
        options={{ drawerLabel: () => <DrawerLabel icon="chatbubble-outline" label="Messages" badgeCount={unreadMessagesCount} />, headerShown: false }}
      />

      <Drawer.Screen
        name="DriverReservations"
        component={DriverReservationsStackScreen}
        options={{
          drawerLabel: () => <DrawerLabel icon="car-outline" label="Mes courses" />,
          unmountOnBlur: true,
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
        component={DriverTripsStackScreen}
        options={{
          drawerLabel: () => <DrawerLabel icon="calendar-outline" label="Planning" />,
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="DriverAvailability"
        component={DriverAvailabilityScreen}
        options={{
          drawerLabel: () => <DrawerLabel icon="watch-outline" label="Disponibilité" />,
          headerShown: false,
        }}
      />


      <Drawer.Screen
        name="DriverRevenues"
        component={DriverRevenuStackScreen}
        options={{
          drawerLabel: () => <DrawerLabel icon="cash-outline" label="Revenus" />,
          headerShown: false,
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
        name="DriverReviews"
        component={DriverReviewScreen}
        options={{
          drawerLabel: () => <DrawerLabel icon="star-outline" label="Mes évaluations" />,
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
              name="CGU"
              component={CGU}
              options={{
                drawerItemStyle: { display: 'none' },
                headerShown: false,
              }} // Pas de label dans le drawer, accès uniquement via la section Tarification
            />

      <Drawer.Screen
        name="DriverSupport"
        component={DriverSupportStackScreen}
        options={{ drawerLabel: () => <DrawerLabel icon="headset-outline" label="Support" badgeCount={unreadSupportCount} />, headerShown: false }}
      />


    </Drawer.Navigator>
  );
}

export default function DriverNavigator() {
  return (
    <DriverRootStack.Navigator screenOptions={{ headerShown: false }}>
      <DriverRootStack.Screen name="DriverMain" component={DriverDrawerNavigator} />
      <DriverRootStack.Screen name="DriverNotificationList" component={NotificationsScreen} />
      <DriverRootStack.Screen name="NotificationDetails" component={NotificationDetailsScreen} />
    </DriverRootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  labelText: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
    marginLeft: Spacing.md,
    fontWeight: '500'
  },
  iconBtn:      { position: 'relative', padding: 6,borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', marginRight: 20 },
  notifBadge: {
    position:        'absolute',
    top:             2, 
    right: 2,
    backgroundColor: '#FF5252',
    borderRadius:    8,
    minWidth:        16, 
    height: 16,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 3,
  },
  notifText: { color: Colors.white, fontSize: 9, fontWeight: '800' },

});
