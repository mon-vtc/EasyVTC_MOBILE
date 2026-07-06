import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, Alert, LayoutAnimation, Platform, UIManager
} from 'react-native';
import { useAlert } from '../hooks/useAlert';
import {
  DrawerContentScrollView,
  DrawerItem,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { Colors, Fonts, Spacing } from '../theme/colors';
import { AppIcon } from '../components/common/AppIcon';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function DrawerAccordion({
  title, icon, children,
}: {
  title: string;
  icon: React.ComponentProps<typeof AppIcon>['name'];
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  return (
    <View>
      <TouchableOpacity onPress={toggleOpen} style={styles.accordionHeader}>
        <View style={styles.labelRow}>
          <AppIcon name={icon} size={20} color={Colors.bordeauxDark} />
          <Text style={styles.labelText}>{title}</Text>
        </View>
        <AppIcon
          name={isOpen ? 'chevron-down-outline' : 'chevron-forward-outline'}
          size={20}
          color={Colors.bordeauxLight}
        />
      </TouchableOpacity>
      {isOpen && <View style={styles.accordionBody}>{children}</View>}
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.sectionHeader}>{title}</Text>
  );
}

// ── Item de menu — navigue vers une route de premier niveau du drawer,
//    en calculant lui-même l'état "actif" (DrawerItemList n'est plus utilisé) ──
function MenuItem({
  routeName, label, icon, badgeCount, props,
}: {
  routeName: string;
  label: string;
  icon: React.ComponentProps<typeof AppIcon>['name'];
  badgeCount?: number;
  props: DrawerContentComponentProps;
}) {
  const focused = props.state.routes[props.state.index]?.name === routeName;
  return (
    <DrawerItem
      label={() => <DrawerLabel icon={icon} label={label} badgeCount={badgeCount} />}
      focused={focused}
      onPress={() => props.navigation.navigate(routeName as never)}
      activeTintColor={Colors.bordeaux}
      inactiveTintColor={Colors.textPrimary}
      activeBackgroundColor={Colors.overlayLight}
      style={styles.menuItem}
    />
  );
}

export function DrawerLabel({ icon, label, badgeCount }: { icon: React.ComponentProps<typeof AppIcon>['name']; label: string; badgeCount?: number }) {
  return (
    <View style={styles.labelRow}>
      <View style={{ width: 24, alignItems: 'center' }}>
        <AppIcon name={icon} size={20} color={Colors.bordeauxDark} />
      </View>
      <Text style={styles.labelText}>{label}</Text>
      {badgeCount && badgeCount > 0 ? (
        <View style={styles.badge} />
      ) : null}
    </View>
  );
}

export default function DrawerContent(props: DrawerContentComponentProps) {
  const { user, logout, localAvatarUri } = useAuth();
  const { showAlert } = useAlert();
  const { unreadMessagesCount, unreadSupportCount } = useNotifications();

  const isAdmin  = user?.role === 'admin' || user?.role === 'manager';
  const isDriver = user?.role === 'driver';

  const handleLogout = () => {
    showAlert({title: 'Déconnexion', message: 'Voulez-vous vraiment vous déconnecter ?', buttons: [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: logout },
    ]});
  };

  const roleLabel: Record<string, string> = {
    client:  'Client',
    driver:  'Chauffeur',
    admin:   'Administrateur',
    manager: 'Gestionnaire',
  };

  return (
    <View style={styles.container}>

      {/* ── Profil header ── */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <View style={styles.avatarMiniature}>
            {(localAvatarUri ?? user?.profile_photo_url) ? (
              <Image
                source={{ uri: localAvatarUri ?? user?.profile_photo_url ?? undefined }}
                style={styles.avatarImage}
              />
            ) : (
              <AppIcon name="person-outline" color={styles.avatarText.color} size={32} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{user?.first_name} {user?.last_name}</Text>
            <Text style={styles.badgeText}>{roleLabel[user?.role ?? 'client']} VTC</Text>
          </View>
        </View>
      </View>

      {/* ── Items menu ── */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.menu}
        showsVerticalScrollIndicator={false}
      >
        {isDriver ? (
          <>
            
            {/* ── Mon activité ── */}
            <SectionHeader title="Mon activité" />
            <MenuItem props={props} routeName="DriverHome" label="Accueil" icon="home-outline" />
            <MenuItem props={props} routeName="DriverReservations" label="Mes courses" icon="car-outline" />
            <MenuItem props={props} routeName="DriverTrips" label="Planning" icon="calendar-outline" />
            <MenuItem props={props} routeName="DriverAvailability" label="Disponibilité" icon="watch-outline" />

            {/* ── Mes finances ── */}
            {/* <SectionHeader title="Mes finances" /> */}
            <MenuItem props={props} routeName="DriverRevenues" label="Revenus" icon="cash-outline" />
            <MenuItem props={props} routeName="DriverOrders" label="Bons de commande" icon="clipboard-outline" />
            <MenuItem props={props} routeName="DriverInvoices" label="Factures" icon="receipt-outline" />

            {/* ── Échanges ── */}
            <SectionHeader title="Échanges" />
            <MenuItem props={props} routeName="DriverMessages" label="Messages" icon="chatbubble-outline" badgeCount={unreadMessagesCount} />
            <MenuItem props={props} routeName="DriverNotifications" label="Notifications" icon="notifications-outline" />
            <MenuItem props={props} routeName="DriverSupport" label="Support" icon="headset-outline" badgeCount={unreadSupportCount} />

            {/* ── Mon profil ── */}
            <SectionHeader title="Mon profil" />
            <MenuItem props={props} routeName="DriverDocuments" label="Mes documents" icon="folder-open-outline" />
            <MenuItem props={props} routeName="DriverReviews" label="Mes évaluations" icon="star-outline" />
            <MenuItem props={props} routeName="DriverProfile" label="Mon compte" icon="person-circle-outline" />
          </>
        ) : (
          <>
            {/* ── Vue d'ensemble ── */}
            <SectionHeader title="Vue d'ensemble" />
            <MenuItem props={props} routeName="AdminHome" label="Accueil" icon="home-outline" />

            {/* ── Opérations ── */}
            {/* <SectionHeader title="Opérations" /> */}
            <MenuItem props={props} routeName="AdminReservations" label="Réservations" icon="car-outline" />
            <MenuItem props={props} routeName="AdminDiscussions" label="Supervision chats" icon="chatbubbles-outline" badgeCount={unreadMessagesCount} />


            {/* ── Utilisateurs ── */}
            {/* <SectionHeader title="Utilisateurs" /> */}
            <MenuItem props={props} routeName="AdminClients" label="Clients" icon="person-outline" />
            <MenuItem props={props} routeName="AdminManagers" label="Gestionnaires" icon="shield-checkmark-outline" />
            <MenuItem props={props} routeName="AdminDrivers" label="Chauffeurs" icon="car-sport-outline" />

            {/* ── Finances ── */}
            {/* <SectionHeader title="Finances" /> */}
            <MenuItem props={props} routeName="AdminOrders" label="Bons de commande" icon="clipboard-outline" />
            <MenuItem props={props} routeName="AdminInvoices" label="Factures" icon="receipt-outline" />
            {isAdmin && (
              <DrawerAccordion title="Tarification" icon="pricetag-outline">
                <DrawerItem
                  label="Grille de base"
                  onPress={() => props.navigation.navigate('BaseGrid')}
                  style={styles.subItem}
                  labelStyle={styles.subItemLabel}
                />
                <DrawerItem
                  label="Grille forfaitaire"
                  onPress={() => props.navigation.navigate('FlatRates')}
                  style={styles.subItem}
                  labelStyle={styles.subItemLabel}
                />
                <DrawerItem
                  label="Types de véhicule"
                  onPress={() => props.navigation.navigate('AdminVehicleTypes')}
                  style={styles.subItem}
                  labelStyle={styles.subItemLabel}
                />
                <DrawerItem
                  label="Règles de commission"
                  onPress={() => props.navigation.navigate('AdminCommissionSettings')}
                  style={styles.subItem}
                  labelStyle={styles.subItemLabel}
                />
              </DrawerAccordion>
            )}

            {/* ── Marketing ── */}
            {/* <SectionHeader title="Marketing" /> */}
            <MenuItem props={props} routeName="AdminPromoCommunication" label="Promo & Marketing" icon="megaphone-outline" />

            {/* ── Qualité & Conformité ── */}
            {/* <SectionHeader title="Qualité & Conformité" /> */}
            <MenuItem props={props} routeName="AdminReviews" label="Évaluations" icon="star-outline" />
            <MenuItem props={props} routeName="AdminDocuments" label="Documents chauffeurs" icon="folder-open-outline" />
            <MenuItem props={props} routeName="AdminStatistics" label="Statistiques" icon="stats-chart-outline" />
            <MenuItem props={props} routeName="AdminAuditLogs" label="Audit logs" icon="time-outline" />

            {/* ── Support ── */}
            <SectionHeader title="Support" />
            <MenuItem props={props} routeName="AdminSupport" label="Support" icon="headset-outline" badgeCount={unreadSupportCount} />

            {/* ── Compte ── */}
            <SectionHeader title="Compte" />
            <MenuItem props={props} routeName="AdminProfile" label="Mon compte" icon="person-circle-outline" />
            <MenuItem props={props} routeName="Notifications" label="Notifications" icon="notifications-outline" />
          </>
        )}
      </DrawerContentScrollView>

      {/* ── Footer logout ── */}
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

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.surface },
  header:          { backgroundColor: Colors.bordeaux, padding: Spacing.lg, paddingTop: Spacing.xxl, alignItems: 'center' },
  avatar:          { flexDirection: 'row', alignItems: 'center' },
  avatarMiniature: { width: 72, height: 72, borderRadius: 36, marginRight: Spacing.md, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  avatarImage:     { width: 72, height: 72, borderRadius: 36 },
  avatarText:      { color: Colors.placeHolder, fontSize: Fonts.size.xl, fontWeight: '800' },
  name:            { color: Colors.white, fontSize: Fonts.size.lg, fontWeight: '700' },
  badgeText:       { color: Colors.placeHolder, opacity: 0.8, marginTop: Spacing.xs },
  menu:            { paddingTop: Spacing.sm },
  sectionHeader:   { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.md, marginBottom: Spacing.xs, marginLeft: Spacing.lg },
  menuItem:        { marginVertical: -2 },
  footer:          { padding: Spacing.lg, paddingBottom: Spacing.lg },
  divider:         { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  logoutBtn:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  logoutText:      { color: Colors.error, fontSize: Fonts.size.md, fontWeight: '600' },
  labelRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  labelText:       { fontSize: 16, color: Colors.textPrimary, fontWeight: '500', flex: 1, marginLeft: 8 },
  accordionHeader: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 26, marginLeft: Spacing.sm, paddingVertical: 12 },
  accordionBody:   { paddingLeft: Spacing.xl },
  subItem:         { marginLeft: 26, marginVertical: -4 },
  subItemLabel:    { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  badge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.bordeauxLight,
  },
});