import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useAlert } from '../hooks/useAlert';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { AppIcon } from '../components/common/AppIcon';
import { useBottomInset } from '../hooks/useSafeAreaPadding';
import { Colors, Fonts, Spacing } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';

import ManagerHomeScreen         from '../screens/manager/ManagerHomeScreen';
import ManagerReservationsScreen from '../screens/manager/ManagerReservationsScreen';
import ManagerReservationDetailScreen from '../screens/manager/ManagerReservationDetailScreen';
import ManagerProfileScreen      from '../screens/manager/ManagerProfileScreen';

// Réutilisation des écrans admin en lecture seule pour les gestionnaires
import AdminDriversScreen        from '../screens/admin/drivers/AdminDriversScreen';
import AdminDriverDetailScreen   from '../screens/admin/drivers/AdminDriverDetailScreen';
import AdminClientsScreen        from '../screens/admin/clients/AdminClientsScreen';
import AdminClientDetailScreen   from '../screens/admin/clients/AdminClientDetailScreen';
import AdminPricingScreen        from '../screens/admin/AdminPricingScreen';
import AdminFlatRatesScreen      from '../screens/admin/AdminFlatRatesScreen';
import AdminOrdersScreen         from '../screens/admin/orders/AdminOrdersScreen';
import AdminOrdersDetailScreen   from '../screens/admin/orders/OrderDetailsScreen';
import AdminInvoicesScreen       from '../screens/admin/invoices/AdminInvoicesScreen';
import AdminInvoiceDetailsScreen from '../screens/admin/invoices/InvoiceDetailsScreen';
import AdminDocumentsScreen      from '../screens/admin/AdminDocumentsScreen';
import NotificationsScreen       from '../screens/notifications/NotificationsScreen';
import NotificationDetailsScreen from '../screens/notifications/NotificationDetailsScreen';

import type {
  ManagerDrawerParamList,
  ManagerReservationsStackParamList,
  ManagerNotificationsStackParamList,
  ManagerDriversStackParamList,
  ManagerClientsStackParamList,
  ManagerOrdersStackParamList,
  ManagerInvoicesStackParamList,
} from '../types';

const Drawer = createDrawerNavigator<ManagerDrawerParamList>();
const ReservationsStack = createNativeStackNavigator<ManagerReservationsStackParamList>();
const NotificationsStack = createNativeStackNavigator<ManagerNotificationsStackParamList>();
const ManagerRootStack = createNativeStackNavigator();
const DriversStack = createNativeStackNavigator<ManagerDriversStackParamList>();
const ClientsStack = createNativeStackNavigator<ManagerClientsStackParamList>();
const OrdersStack = createNativeStackNavigator<ManagerOrdersStackParamList>();
const InvoicesStack = createNativeStackNavigator<ManagerInvoicesStackParamList>();

// ── Stack pour la section Réservations ──────────────────────────
function ManagerReservationsStack() {
  return (
    <ReservationsStack.Navigator screenOptions={{ headerShown: false }}>
      <ReservationsStack.Screen name="ManagerReservationsList" component={ManagerReservationsScreen} />
      <ReservationsStack.Screen name="ManagerReservationDetail" component={ManagerReservationDetailScreen} />
    </ReservationsStack.Navigator>
  );
}

function ManagerDriversStack() {
  return (
    <DriversStack.Navigator screenOptions={{ headerShown: false }}>
      <DriversStack.Screen name="DriversList" component={AdminDriversScreen as React.ComponentType<any>} />
      <DriversStack.Screen name="DriverDetail" component={AdminDriverDetailScreen as React.ComponentType<any>} />
    </DriversStack.Navigator>
  );
}

function ManagerClientsStack() {
  return (
    <ClientsStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientsStack.Screen name="ClientsList"  component={AdminClientsScreen as React.ComponentType<any>} />
      <ClientsStack.Screen name="ClientDetail" component={AdminClientDetailScreen as React.ComponentType<any>} />
    </ClientsStack.Navigator>
  );
}

function ManagerOrdersStack() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="ManagerOrdersList" component={AdminOrdersScreen as React.ComponentType<any>} />
      <OrdersStack.Screen name="OrderDetails"      component={AdminOrdersDetailScreen as React.ComponentType<any>} />
    </OrdersStack.Navigator>
  );
}

