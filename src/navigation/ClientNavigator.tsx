// ══════════════════════════════════════════════════════════════════════════════
// NAVIGATOR — Client
// Architecture :
//
//   ClientNavigator  (Stack)
//   ├── ClientTabs   (BottomTab)
//   │   ├── ClientHome
//   │   ├── MyReservations
//   │   ├── CreateReservation   ← FAB central (redirige vers Booking)
//   │   ├── Messages
//   │   └── ClientProfile
//   ├── Booking                 ← formulaire 3 étapes (push depuis FAB ou home)
//   ├── BookingConfirmation     ← page succès (replace depuis Booking)
//   └── ReservationDetail       ← détail / bon de commande
// ══════════════════════════════════════════════════════════════════════════════

import React                          from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons }                   from '@expo/vector-icons';
import { Colors, Radius, Spacing, Fonts } from '../theme/colors';

import ClientHomeScreen           from '../screens/client/ClientHomeScreen';
import MyReservationsScreen       from '../screens/client/MyReservationsScreen';
import CreateReservationScreen    from '../screens/client/CreateReservationScreen';
import MessagesScreen             from '../screens/client/MessagesScreen';
import ClientProfileScreen        from '../screens/client/ClientProfileScreen';
import MyOrdersScreen             from '../screens/client/MyOrdersScreen';
import MyInvoicesScreen           from '../screens/client/MyInvoicesScreen';
import BookingConfirmationScreen  from '../screens/client/BookingConfirmationScreen';
import ReservationDetailsScreen   from '../screens/client/ReservationDetailsScreen';
import OrderDetailsScreen         from '../screens/client/OrderDetailsScreen';
import InvoiceDetailsScreen       from '../screens/client/InvoiceDetailsScreen';
import NotificationsScreen        from '../screens/notifications/NotificationsScreen';
import NotificationDetailsScreen  from '../screens/notifications/NotificationDetailsScreen';
import SupportListScreen          from '../screens/support/SupportListScreen';
import SupportChatScreen          from '../screens/support/SupportChatScreen';
import ChatScreen                 from '../screens/chats/ChatScreen';
import MyFavoritesScreen from '../screens/client/MyFavoritesScreen';
import type { ClientTabParamList, ClientStackParamList } from '../types/auth.types';
import {PromoCodesScreen} from '../screens/client/PromoCodesScreen';
import CGU from '../screens/CGU'

// ══════════════════════════════════════════════════════════════════════════════
// NAVIGATORS
// ══════════════════════════════════════════════════════════════════════════════
const Tab   = createBottomTabNavigator<ClientTabParamList>();
const Stack = createNativeStackNavigator<ClientStackParamList>();

// ── Bouton FAB central ──────────────────────────────────────────────────────
function FABButton({ onPress }: { onPress: (e?: any) => void }) {
  return (
    <TouchableOpacity style={fabStyles.btn} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name="add" size={28} color={Colors.white} />
    </TouchableOpacity>
  );
}

function CreateReservationTabScreen() {
  return null;
}

const fabStyles = StyleSheet.create({
  btn: {
    width:           60,
    height:          60,
    borderRadius:    30,
    backgroundColor: Colors.bordeaux,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Platform.OS === 'ios' ? 16 : 24,
    shadowColor:     Colors.bordeaux,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.4,
    shadowRadius:    8,
    elevation:       8,
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// TAB NAVIGATOR (onglets)
// ══════════════════════════════════════════════════════════════════════════════
function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:             false,
        tabBarShowLabel:         true,
        tabBarActiveTintColor:   Colors.bordeauxDark,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth:  1,
          borderTopColor:  Colors.border,
          height:          Platform.OS === 'ios' ? 84 : 84,
          paddingBottom:   Platform.OS === 'ios' ? 24 : 8,
          paddingTop:      8,
        },
        tabBarLabelStyle: { fontSize: 11, fontFamily: Fonts.semibold, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="ClientHome"
        component={ClientHomeScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="MyReservations"
        component={MyReservationsScreen}
        options={{
          tabBarLabel: 'Courses',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />



      {/*
       * FAB central — CreateReservation n'est pas un vrai écran tab.
       * Le bouton navigue vers le Stack "ReservationDetails" (hors tabs).
       * Le composant CreateReservationScreen peut rester vide / redirect.
       */}
      <Tab.Screen
        name="CreateReservationTab"
        component={CreateReservationTabScreen}
        options={({ navigation }) => ({
          tabBarLabel: '',
          tabBarButton: () => <FABButton onPress={() => navigation.navigate('CreateReservation')} />,
        })}
      />

      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ClientProfile"
        component={ClientProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Écran caché de la barre d'onglets mais accessible depuis la navigation.
          ReservationDetails/MyOrders/MyInvoices ne sont PAS dupliqués ici : ils
          n'existent que dans le Stack racine (ClientNavigator) pour forcer leur
          résolution via navigate() vers le push plein écran (slide_from_right,
          pas de tab bar) plutôt que vers un switch interne au Tab.Navigator. */}
      <Tab.Screen
        name="CGU"
        component={CGU}
        options={{
          tabBarButton: () => null, // Masqué de la barre d'onglets
        }}
      />

    </Tab.Navigator>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STACK NAVIGATOR (racine client)
// ══════════════════════════════════════════════════════════════════════════════
export default function ClientNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* Tabs — écran par défaut */}
      <Stack.Screen
        name="ClientTabs"
        component={ClientTabs}
      />

      {/* Formulaire de réservation 3 étapes */}
      <Stack.Screen
        name="CreateReservation"
        component={CreateReservationScreen}
        options={{
          animation:         'slide_from_bottom',
          gestureEnabled:    true,
          gestureDirection:  'vertical',
        }}
      />

      {/* Page de succès après réservation — replace() depuis CreateReservationScreen empêche le retour */}
      <Stack.Screen
        name="BookingConfirmation"
        component={BookingConfirmationScreen}
        options={{
          animation:      'fade',
          gestureEnabled: false,
        }}
      />

      {/* Détail d'une réservation existante */}
      <Stack.Screen
        name="ReservationDetails"
        component={ReservationDetailsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="MyInvoices"
        component={MyInvoicesScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="SupportList"
        component={SupportListScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="SupportChat"
        component={SupportChatScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Détail d'un bon de commande */}
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="InvoiceDetails"
        component={InvoiceDetailsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="MyFavorites"
        component={MyFavoritesScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="PromoCodes"
        component={PromoCodesScreen}
        options={{
          animation: 'slide_from_right',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="NotificationDetails"
        component={NotificationDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />

    </Stack.Navigator>
  );
}