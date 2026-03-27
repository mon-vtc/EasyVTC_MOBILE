import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerNavigationOptions } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppIcon }     from '../components/common/AppIcon';
import DrawerContent   from './DrawerContent';
import { Colors }      from '../theme/colors';
import { Logo }        from '../constants/logo';

import AdminHomeScreen           from '../screens/admin/AdminHomeScreen';
import AdminDocumentsScreen      from '../screens/admin/AdminDocumentsScreen';
import AdminProfileScreen        from '../screens/admin/AdminProfileScreen';
import AdminDriversScreen        from '../screens/admin/drivers/AdminDriversScreen';
import AdminDriverDetailScreen   from '../screens/admin/drivers/AdminDriverDetailScreen';


import type {
  AdminDrawerParamList,
  DriversStackParamList,
} from '../types/auth.types';

const DriversStack = createNativeStackNavigator<DriversStackParamList>();

// ── Stack pour la section Chauffeurs ────────────────────────────
// Permet de naviguer de la liste vers le détail sans quitter le drawer

function AdminDriversStack() {
  return (
    <DriversStack.Navigator screenOptions={{ headerShown: false }}>
      <DriversStack.Screen name="DriversList"   component={AdminDriversScreen}      />
      <DriversStack.Screen name="DriverDetail"  component={AdminDriverDetailScreen} />
    </DriversStack.Navigator>
  );
}


// 1. Ajoute les types si nécessaire (dans tes types ou ici)
const DocumentsStack = createNativeStackNavigator();

// 2. Crée le composant Stack dédié
function AdminDocumentsStack() {
  return (
    <DocumentsStack.Navigator 
      screenOptions={{ 
        headerShown: false // On cache le header du Stack car ton écran AdminDocumentsScreen a déjà son propre header custom
      }}
    >
      <DocumentsStack.Screen 
        name="DocumentsList" 
        component={AdminDocumentsScreen} 
      />
      {/* Tu pourras ajouter ici une page de détail spécifique plus tard si besoin */}
    </DocumentsStack.Navigator>
  );
}


// ── Drawer ──────────────────────────────────────────────────────
const Drawer = createDrawerNavigator<AdminDrawerParamList>();

const getDrawerScreenOptions = ({ navigation }: any): DrawerNavigationOptions => ({
  headerStyle:      { backgroundColor: Colors.bordeaux, height: 100, elevation: 0, shadowOpacity: 0 },
  headerTintColor:  Colors.white,
  headerTitleAlign: 'center',

  headerTitle: () => (
    <Image source={Logo.LogoEasyVTC} style={{ width: 40, height: 40, resizeMode: 'contain' }} />
  ),

  headerLeft: () => (
    <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginLeft: 20 }}>
      <AppIcon name="menu-outline" size={28} color={Colors.white} />
    </TouchableOpacity>
  ),

  headerRight: () => (
    <TouchableOpacity onPress={() => console.log('Notifications')} style={{ marginRight: 20 }}>
      <AppIcon name="notifications-outline" size={24} color={Colors.white} />
    </TouchableOpacity>
  ),

  drawerStyle:               { backgroundColor: Colors.surface, width: 280 },
  drawerActiveTintColor:     Colors.bordeaux,
  drawerInactiveTintColor:   Colors.textSecondary,
  drawerActiveBackgroundColor: Colors.overlayLight,
});

function DrawerLabel({ icon, label }: { icon: React.ComponentProps<typeof AppIcon>['name']; label: string }) {
  return (
    <View style={styles.labelRow}>
      <AppIcon name={icon} size={20} color={Colors.bordeauxDark} />
      <Text style={styles.labelText}>{label}</Text>
    </View>
  );
}

export default function AdminNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={getDrawerScreenOptions}
    >
      <Drawer.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{ drawerLabel: () => <DrawerLabel icon="home-outline" label="Accueil" /> }}
      />

      <Drawer.Screen
        name="AdminDrivers"
        component={AdminDriversStack}
        options={{
          drawerLabel: () => <DrawerLabel icon="person-outline" label="Chauffeurs" />,
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="AdminDocuments"
        component={AdminDocumentsStack} 
        options={{ 
          drawerLabel: () => <DrawerLabel icon="document-text-outline" label="Documents" />,
          headerShown: false, 
        }}
      />

      <Drawer.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{ drawerLabel: () => <DrawerLabel icon="person-outline" label="Mon compte" /> }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  labelRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  labelText: { fontSize: 16, color: Colors.textPrimary },
});