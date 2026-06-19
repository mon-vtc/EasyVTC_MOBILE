import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, Alert, LayoutAnimation, Platform, UIManager
} from 'react-native';
import { useAlert } from '../hooks/useAlert';
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useAuth } from '../hooks/useAuth';
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

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

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
        {/* Items standards du navigator (home, chauffeurs, documents, profil...) */}
        <DrawerItemList {...props} />

        {/*  Tarification — uniquement pour admin et manager */}
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