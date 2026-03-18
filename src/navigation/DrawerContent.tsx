import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useAuth } from '../hooks/useAuth';
import { Colors, Fonts, Spacing, Radius } from '../theme/colors';

export default function DrawerContent(props: DrawerContentComponentProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: logout },
    ]);
  };

  const roleLabel: Record<string, string> = {
    client:  '🧳 Client',
    driver:  '🚗 Chauffeur',
    admin:   '🔑 Administrateur',
    manager: '📋 Gestionnaire',
  };

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();

  return (
    <View style={styles.container}>
      {/* ── Profil header ── */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{roleLabel[user?.role ?? 'client']}</Text>
        </View>
      </View>

      {/* ── Items menu ── */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.menu}
        showsVerticalScrollIndicator={false}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* ── Footer logout ── */}
      <View style={styles.footer}>
        <View style={styles.divider} />
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
        <Text style={styles.version}>EasyVTC v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header: {
    backgroundColor: Colors.bordeaux,
    padding: Spacing.lg, paddingTop: Spacing.xxl,
    borderBottomRightRadius: 24, alignItems: 'center',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.beige, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm, borderWidth: 3, borderColor: Colors.beigeLight,
  },
  avatarText: { color: Colors.bordeauxDark, fontSize: Fonts.size.xl, fontWeight: '800' },
  name:       { color: Colors.white, fontSize: Fonts.size.lg, fontWeight: '700' },
  email:      { color: Colors.beigeLight, fontSize: Fonts.size.sm, marginTop: Spacing.xs },
  badge: {
    backgroundColor: Colors.beige, borderRadius: Radius.full,
    paddingVertical: 3, paddingHorizontal: Spacing.sm, marginTop: Spacing.sm,
  },
  badgeText: { color: Colors.bordeauxDark, fontSize: Fonts.size.xs, fontWeight: '700' },

  menu:    { paddingTop: Spacing.sm },
  footer:  { padding: Spacing.lg, paddingBottom: Spacing.xl },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  logoutIcon:{ fontSize: 20, marginRight: Spacing.sm },
  logoutText:{ color: Colors.error, fontSize: Fonts.size.md, fontWeight: '600' },
  version:   { color: Colors.textMuted, fontSize: Fonts.size.xs, textAlign: 'center', marginTop: Spacing.md },
});