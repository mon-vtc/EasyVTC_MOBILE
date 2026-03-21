import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons }                 from '@expo/vector-icons';
import { Colors, Radius, Spacing }  from '../theme/colors';

import ClientHomeScreen        from '../screens/client/ClientHomeScreen';
import MyReservationsScreen    from '../screens/client/MyReservationsScreen';
import CreateReservationScreen from '../screens/client/CreateReservationScreen';
import MessagesScreen          from '../screens/client/MessagesScreen';
import ClientProfileScreen     from '../screens/client/ClientProfileScreen';
import type { ClientTabParamList }  from '../types/auth.types';

const Tab = createBottomTabNavigator<ClientTabParamList>();

// ── Bouton FAB central ──────────────────────────────────────────
function FABButton({ onPress }: { onPress: (e?: any) => void }) {
  return (
    <TouchableOpacity style={fabStyles.btn} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name="add" size={28} color={Colors.white} />
    </TouchableOpacity>
  );
}

const fabStyles = StyleSheet.create({
  btn: {
    width:           60, height: 60,
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

// ── Navigator ───────────────────────────────────────────────────
export default function ClientNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor:   Colors.bordeauxDark,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor:  Colors.surface,
          borderTopWidth:   1,
          borderTopColor:   Colors.border,
          height:           Platform.OS === 'ios' ? 84 : 84,
          paddingBottom:    Platform.OS === 'ios' ? 24 : 8,
          paddingTop:       8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
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

      {/* FAB central */}
      <Tab.Screen
        name="CreateReservation"
        component={CreateReservationScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: (props) => (
            <FABButton onPress={props.onPress!} />
          ),
        }}
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