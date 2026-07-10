// screens/admin/managers/Editmanagerscreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useToast } from '../../../hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../../hooks/useAdmin';
import { AppInput } from '../../../components/common/AppInput';
import { AppButton } from '../../../components/common/AppButton';
import { Colors, Spacing, Radius, Fonts } from '../../../theme/colors';
import type { UserProfile } from '../../../types';
import ChangeStatusModal from '../../../components/common/ChangeStatusModal';

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Standard' },
  { value: 2, label: 'Prioritaire' },
  { value: 3, label: 'Haute priorité' },
];

export default function EditManagerScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { managerId } = route.params as { managerId: string };

  const { fetchManagerById, updateManager, changeManagerStatus } = useAdmin();
  const { showToast } = useToast();

  const [manager,      setManager]      = useState<UserProfile | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isSaving,     setIsSaving]     = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Champs éditables
  const [firstName,     setFirstName]     = useState('');
  const [lastName,      setLastName]      = useState('');
  const [phone,         setPhone]         = useState('');
  const [coverageZone,  setCoverageZone]  = useState('');
  const [priorityLevel, setPriorityLevel] = useState<number | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchManagerById(managerId);
        if (data) {
          setManager(data);
          setFirstName(data.first_name);
          setLastName(data.last_name);
          setPhone(data.phone ?? '');
          setCoverageZone(data.coverage_zone ?? '');
          setPriorityLevel(data.priority_level ?? null);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [managerId]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'Le prénom est requis';
    if (!lastName.trim())  e.lastName  = 'Le nom est requis';
    if (phone.trim() && !/^\+?[1-9]\d{7,14}$/.test(phone.trim())) {
      e.phone = 'Format international attendu (ex : +33612345678)';
    }
    if (coverageZone.trim() && coverageZone.trim().length < 2) {
      e.coverageZone = 'La zone de couverture doit comporter au moins 2 caractères';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!manager || !validate()) return;
    setIsSaving(true);
    try {
      const updated = await updateManager(manager.id, {
        first_name:    firstName.trim(),
        last_name:     lastName.trim(),
        ...(phone.trim()         ? { phone: phone.trim() }                   : {}),
        ...(coverageZone.trim()  ? { coverage_zone: coverageZone.trim() }    : {}),
        ...(priorityLevel !== null ? { priority_level: priorityLevel }       : {}),
      });
      if (updated) setManager(updated);
      showToast({ title: 'Succès', message: 'Les informations du gestionnaire ont été mises à jour.', type: 'success' });
      navigation.goBack();
    } catch (err: any) {
      showToast({ title: 'Erreur', message: err.message || 'Une erreur est survenue', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (
    newStatus: 'active' | 'inactive' | 'locked',
    reason: string,
  ) => {
    if (!manager) return;
    setIsSaving(true);
    try {
      const updated = await changeManagerStatus(manager.id, { status: newStatus, reason });
      if (updated) setManager(updated);
      setModalVisible(false);
      showToast({ title: 'Succès', message: 'Le statut du gestionnaire a été mis à jour.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Erreur', message: err.message || 'Une erreur est survenue', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
      </View>
    );
  }

  if (!manager) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-outline" size={48} color={Colors.border} />
        <Text style={styles.errorText}>Gestionnaire introuvable.</Text>
      </View>
    );
  }

  const initials    = `${manager.first_name?.[0] ?? ''}${manager.last_name?.[0] ?? ''}`.toUpperCase();
  const isActive    = manager.status === 'active';
  const statusLabel = isActive ? 'Actif' : manager.status === 'locked' ? 'Suspendu' : 'Inactif';
  const statusColor = isActive ? '#2E7D32' : manager.status === 'locked' ? '#C62828' : '#E65100';
  const statusBg    = isActive ? '#E8F5E9' : manager.status === 'locked' ? '#f5e2e2' : '#FFF3E0';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le gestionnaire</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Bandeau identité */}
      <View style={styles.identityBanner}>
        {manager.profile_photo_url ? (
          <Image source={{ uri: manager.profile_photo_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
        <View>
          <Text style={styles.bannerName}>{manager.first_name} {manager.last_name}</Text>
          <Text style={styles.bannerRole}>Gestionnaire · {manager.email}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Identité */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={18} color={Colors.bordeauxLight} />
            <Text style={styles.sectionTitle}>Identité</Text>
          </View>
          <AppInput
            label="Prénom *"
            value={firstName}
            onChangeText={setFirstName}
            error={errors.firstName}
            autoCapitalize="words"
          />
          <AppInput
            label="Nom *"
            value={lastName}
            onChangeText={setLastName}
            error={errors.lastName}
            autoCapitalize="words"
          />
          <AppInput
            label="Téléphone"
            placeholder="+33612345678"
            value={phone}
            onChangeText={setPhone}
            error={errors.phone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Périmètre */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="map-outline" size={18} color={Colors.bordeauxLight} />
            <Text style={styles.sectionTitle}>Périmètre d'action</Text>
          </View>

          <AppInput
            label="Zone de couverture"
            placeholder="Ex : Île-de-France, Dakar Nord…"
            value={coverageZone}
            onChangeText={setCoverageZone}
            error={errors.coverageZone}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>Niveau de priorité</Text>
          <View style={styles.priorityRow}>
            {PRIORITY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.priorityOption,
                  priorityLevel === opt.value && styles.priorityOptionSelected,
                ]}
                onPress={() => setPriorityLevel(priorityLevel === opt.value ? null : opt.value)}
                activeOpacity={0.75}
              >
                <Text style={[
                  styles.priorityOptionText,
                  priorityLevel === opt.value && styles.priorityOptionTextSelected,
                ]}>
                  {opt.value} — {opt.label}
                </Text>
                {priorityLevel === opt.value && (
                  <Ionicons name="checkmark" size={16} color={Colors.bordeaux} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Statut */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-outline" size={18} color={Colors.bordeauxLight} />
            <Text style={styles.sectionTitle}>Statut du compte</Text>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            <TouchableOpacity
              style={styles.changeStatusBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="swap-horizontal-outline" size={16} color={Colors.bordeaux} />
              <Text style={styles.changeStatusText}>Modifier</Text>
            </TouchableOpacity>
          </View>

          {manager.status_reason ? (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Motif actuel</Text>
              <Text style={styles.reasonValue}>{manager.status_reason}</Text>
            </View>
          ) : null}
        </View>

        <AppButton
          label="Enregistrer les modifications"
          onPress={handleSave}
          loading={isSaving}
          style={styles.button}
        />
      </ScrollView>

      <ChangeStatusModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleStatusChange}
        currentStatus={manager.status}
        userName={`${manager.first_name} ${manager.last_name}`}
        isSaving={isSaving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  errorText:   { fontSize: Fonts.size.md, color: Colors.textMuted },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   Colors.bordeaux,
    paddingTop:        Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
    paddingBottom:     Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerBtn:   { padding: Spacing.sm, width: 40 },
  headerTitle: { fontSize: Fonts.size.lg, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.white },

  identityBanner: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.md,
    backgroundColor:   Colors.bordeaux,
    paddingHorizontal: Spacing.md,
    paddingBottom:     Spacing.lg,
  },
  avatar:         { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.white },
  bannerName:     { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.white },
  bannerRole:     { fontSize: Fonts.size.xs, color: Colors.beigeLight, marginTop: 2 },

  scroll:  { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.md },

  sectionCard: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, gap: Spacing.sm,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  sectionTitle:  { fontSize: Fonts.size.md, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.bordeauxDark },

  fieldLabel: {
    fontSize:    Fonts.size.sm,
    fontFamily: Fonts.semibold, fontWeight:  '600',
    color:       Colors.textSecondary,
    marginBottom: 4,
  },
  priorityRow:   { gap: Spacing.xs },
  priorityOption: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   10,
    paddingHorizontal: Spacing.md,
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       Colors.border,
    backgroundColor:   Colors.white,
  },
  priorityOptionSelected: {
    borderColor:     Colors.bordeaux,
    backgroundColor: Colors.overlayLight,
  },
  priorityOptionText: {
    fontSize:   Fonts.size.sm,
    fontFamily: Fonts.medium, fontWeight: '500',
    color:      Colors.textSecondary,
    flex:       1,
  },
  priorityOptionTextSelected: {
    color:      Colors.bordeaux,
    fontFamily: Fonts.bold, fontWeight: '700',
  },

  statusRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderRadius: Radius.full,
  },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600' },

  changeStatusBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeStatusText: { fontSize: Fonts.size.sm, color: Colors.bordeaux, fontFamily: Fonts.medium, fontWeight: '500' },

  reasonBox: {
    backgroundColor: Colors.beigeLight,
    borderRadius:    Radius.sm,
    padding:         Spacing.sm,
    gap:             4,
  },
  reasonLabel: { fontSize: Fonts.size.xs, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textSecondary },
  reasonValue: { fontSize: Fonts.size.sm, color: Colors.textPrimary },

  button: { marginTop: Spacing.xs },
});
