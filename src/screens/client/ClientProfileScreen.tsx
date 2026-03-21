import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Platform, Alert,
} from 'react-native';
import { Ionicons }  from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAuth }   from '../../hooks/useAuth';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { ClientTabParamList }   from '../../types/auth.types';

import { Logo } from '../../constants/logo';

type Props = BottomTabScreenProps<ClientTabParamList, 'ClientProfile'>;

export default function ClientProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [editMode, setEditMode]   = useState(false);
  const [notifPromo, setNotifPromo] = useState(true);

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Voulez-vous vraiment supprimer votre compte ?',
      [
        { text: 'Annuler',   style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={styles.flex}>

      {/* ── Header bordeaux ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image source={Logo.LogoEasyVTC} style={{ width: 40, height: 40 }} />
        </View>

        <TouchableOpacity style={styles.headerBtn} onPress={() => setEditMode(!editMode)}>
          <Ionicons
            name={editMode ? 'checkmark-outline' : 'pencil-outline'}
            size={20}
            color={Colors.white}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            {initials ? (
              <Text style={styles.avatarInitials}>{initials}</Text>
            ) : (
              <Ionicons name="person-outline" size={40} color={Colors.textMuted} />
            )}
          </View>
          {editMode && (
            <TouchableOpacity style={styles.avatarEditBtn}>
              <Text style={styles.avatarEditText}>Modifier la photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Champs infos ── */}
        <View style={styles.formSection}>
          <View style={styles.formSectionContainer}>
            <ProfileField label="Prénom"    value={user?.first_name ?? 'Jean'}                   editable={editMode} />
            <ProfileField label="Nom"       value={user?.last_name  ?? 'Dupont'}                  editable={editMode} />
            <ProfileField label="Email"     value={user?.email      ?? 'jean.dupont@email.com'}   editable={false}    />
            <ProfileField label="Téléphone" value={user?.phone      ?? '+33 6 12 34 56 78'}       editable={editMode} keyboardType="phone-pad" />
          </View>
        </View>

        {/* ── Préférences ── */}
        <View style={styles.section}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Préférences</Text>

            <View style={styles.prefRow}>
              <View style={styles.prefText}>
                  <Text style={styles.prefLabel}>Notifications publicitaires</Text>
                  <Text style={styles.prefSub}>Recevoir des offres et promotions</Text>
                </View>
                <Switch
                  value={notifPromo}
                  onValueChange={setNotifPromo}
                  trackColor={{ false: Colors.border, true: Colors.bordeauxLight }}
                  thumbColor={Colors.white}
                />
              </View>
            </View>
        </View>

        {/* ── Actions ── */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.actionLabel}>Changer le mot de passe</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={() => {
            Alert.alert(
              'Déconnexion',
              'Voulez-vous vraiment vous déconnecter ?',
              [
                { text: 'Annuler',      style: 'cancel' },
                { text: 'Déconnecter', style: 'destructive', onPress: logout },
              ]
            );
          }}>
            <View style={styles.actionLeft}>
              <Ionicons name="log-out-outline" size={20} color={Colors.bordeaux} />
              <Text style={[styles.actionLabel, { color: Colors.bordeaux }]}>
                Se déconnecter
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.bordeaux} />
          </TouchableOpacity>

          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow} onPress={handleDeleteAccount}>
            <View style={styles.actionLeft}>
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
              <Text style={[styles.actionLabel, { color: Colors.error }]}>
                Supprimer mon compte
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

// ── Composant champ profil ──────────────────────────────────────
function ProfileField({
  label, value, editable, keyboardType,
}: {
  label: string;
  value: string;
  editable: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
}) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={[fieldStyles.input, !editable && fieldStyles.inputDisabled]}>
        <Text style={[fieldStyles.value, !editable && fieldStyles.valueDisabled]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper:       { marginBottom: Spacing.md, },
  label:         { fontSize: Fonts.size.sm, color: Colors.textCallToAction, marginBottom: Spacing.xs },
  input: {
    borderWidth:       1,
    borderColor:       Colors.border,
    borderRadius:      Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    backgroundColor:   Colors.surface,
  },
  inputDisabled: { backgroundColor: Colors.placeHolder ?? '#F9F9F9' },
  value:         { fontSize: Fonts.size.md, color: Colors.textPlaceholder },
  valueDisabled: { color: Colors.textPlaceholder },
});

// ── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   Colors.bordeaux,
    paddingTop:        Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
    paddingBottom:     Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerBtn:    { padding: Spacing.sm },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  headerTitle:  { color: Colors.white, fontWeight: '700', fontSize: Fonts.size.md },

  scroll: { paddingBottom: Spacing.xxl },

  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarCircle: {
    width:           80, height: 80,
    borderRadius:    40,
    backgroundColor: Colors.beigeLight ?? '#F0EAE8',
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarInitials: {
    fontSize:   Fonts.size.xl,
    fontWeight: '800',
    color:      Colors.bordeaux,
  },
  avatarEditBtn:  { marginTop: Spacing.sm },
  avatarEditText: { color: Colors.bordeaux, fontSize: Fonts.size.sm, fontWeight: '600' },

  // Form
  formSection: { paddingHorizontal: Spacing.lg},
  formSectionContainer: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.md,
  },

  // Préférences
  section:      { paddingHorizontal: Spacing.lg, marginTop: Spacing.sm, },
  sectionTitle: {
    fontSize:     Fonts.size.md,
    fontWeight:   '800',
    color:        Colors.bordeaux,
    marginBottom: Spacing.sm,
  },

  sectionContainer: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.md,
  },
  prefRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingVertical: Spacing.sm,
  },
  prefText:  { flex: 1, paddingRight: Spacing.md },
  prefLabel: { fontSize: Fonts.size.md, color: Colors.textPrimary, fontWeight: '500' },
  prefSub:   { fontSize: Fonts.size.xs, color: Colors.textCallToAction, marginTop: 2 },

  // Actions
  actionsSection: {
    marginTop:         Spacing.md,
    marginHorizontal:  Spacing.lg,
    backgroundColor:   Colors.surface,
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       Colors.border,
    paddingHorizontal: Spacing.md,
  },
  actionRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actionLabel: { fontSize: Fonts.size.md, color: Colors.textPrimary, fontWeight: '500' },
  divider: { height: 1, backgroundColor: Colors.border },
});