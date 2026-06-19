import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerNavigationOptions } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppIcon } from '../components/common/AppIcon';
import DrawerContent, { DrawerLabel } from './DrawerContent';
import { Colors, Spacing }      from '../theme/colors';
import { Logo }        from '../constants/logo';

import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminDocumentsScreen from '../screens/admin/AdminDocumentsScreen';
import AdminPromoCommunicationScreen from '../screens/admin/AdminPromoCommunicationScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import AdminDriversScreen from '../screens/admin/drivers/AdminDriversScreen';
import AdminDriverDetailScreen from '../screens/admin/drivers/AdminDriverDetailScreen';
import AdminReservationsScreen from '../screens/admin/AdminReservationsScreen';
import AdminReservationScreen from '../screens/admin/AdminReservationScreen';
import AdminPricingScreen from '../screens/admin/AdminPricingScreen';
import AdminFlatRatesScreen from '../screens/admin/AdminFlatRatesScreen';
import AdminOrdersScreen from '../screens/admin/orders/AdminOrdersScreen';
import AdminInvoicesScreen from '../screens/admin/invoices/AdminInvoicesScreen';
import AdminOrdersDetailScreen from '../screens/admin/orders/OrderDetailsScreen';
import AdminInvoicesDetailScreen from '../screens/admin/invoices/InvoiceDetailsScreen';
import AdminClientsScreen from '../screens/admin/clients/AdminClientsScreen';
import AdminClientDetailScreen from '../screens/admin/clients/AdminClientDetailScreen';
import AdminVehicleTypesScreen from '../screens/admin/AdminVehicleTypesScreen';
import AdminReviewsScreen      from '../screens/admin/AdminReviewsScreen';
import AdminCommissionSettingsScreen from '../screens/admin/commissions/AdminCommissionSettingsScreen';
import AdminStatisticsScreen from '../screens/admin/AdminStatisticsScreen';

import ManagersListScreen from '../screens/admin/managers/ManagersListScreen';
import ManagerDetailScreen from '../screens/admin/managers/ManagerDetailScreen';
import CreateManagerScreen from '../screens/admin/managers/CreateManagerScreen';
import EditManagerScreen from '../screens/admin/managers/Editmanagerscreen';
import ManagerPermissionsScreen from '../screens/admin/managers/ManagerPermissionsScreen';
import NotificationDetailsScreen from '../screens/notifications/NotificationDetailsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import SupportListScreen from '../screens/support/SupportListScreen';
import SupportChatScreen from '../screens/support/SupportChatScreen';
import AdminDiscussionScreen from '../screens/admin/AdminDiscussionScreen';
import AdminChatScreen from '../screens/admin/AdminChatScreen';

import AdminAuditLogsScreen from '../screens/admin/AdminAuditLogsScreen';
import AdminAuditLogDetailScreen from '../screens/admin/AdminAuditLogDetailScreen';


import { useNotifications } from '../hooks/useNotifications';  


import type {
  AdminDrawerParamList,
  DriversStackParamList,
  ReservationsStackParamList,
  ClientsStackParamList,
  AdminInvoicesStackParamList,
  AdminOrderStackParamList,
  AdminNotificationsStackParamList,
  SupportStackParamList,
  DiscussionStackParamList,
  AdminAuditLogsStackParamList,
} from '../types/auth.types';

import type { ManagersStackParamList } from '../types';


const DriversStack = createNativeStackNavigator<DriversStackParamList>();
const ReservationsStack = createNativeStackNavigator<ReservationsStackParamList>();
const InvoicesStack = createNativeStackNavigator<AdminInvoicesStackParamList>();
const OrderStack = createNativeStackNavigator<AdminOrderStackParamList>();
const NotificationsStack = createNativeStackNavigator<AdminNotificationsStackParamList>();
const SupportStack = createNativeStackNavigator<SupportStackParamList>();

// Stack pour les discussions (supervision)
const DiscussionStack = createNativeStackNavigator<DiscussionStackParamList>();

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

// ── Stack pour la section Réservations ──────────────────────────
function AdminReservationsStack() {
  return (
    <ReservationsStack.Navigator screenOptions={{ headerShown: false }}>
      <ReservationsStack.Screen name="ReservationsList" component={AdminReservationsScreen} />
      <ReservationsStack.Screen name="AdminReservationDetail" component={AdminReservationScreen} />
    </ReservationsStack.Navigator>
  );
}

