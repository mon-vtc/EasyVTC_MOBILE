import React from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet,
  TouchableOpacity, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { Colors, Spacing, Radius, Fonts } from '../../theme/colors';
import type { ManagerDrawerParamList } from '../../types';
import { AppHeader } from '../../components/common/AppHeader';

type Nav = DrawerNavigationProp<ManagerDrawerParamList>;

interface TileProps {
  icon: string;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
  testID?: string;
}

function Tile({ icon, label, color, bg, onPress, testID }: TileProps) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.7} testID={testID}>
      <View style={[styles.tileIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={26} color={color} />
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ManagerHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const tiles = [
    {
      icon:    'car-outline',
      label:   'Réservations',
      color:   '#1976D2',
      bg:      '#E3F2FD',
      perm:    'view_reservations' as const,
      screen:  'ManagerReservations' as keyof ManagerDrawerParamList,
    },
    {
      icon:    'person-outline',
      label:   'Chauffeurs',
      color:   '#388E3C',
      bg:      '#E8F5E9',
      perm:    'view_drivers' as const,
      screen:  'ManagerDrivers' as keyof ManagerDrawerParamList,
    },
    {
      icon:    'people-outline',
      label:   'Clients',
      color:   '#F57C00',
      bg:      '#FFF3E0',
      perm:    'view_clients' as const,
      screen:  'ManagerClients' as keyof ManagerDrawerParamList,
    },
    {
      icon:    'pricetag-outline',
      label:   'Tarifs',
      color:   '#7B1FA2',
      bg:      '#F3E5F5',
      perm:    'view_pricing' as const,
      screen:  'BaseGrid' as keyof ManagerDrawerParamList,
    },
    {
      icon:    'document-text-outline',
      label:   'Bons de commande',
      color:   '#00796B',
      bg:      '#E0F2F1',
      perm:    'view_orders' as const,
      screen:  'ManagerOrders' as keyof ManagerDrawerParamList,
    },
    {
      icon:    'receipt-outline',
      label:   'Factures',
      color:   '#C62828',
      bg:      '#FFEBEE',
      perm:    'view_invoices' as const,
      screen:  'ManagerInvoices' as keyof ManagerDrawerParamList,
    },
    {
      icon:    'folder-open-outline',
      label:   'Documents',
      color:   '#0277BD',
      bg:      '#E1F5FE',
      perm:    'view_documents' as const,
      screen:  'ManagerDocuments' as keyof ManagerDrawerParamList,
    },
  ].filter(t => hasPermission(t.perm));

  return (
    <View style={{ flex: 1 }}>
      <AppHeader
        left="menu"
        logo
        rightIcon={{
          name: 'notifications-outline',
          onPress: () => navigation.getParent()?.navigate('ManagerNotificationList' as never),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} testID="manager-home-scroll">
      {/* Bandeau bienvenue */}
      <View style={styles.banner}>
        <View style={styles.bannerAvatar}>
          {user?.profile_photo_url ? (
            <Image source={{ uri: user.profile_photo_url }} style={styles.bannerAvatarImage} />
          ) : (
            <Ionicons name="person-outline" size={28} color={Colors.white} />
          )}
        </View>
        <View style={styles.bannerText}>
          <Text style={styles.bannerGreeting}>Bonjour,</Text>
          <Text style={styles.bannerName}>{user?.first_name} {user?.last_name}</Text>
          <Text style={styles.bannerRole}>Gestionnaire VTC</Text>
        </View>
      </View>

      {tiles.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>Aucun accès configuré</Text>
          <Text style={styles.emptyText}>
            Contactez votre administrateur pour obtenir des permissions.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Mes modules</Text>
          <View style={styles.grid}>
            {tiles.map(t => (
              <Tile
                key={t.screen}
                icon={t.icon}
                label={t.label}
                color={t.color}
                bg={t.bg}
                onPress={() => navigation.navigate(t.screen as any)}
                testID={`manager-tile-${t.label.toLowerCase().replace(/\s/g, '-')}`}
              />
            ))}
          </View>
        </>
      )}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { padding: Spacing.md, paddingBottom: Spacing.xl },

  banner: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.bordeaux,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    marginBottom:    Spacing.md,
    gap:             Spacing.md,
  },
  bannerAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerAvatarImage: { width: 52, height: 52, borderRadius: 26 },
  bannerText:     { flex: 1 },
  bannerGreeting: { fontSize: Fonts.size.sm, color: 'rgba(255,255,255,0.7)' },
  bannerName:     { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.white },
  bannerRole:     { fontSize: Fonts.size.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  sectionTitle: {
    fontSize: Fonts.size.md, fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.textPrimary, marginBottom: Spacing.sm,
  },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
  },
  tile: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    gap: Spacing.sm,
  },
  tileIcon: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  tileLabel: {
    fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.textPrimary, textAlign: 'center',
  },

  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    gap: Spacing.md, paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textSecondary },
  emptyText:  { fontSize: Fonts.size.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 260 },
});
