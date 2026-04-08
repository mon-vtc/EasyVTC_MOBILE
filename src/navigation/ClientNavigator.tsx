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
import { Colors, Radius, Spacing }    from '../theme/colors';

import ClientHomeScreen           from '../screens/client/ClientHomeScreen';
import MyReservationsScreen       from '../screens/client/MyReservationsScreen';
import MessagesScreen             from '../screens/client/MessagesScreen';
import ClientProfileScreen        from '../screens/client/ClientProfileScreen';
import CreateReservationScreen              from '../screens/client/CreateReservationScreen';
import ReservationDetailsScreen  from '../screens/client/ReservationDetailsScreen';

import type { ClientTabParamList, ClientStackParamList } from '../types/auth.types';

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
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
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
        name="CreateReservation"
        component={CreateReservationScreen}
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

      {/* Page de succès — replace() depuis CreateReservationScreen empêche le retour */}
      <Stack.Screen
        name="ReservationDetails"
        component={ReservationDetailsScreen} // Garde le même composant pour l'instant
        options={{
          animation:      'fade',
          gestureEnabled: false,   // pas de swipe-back sur la confirmation
        }}
      />

    </Stack.Navigator>
  );
}