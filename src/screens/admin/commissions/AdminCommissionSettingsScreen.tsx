// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — AdminCommissionSettingsScreen
// Sprint 6 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, Switch, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useCommissionSettings } from '../../../hooks/useCommissionSettings';
import { useVehicleTypes } from '../../../hooks/useVehicleTypes';
import { useToast } from '../../../hooks/useToast';
import type { CommissionSetting, CommissionZone, CommissionRateType } from '../../../types';
import { AppIcon } from '../../../components/common/AppIcon';
import { AppButton } from '../../../components/common/AppButton';
import { Colors, Fonts, Radius, Spacing } from '../../../theme/colors';
import { Picker } from '@react-native-picker/picker';

// ── Schéma de validation du formulaire ────────────────────────────────────────
const formSchema = z.object({
  label: z.string().min(3, 'Le libellé est requis (min 3 caractères).'),
  zone: z.enum(['france', 'senegal']),
  vehicle_type: z.string().nullable(),
  rate_type: z.enum(['percentage', 'flat']),
  rate_value: z.preprocess(
    (val) => parseFloat(String(val).replace(',', '.')),
    z.number().min(0, 'La valeur doit être positive.'),
  ),
  is_active: z.boolean(),
});
type CommissionFormValues = z.infer<typeof formSchema>;