function ManagerInvoicesStack() {
  return (
    <InvoicesStack.Navigator screenOptions={{ headerShown: false }}>
      <InvoicesStack.Screen name="ManagerInvoicesList" component={AdminInvoicesScreen as React.ComponentType<any>} />
      <InvoicesStack.Screen name="InvoiceDetails"      component={AdminInvoiceDetailsScreen as React.ComponentType<any>} />
    </InvoicesStack.Navigator>
  );
}

function ManagerNotificationsStack() {
  return (
    <NotificationsStack.Navigator screenOptions={{ headerShown: false }}>
      <NotificationsStack.Screen name="ManagerNotificationList" component={NotificationsScreen} />
      <NotificationsStack.Screen name="NotificationDetails" component={NotificationDetailsScreen} />
    </NotificationsStack.Navigator>
  );
}

// ── Drawer custom avec items conditionnels selon permissions ─────

function ManagerDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout, localAvatarUri } = useAuth();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const { showAlert } = useAlert();
  const footerBottomInset = useBottomInset(styles.footer.paddingBottom);

  const handleLogout = () => {
    showAlert({title: 'Déconnexion', message: 'Voulez-vous vraiment vous déconnecter ?', buttons: [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: logout },
    ]});
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

        {hasAnyPermission('view_pricing') && (
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
      <View style={[styles.footer, { paddingBottom: footerBottomInset }]}>
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

// ── Navigator ────────────────────────────────────────────────────

function ManagerDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <ManagerDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="ManagerHome"         component={ManagerHomeScreen}         options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ManagerReservations" component={ManagerReservationsStack} options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      <Drawer.Screen name="ManagerDrivers"      component={ManagerDriversStack}   options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      <Drawer.Screen name="ManagerClients"      component={ManagerClientsStack}   options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      <Drawer.Screen name="ManagerOrders"       component={ManagerOrdersStack}    options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      <Drawer.Screen name="ManagerInvoices"     component={ManagerInvoicesStack}  options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      <Drawer.Screen name="ManagerDocuments"    component={AdminDocumentsScreen as React.ComponentType<any>}      options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      <Drawer.Screen name="ManagerProfile"      component={ManagerProfileScreen as React.ComponentType<any>}      options={{ drawerItemStyle: { display: 'none' }}} />
      <Drawer.Screen name="ManagerNotifications" component={ManagerNotificationsStack} options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      <Drawer.Screen name="BaseGrid"            component={AdminPricingScreen as React.ComponentType<any>}        options={{ drawerItemStyle: { display: 'none' }, headerShown: false, }} />
      <Drawer.Screen name="FlatRates"           component={AdminFlatRatesScreen as React.ComponentType<any>}      options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
    </Drawer.Navigator>
  );
}

export default function ManagerNavigator() {
  return (
    <ManagerRootStack.Navigator screenOptions={{ headerShown: false }}>
      <ManagerRootStack.Screen name="ManagerMain" component={ManagerDrawerNavigator} />
      <ManagerRootStack.Screen name="ManagerNotificationList" component={NotificationsScreen} />
      <ManagerRootStack.Screen name="NotificationDetails" component={NotificationDetailsScreen} />
    </ManagerRootStack.Navigator>
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
  name:        { color: Colors.white, fontSize: Fonts.size.md, fontFamily: Fonts.bold, fontWeight: '700' },
  role:        { color: 'rgba(255,255,255,0.7)', fontSize: Fonts.size.sm, marginTop: 2 },
  menu:        { paddingTop: Spacing.sm },
  item:        { marginVertical: -2 },
  subItem:     { marginLeft: Spacing.md },
  footer:      { padding: Spacing.lg, paddingBottom: Spacing.lg },
  divider:     { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  logoutText:  { color: Colors.error, fontSize: Fonts.size.md, fontFamily: Fonts.semibold, fontWeight: '600' },
  labelRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  labelText:   { fontSize: 16, color: Colors.textPrimary, fontFamily: Fonts.medium, fontWeight: '500', flex: 1 },
});
