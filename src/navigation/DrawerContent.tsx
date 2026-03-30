import React, {useState} from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useAuth } from '../hooks/useAuth';
import { Colors, Fonts, Spacing, Radius } from '../theme/colors';
import { AppIcon } from '../components/common/AppIcon';

export default function DrawerContent(props: DrawerContentComponentProps) {
  const { user, logout , localAvatarUri} = useAuth();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: logout },
    ]);
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
            <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
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
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* ── Footer logout ── */}
      <View style={styles.footer}>
        <View style={styles.divider} />
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutIcon}><AppIcon name="log-out-outline" color={styles.logoutIcon.color} /></Text>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header: {
    backgroundColor: Colors.bordeaux,
    padding: Spacing.lg, paddingTop: Spacing.xxl,
    alignItems: 'center',
  },
  avatar: {
    flexDirection: 'row', alignItems: 'center', 
  },

  avatarMiniature: {width: 72, height: 72, borderRadius: 36, marginRight: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },

  avatarImage: {width: 72, height: 72, borderRadius: 36},
  
  avatarText: { color: Colors.placeHolder, fontSize: Fonts.size.xl, fontWeight: '800' },
  name:       { color: Colors.white, fontSize: Fonts.size.lg, fontWeight: '700' },
  
  badgeText: {  color: Colors.placeHolder, opacity: 0.8, marginTop:Spacing.xs },

  menu:    { paddingTop: Spacing.sm },
  footer:  { padding: Spacing.lg, paddingBottom: Spacing.lg },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  logoutIcon:{ fontSize: 20, marginRight: Spacing.sm, color: Colors.error },
  logoutText:{ color: Colors.error, fontSize: Fonts.size.md, fontWeight: '600' },
  version:   { color: Colors.textMuted, fontSize: Fonts.size.xs, textAlign: 'center', marginTop: Spacing.md },
});