// ── Composant principal ───────────────────────────────────────────────────────
export default function AdminCommissionSettingsScreen() {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const {
    settings,
    isLoading,
    isSaving,
    error,
    fetchSettings,
    createSetting,
    updateSetting,
    deleteSetting,
    clearError,
  } = useCommissionSettings();

  const { allTypes: vehicleTypes, refresh: fetchVehicleTypes } = useVehicleTypes();

  // ── États locaux ────────────────────────────────────────────────────────────
  const [activeZone, setActiveZone] = useState<CommissionZone>('france');
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingSetting, setEditingSetting] = useState<CommissionSetting | null>(null);

  // ── Formulaire (react-hook-form) ────────────────────────────────────────────
  const { control, handleSubmit, reset, formState: { errors } } = useForm<CommissionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: '',
      zone: activeZone,
      vehicle_type: null,
      rate_type: 'percentage',
      rate_value: 0,
      is_active: true,
    },
  });

  // ── Effets ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchSettings({ zone: activeZone });
  }, [activeZone, fetchSettings]);

  useEffect(() => {
    fetchVehicleTypes();
  }, [fetchVehicleTypes]);

  useEffect(() => {
    if (error) {
      
      Alert.alert('Erreur', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const openModalForCreate = () => {
    setEditingSetting(null);
    reset({
      label: '',
      zone: activeZone,
      vehicle_type: null,
      rate_type: 'percentage',
      rate_value: 0,
      is_active: true,
    });
    setModalVisible(true);
  };

  const openModalForEdit = (setting: CommissionSetting) => {
    setEditingSetting(setting);
    reset({
      label: setting.label,
      zone: setting.zone,
      vehicle_type: setting.vehicle_type,
      rate_type: setting.rate_type,
      rate_value: setting.rate_value,
      is_active: setting.is_active,
    });
    setModalVisible(true);
  };

  const handleSave = async (data: CommissionFormValues) => {
    try {
      if (editingSetting) {
        await updateSetting(editingSetting.id, data);
        showToast({ type: 'success', message: 'Règle de commission mise à jour.' });
      } else {
        await createSetting(data);
        showToast({ type: 'success', message: 'Nouvelle règle de commission créée.' });
      }
      setModalVisible(false);
      fetchSettings({ zone: activeZone }); // Re-fetch
    } catch (e: any) {
      showToast({ type: 'error', message: e.message ?? 'Erreur de sauvegarde' });
    }
  };

  const handleDelete = (setting: CommissionSetting) => {
    Alert.alert(
      'Supprimer la règle',
      `Êtes-vous sûr de vouloir supprimer la règle "${setting.label}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSetting(setting.id);
              showToast({ type: 'success', message: 'Règle supprimée.' });
              fetchSettings({ zone: activeZone }); // Re-fetch
            } catch (e: any) {
              showToast({ type: 'error', message: e.message ?? 'Erreur de suppression' });
            }
          },
        },
      ],
    );
  };

  // ── Rendu ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <AppIcon name="arrow-back-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Règles de Commission</Text>
        <TouchableOpacity onPress={openModalForCreate} style={styles.headerBtn}>
          <AppIcon name="add-outline" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        {/* Sélecteur de zone */}
        <View style={styles.zoneSelector}>
          {(['france', 'senegal'] as CommissionZone[]).map((zone) => (
            <TouchableOpacity
              key={zone}
              style={[styles.zoneTab, activeZone === zone && styles.zoneTabActive]}
              onPress={() => setActiveZone(zone)}
            >
              <Text style={[styles.zoneText, activeZone === zone && styles.zoneTextActive]}>
                {zone === 'france' ? 'France' : 'Sénégal'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Liste des règles */}
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.bordeaux} style={{ marginTop: 40 }} />
        ) : (
          settings.map((setting) => (
            <View key={setting.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{setting.label}</Text>
                  <Text style={styles.cardSubtitle}>
                    {setting.vehicle_type
                      ? vehicleTypes.find(vt => vt.code === setting.vehicle_type)?.label ?? setting.vehicle_type
                      : 'Toutes catégories'}
                  </Text>
                </View>
                <View style={styles.cardRate}>
                  <Text style={styles.rateValue}>{setting.rate_value}</Text>
                  <Text style={styles.rateType}>
                    {setting.rate_type === 'percentage' ? '%' : 'fixe'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.statusDot, { backgroundColor: setting.is_active ? Colors.success : Colors.error }]} />
                  <Text style={[styles.statusText, { color: setting.is_active ? Colors.success : Colors.error }]}>
                    {setting.is_active ? 'Actif' : 'Inactif'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <TouchableOpacity onPress={() => handleDelete(setting)}>
                    <AppIcon name="trash-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openModalForEdit(setting)}>
                    <AppIcon name="create-outline" size={20} color={Colors.bordeaux} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        {settings.length === 0 && !isLoading && (
          <Text style={styles.emptyText}>Aucune règle de commission pour cette zone.</Text>
        )}
      </ScrollView>

      {/* Modal de création/édition */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingSetting ? 'Modifier la règle' : 'Nouvelle règle'}
            </Text>

            {/* Libellé */}
            <Controller
              control={control}
              name="label"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Libellé</Text>
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Ex: Commission Standard France"
                  />
                  {errors.label && <Text style={styles.errorText}>{errors.label.message}</Text>}
                </View>
              )}
            />

            {/* Type de véhicule */}
            <Controller
              control={control}
              name="vehicle_type"
              render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Type de véhicule (optionnel)</Text>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={value} onValueChange={(itemValue) => onChange(itemValue)}>
                      <Picker.Item label="Toutes catégories" value={null} />
                      {vehicleTypes.map(vt => (
                        <Picker.Item key={vt.id} label={vt.label} value={vt.code} />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}
            />

            <View style={{ flexDirection: 'row', gap: 16 }}>
              {/* Type de taux */}
              <Controller
                control={control}
                name="rate_type"
                render={({ field: { onChange, value } }) => (
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>Type de taux</Text>
                    <View style={styles.pickerContainer}>
                      <Picker selectedValue={value} onValueChange={(itemValue: CommissionRateType) => onChange(itemValue)}>
                        <Picker.Item label="Pourcentage" value="percentage" />
                        <Picker.Item label="Forfait" value="flat" />
                      </Picker>
                    </View>
                  </View>
                )}
              />

              {/* Valeur du taux */}
              <Controller
                control={control}
                name="rate_value"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>Valeur</Text>
                    <TextInput
                      style={styles.input}
                      value={String(value)}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="decimal-pad"
                    />
                    {errors.rate_value && <Text style={styles.errorText}>{errors.rate_value.message}</Text>}
                  </View>
                )}
              />
            </View>

            {/* Statut Actif */}
            <Controller
              control={control}
              name="is_active"
              render={({ field: { onChange, value } }) => (
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Activer cette règle</Text>
                  <Switch
                    trackColor={{ false: '#767577', true: Colors.bordeauxLight }}
                    thumbColor={value ? Colors.bordeaux : '#f4f3f4'}
                    onValueChange={onChange}
                    value={value}
                  />
                </View>
              )}
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <AppButton
                label="Annuler"
                onPress={() => setModalVisible(false)}
                variant="outline"
                style={{ flex: 1, backgroundColor: Colors.surface, borderColor: Colors.surface }}
              />
              <AppButton
                label={isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                onPress={handleSubmit(handleSave)}
                disabled={isSaving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.md },
  header: {
    backgroundColor: Colors.bordeaux,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? Spacing.xxl : 56,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerTitle: { color: Colors.white, fontSize: Fonts.size.lg, fontWeight: 'bold' },
  headerBtn: { padding: Spacing.xs, width: 40, alignItems: 'center' },
  zoneSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  zoneTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md },
  zoneTabActive: { backgroundColor: Colors.bordeauxLight },
  zoneText: { fontSize: Fonts.size.md, fontWeight: '600', color: Colors.textSecondary },
  zoneTextActive: { color: Colors.white },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardTitle: { fontSize: Fonts.size.md, fontWeight: 'bold', color: Colors.textPrimary },
  cardSubtitle: { fontSize: Fonts.size.sm, color: Colors.textSecondary, marginTop: 2 },
  cardRate: { alignItems: 'flex-end' },
  rateValue: { fontSize: Fonts.size.xl, fontWeight: 'bold', color: Colors.bordeaux },
  rateType: { fontSize: Fonts.size.xs, color: Colors.textSecondary },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: Fonts.size.sm, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 40, fontSize: Fonts.size.md },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  field: { marginBottom: Spacing.md },
  label: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: Fonts.size.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  pickerContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  errorText: {
    color: Colors.error,
    fontSize: Fonts.size.xs,
    marginTop: 4,
  },
});