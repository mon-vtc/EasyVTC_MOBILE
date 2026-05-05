import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { createDrawerNavigator, DrawerNavigationOptions } from '@react-navigation/drawer';
import {
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { AppIcon } from '../components/common/AppIcon';
import { Colors, Fonts, Spacing } from '../theme/colors';
import { Logo } from '../constants/logo';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';

import ManagerHomeScreen         from '../screens/manager/ManagerHomeScreen';
import ManagerReservationsScreen from '../screens/manager/ManagerReservationsScreen';
import ManagerProfileScreen      from '../screens/manager/ManagerProfileScreen';

// Réutilisation des écrans admin en lecture seule pour les gestionnaires
import AdminDriversScreen        from '../screens/admin/drivers/AdminDriversScreen';
import AdminClientsScreen        from '../screens/admin/clients/AdminClientsScreen';
import AdminPricingScreen        from '../screens/admin/AdminPricingScreen';
import AdminFlatRatesScreen      from '../screens/admin/AdminFlatRatesScreen';
import AdminOrdersScreen         from '../screens/admin/AdminOrdersScreen';
import AdminInvoicesScreen       from '../screens/admin/AdminInvoicesScreen';
import AdminDocumentsScreen      from '../screens/admin/AdminDocumentsScreen';

import type { ManagerDrawerParamList } from '../types';

const Drawer = createDrawerNavigator<ManagerDrawerParamList>();

// ── Drawer custom avec items conditionnels selon permissions ─────

function ManagerDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout, localAvatarUri } = useAuth();
  const { hasPermission, hasAnyPermission } = usePermissions();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header profil */}
      <View style={styles.header}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarCircle}>
            {(localAvatarUri ?? user?.profile_photo_url) ? (
              <Image
                source={{ uri: localAvatarUri ?? user?.profile_photo_url ?? undefined }}
                style={styles.avatarImage}
              />
            ) : (
              <AppIcon name="person-outline" color="rgba(255,255,255,0.7)" size={28} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{user?.first_name} {user?.last_name}</Text>
            <Text style={styles.role}>Gestionnaire VTC</Text>
          </View>
        </View>
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.menu}
        showsVerticalScrollIndicator={false}
      >
        {/* Accueil — toujours visible */}
        <DrawerItem
          label={() => <DrawerLabel icon="home-outline" label="Accueil" />}
          onPress={() => props.navigation.navigate('ManagerHome')}
          style={styles.item}
        />

        {hasPermission('view_reservations') && (
          <DrawerItem
            label={() => <DrawerLabel icon="car-outline" label="Réservations" />}
            onPress={() => props.navigation.navigate('ManagerReservations')}
            style={styles.item}
          />
        )}

        {hasPermission('view_drivers') && (
          <DrawerItem
            label={() => <DrawerLabel icon="person-outline" label="Chauffeurs" />}
            onPress={() => props.navigation.navigate('ManagerDrivers')}
            style={styles.item}
          />
        )}

        {hasPermission('view_clients') && (
          <DrawerItem
            label={() => <DrawerLabel icon="people-outline" label="Clients" />}
            onPress={() => props.navigation.navigate('ManagerClients')}
            style={styles.item}
          />
        )}

        {hasAnyPermission('view_pricing', 'manage_pricing') && (
          <>
            <DrawerItem
              label={() => <DrawerLabel icon="pricetag-outline" label="Grille tarifaire" />}
              onPress={() => props.navigation.navigate('BaseGrid')}
              style={styles.item}
            />
            <DrawerItem
              label={() => <DrawerLabel icon="list-outline" label="Tarifs forfaitaires" />}
              onPress={() => props.navigation.navigate('FlatRates')}
              style={[styles.item, styles.subItem]}
            />
          </>
        )}

        {hasPermission('view_orders') && (
          <DrawerItem
            label={() => <DrawerLabel icon="document-text-outline" label="Bons de commande" />}
            onPress={() => props.navigation.navigate('ManagerOrders')}
            style={styles.item}
          />
        )}

        {hasPermission('view_invoices') && (
          <DrawerItem
            label={() => <DrawerLabel icon="receipt-outline" label="Factures" />}
            onPress={() => props.navigation.navigate('ManagerInvoices')}
            style={styles.item}
          />
        )}

        {hasPermission('view_documents') && (
          <DrawerItem
            label={() => <DrawerLabel icon="folder-open-outline" label="Documents" />}
            onPress={() => props.navigation.navigate('ManagerDocuments')}
            style={styles.item}
          />
        )}

        <DrawerItem
          label={() => <DrawerLabel icon="person-circle-outline" label="Mon compte" />}
          onPress={() => props.navigation.navigate('ManagerProfile')}
          style={styles.item}
        />
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.divider} />
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <AppIcon name="log-out-outline" color={Colors.error} size={20} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DrawerLabel({ icon, label }: { icon: React.ComponentProps<typeof AppIcon>['name']; label: string }) {
  return (
    <View style={styles.labelRow}>
      <AppIcon name={icon} size={20} color={Colors.bordeauxDark} />
      <Text style={styles.labelText}>{label}</Text>
    </View>
  );
}

// ── Options d'en-tête ────────────────────────────────────────────

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
  drawerStyle: { backgroundColor: Colors.surface, width: 280 },
  drawerActiveTintColor:       Colors.bordeaux,
  drawerInactiveTintColor:     Colors.textSecondary,
  drawerActiveBackgroundColor: Colors.overlayLight,
});

// ── Navigator ────────────────────────────────────────────────────

export default function ManagerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <ManagerDrawerContent {...props} />}
      screenOptions={getDrawerScreenOptions}
    >
      <Drawer.Screen name="ManagerHome"         component={ManagerHomeScreen}         options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ManagerReservations" component={ManagerReservationsScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ManagerDrivers"      component={AdminDriversScreen as React.ComponentType<any>}  options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ManagerClients"      component={AdminClientsScreen as React.ComponentType<any>}  options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ManagerOrders"       component={AdminOrdersScreen}         options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ManagerInvoices"     component={AdminInvoicesScreen}       options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ManagerDocuments"    component={AdminDocumentsScreen}      options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ManagerProfile"      component={ManagerProfileScreen}      options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="BaseGrid"            component={AdminPricingScreen}        options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="FlatRates"           component={AdminFlatRatesScreen}      options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.surface },
  header:      { backgroundColor: Colors.bordeaux, padding: Spacing.lg, paddingTop: Spacing.xxl },
  avatarRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatarCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  name:        { color: Colors.white, fontSize: Fonts.size.md, fontWeight: '700' },
  role:        { color: 'rgba(255,255,255,0.7)', fontSize: Fonts.size.sm, marginTop: 2 },
  menu:        { paddingTop: Spacing.sm },
  item:        { marginVertical: -2 },
  subItem:     { marginLeft: Spacing.md },
  footer:      { padding: Spacing.lg, paddingBottom: Spacing.lg },
  divider:     { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  logoutText:  { color: Colors.error, fontSize: Fonts.size.md, fontWeight: '600' },
  labelRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  labelText:   { fontSize: 16, color: Colors.textPrimary, fontWeight: '500', flex: 1 },
});