// ── Stack pour la section Notifications ──────────────────────────
function AdminNotificationsStack() {
  return (
    <NotificationsStack.Navigator screenOptions={{ headerShown: false }}>
      <NotificationsStack.Screen name="AdminNotificationList" component={NotificationsScreen} />
      <NotificationsStack.Screen name="NotificationDetails" component={NotificationDetailsScreen} />
    </NotificationsStack.Navigator>
  );
}

// ── Stack pour la section Factures ────────────────────────────

function AdminInvoicesStack() {
  return (
    <InvoicesStack.Navigator screenOptions={{ headerShown: false }}>
      <InvoicesStack.Screen name="AdminInvoicesList" component={AdminInvoicesScreen} />
      <InvoicesStack.Screen name="InvoiceDetails" component={AdminInvoicesDetailScreen} />
    </InvoicesStack.Navigator>
  );
}

function AdminOrdersStack() {
  return (
    <OrderStack.Navigator screenOptions={{ headerShown: false }}>
      <OrderStack.Screen name="AdminOrdersList" component={AdminOrdersScreen} />
      <OrderStack.Screen name="OrderDetails" component={AdminOrdersDetailScreen} />
    </OrderStack.Navigator>
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

const ClientsStack = createNativeStackNavigator<ClientsStackParamList>();

function AdminClientsNavigator() {
  return (
    <ClientsStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientsStack.Screen name="ClientsList"  component={AdminClientsScreen}       />
      <ClientsStack.Screen name="ClientDetail" component={AdminClientDetailScreen}  />
    </ClientsStack.Navigator>
  );
}

const ManagersStack = createNativeStackNavigator<ManagersStackParamList>();

function AdminManagersNavigator() {
  return (
    <ManagersStack.Navigator
      initialRouteName="ManagersList"
      screenOptions={{ headerShown: false }}
    >
      <ManagersStack.Screen name="ManagersList"        component={ManagersListScreen} />
      <ManagersStack.Screen name="CreateManager"       component={CreateManagerScreen} />
      <ManagersStack.Screen name="EditManager"         component={EditManagerScreen} />
      <ManagersStack.Screen name="ManagerDetail"       component={ManagerDetailScreen} />
      <ManagersStack.Screen name="ManagerPermissions"  component={ManagerPermissionsScreen} />
     
    </ManagersStack.Navigator>
  );
}

// ── Stack pour la section Support ───────────────────────────────
function AdminSupportStack() {
  return (
    <SupportStack.Navigator screenOptions={{ headerShown: false }}>
      <SupportStack.Screen name="SupportList" component={SupportListScreen} />
      <SupportStack.Screen name="SupportChat" component={SupportChatScreen} />
    </SupportStack.Navigator>
  );
}

// ── Stack pour la section Discussions (Supervision) ───────────────
function AdminDiscussionStack() {
  return (
    <DiscussionStack.Navigator screenOptions={{ headerShown: false }}>
      <DiscussionStack.Screen name="AdminDiscussionList" component={AdminDiscussionScreen} />
      <DiscussionStack.Screen name="AdminChatScreen" component={AdminChatScreen} />
    </DiscussionStack.Navigator>
  );
}

const AuditLogsStack = createNativeStackNavigator<AdminAuditLogsStackParamList>();

function AdminAuditLogsNavigator() {
  return (
    <AuditLogsStack.Navigator screenOptions={{ headerShown: false }}>
      <AuditLogsStack.Screen name="AdminAuditLogsList" component={AdminAuditLogsScreen} />
      <AuditLogsStack.Screen name="AdminAuditLogDetail" component={AdminAuditLogDetailScreen} />
    </AuditLogsStack.Navigator>
  );
}



// ── Drawer ──────────────────────────────────────────────────────
const Drawer = createDrawerNavigator<AdminDrawerParamList>();

export default function AdminNavigator() {
  const { unreadCount, unreadMessagesCount, unreadSupportCount } = useNotifications();

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
      <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
        <AppIcon name="notifications-outline" size={26} color={Colors.white} />
        {unreadCount > 0 && (
          <View style={styles.notifBadge}>
            <Text style={styles.notifText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    ),
  
    drawerStyle:               { backgroundColor: Colors.surface, width: 280 },
    drawerActiveTintColor:     Colors.bordeaux,
    drawerInactiveTintColor:   Colors.textSecondary,
    drawerActiveBackgroundColor: Colors.overlayLight,
  });
  
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
        name="Notifications"
        component={AdminNotificationsStack}
        options={{ drawerLabel: () => <DrawerLabel icon="notifications-outline" label="Notifications" /> }}
      />

      <Drawer.Screen
        name="AdminReservations"
        component={AdminReservationsStack}
        options={{
          drawerLabel: () => <DrawerLabel icon="car-outline" label="Réservations" />,
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="AdminDiscussions"
        component={AdminDiscussionStack}
        options={{ drawerLabel: () => <DrawerLabel icon="chatbubbles-outline" label="Supervision chats" badgeCount={unreadMessagesCount} /> }}
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
        name="AdminManagers"
        component={AdminManagersNavigator}
        options={{
          drawerLabel: () => <DrawerLabel icon="people-outline" label="Gestionnaires" />,
          headerShown: false,
        }}
      />


     <Drawer.Screen
        name="AdminClients"
        component={AdminClientsNavigator}
        options={{
          drawerLabel: () => <DrawerLabel icon="people-outline" label="Clients" />,
          headerShown: false,
        }}
      />


      <Drawer.Screen
        name="AdminSupport"
        component={AdminSupportStack}
        options={{ drawerLabel: () => <DrawerLabel icon="headset-outline" label="Support" badgeCount={unreadSupportCount} />, headerShown: false }}
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
        name="AdminAuditLogs"
        component={AdminAuditLogsNavigator}
        options={{
          drawerLabel: () => <DrawerLabel icon="document-text-outline" label="Audit logs" />,
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="AdminPromoCommunication"
        component={AdminPromoCommunicationScreen}
        options={{
          drawerLabel: () => <DrawerLabel icon="pricetag-outline" label="Promo & Communication" />,
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="BaseGrid"
        component={AdminPricingScreen}
        options={{
          drawerItemStyle: { display: 'none' }, // Masqué de la liste principale
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="FlatRates"
        component={AdminFlatRatesScreen}
        options={{
          drawerItemStyle: { display: 'none' }, // Masqué de la liste principale
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="AdminVehicleTypes"
        component={AdminVehicleTypesScreen}
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="AdminOrders"
        component={AdminOrdersStack}
        options={{
          drawerLabel: () => <DrawerLabel icon="document-text-outline" label="Bons de commande" />,
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="AdminInvoices"
        component={AdminInvoicesStack}
        options={{ 
          drawerLabel: () => <DrawerLabel icon="receipt-outline" label="Factures" /> ,
          headerShown: false,
        }}
      />
      
      <Drawer.Screen
        name="AdminReviews"
        component={AdminReviewsScreen}
        options={{ drawerLabel: () => <DrawerLabel icon="star-outline" label="Évaluations" /> }}
      />

      <Drawer.Screen
        name="AdminStatistics"
        component={AdminStatisticsScreen}
        options={{ 
          drawerLabel: () => <DrawerLabel icon="stats-chart-outline" label="Statistiques" /> ,
          headerShown: false,
        }}

      />

      <Drawer.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{ drawerLabel: () => <DrawerLabel icon="person-outline" label="Mon compte" /> }}
      />
      <Drawer.Screen
        name="AdminCommissionSettings"
        component={AdminCommissionSettingsScreen}
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }} // Pas de label dans le drawer, accès uniquement via la section Tarification
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  labelRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  labelText: { fontSize: 16, color: Colors.textPrimary, flex: 1 },
    headerIcons:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginRight: 20},
    iconBtn:      { position: 'relative', padding: 6,borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', marginRight: 20 },
    notifBadge: {
      position:        'absolute',
      top:             2, right: 2,
      backgroundColor: '#FF5252',
      borderRadius:    8,
      minWidth:        16, height: 16,
      alignItems:      'center',
      justifyContent:  'center',
      paddingHorizontal: 3,
    },
    notifText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
  
});