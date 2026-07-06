// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — AdminAppConfigScreen
// Configuration des coordonnées support affichées dans l'app (admin uniquement)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAdmin } from '../../hooks/useAdmin';
import { useToast } from '../../hooks/useToast';
import { AppIcon } from '../../components/common/AppIcon';
import { AppButton } from '../../components/common/AppButton';
import { Logo } from '../../constants/logo';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { SupportConfig, SupportConfigKey } from '../../types';

type FormValues = SupportConfig;

const EMPTY_FORM: FormValues = {
  support_phone:   '',
  support_email:   '',
  support_address: '',
  support_hours:   '',
};

// Clés modifiées individuellement (une requête PUT par clé changée, comme côté API)
const FIELD_KEYS: SupportConfigKey[] = ['support_phone', 'support_email', 'support_address', 'support_hours'];

export default function AdminAppConfigScreen() {
  const navigation = useNavigation();
  const { fetchSupportConfig, updateSupportConfig } = useAdmin();
  const { showToast } = useToast();

  const [initial, setInitial] = useState<FormValues>(EMPTY_FORM);
  const [form, setForm]       = useState<FormValues>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const config = await fetchSupportConfig();
      setInitial(config);
      setForm(config);
    } catch (err: any) {
      showToast({ type: 'error', message: err.message ?? 'Impossible de charger la configuration.' });
    } finally {
      setIsLoading(false);
    }
  }, [fetchSupportConfig, showToast]);

  useEffect(() => { load(); }, [load]);

  const hasChanges = FIELD_KEYS.some((key) => form[key] !== initial[key]);

  const handleSave = async () => {
    const changedKeys = FIELD_KEYS.filter((key) => form[key] !== initial[key]);
    if (changedKeys.length === 0) return;

    setIsSaving(true);
    try {
      await Promise.all(changedKeys.map((key) => updateSupportConfig(key, form[key])));
      setInitial(form);
      showToast({ type: 'success', message: 'Coordonnées support mises à jour.' });
    } catch (err: any) {
      showToast({ type: 'error', message: err.message ?? 'Erreur lors de la sauvegarde.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.flex}>
      {/* ── En-tête ── */}
      <View style={hdr.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={hdr.side} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <AppIcon name="arrow-back-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={hdr.center}>
          <Image source={Logo.LogoEasyVTC} style={hdr.logo} resizeMode="contain" />
        </View>
        <View style={hdr.side} />
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Coordonnées support</Text>
          <Text style={styles.subtitle}>
            Ces informations sont affichées aux clients et chauffeurs dans l'application.
          </Text>

          <View style={styles.card}>
            <Field
              label="Téléphone"
              icon="call-outline"
              value={form.support_phone}
              onChange={(v) => setForm((f) => ({ ...f, support_phone: v }))}
              placeholder="+33 1 23 45 67 89"
              keyboardType="phone-pad"
            />
            <Field
              label="Email"
              icon="mail-outline"
              value={form.support_email}
              onChange={(v) => setForm((f) => ({ ...f, support_email: v }))}
              placeholder="support@eazyvtc.com"
              keyboardType="email-address"
            />
            <Field
              label="Adresse"
              icon="location-outline"
              value={form.support_address}
              onChange={(v) => setForm((f) => ({ ...f, support_address: v }))}
              placeholder="12 rue de l'Exemple, 75000 Paris"
              multiline
            />
            <Field
              label="Horaires"
              icon="time-outline"
              value={form.support_hours}
              onChange={(v) => setForm((f) => ({ ...f, support_hours: v }))}
              placeholder="Lun–Ven 9h–18h"
            />
          </View>

          <AppButton
            label={isSaving ? 'Enregistrement...' : 'Enregistrer'}
            onPress={handleSave}
            loading={isSaving}
            disabled={!hasChanges || isSaving}
            style={styles.saveBtn}
          />
        </ScrollView>
      )}
    </View>
  );
}

// ── Champ de formulaire ──────────────────────────────────────────────────────
function Field({
  label, icon, value, onChange, placeholder, keyboardType = 'default', multiline = false,
}: {
  label: string;
  icon: React.ComponentProps<typeof AppIcon>['name'];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  multiline?: boolean;
}) {
  return (
    <View style={fld.wrap}>
      <View style={fld.labelRow}>
        <AppIcon name={icon} size={16} color={Colors.bordeaux} />
        <Text style={fld.label}>{label}</Text>
      </View>
      <TextInput
        style={[fld.input, multiline && fld.multiline]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textPlaceholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        autoCapitalize="none"
      />
    </View>
  );
}

const hdr = StyleSheet.create({
  container: { height: 100, backgroundColor: Colors.bordeaux, flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 14, paddingHorizontal: Spacing.md, elevation: 4 },
  side:      { width: 40, alignItems: 'center' },
  center:    { flex: 1, alignItems: 'center' },
  logo:      { width: 38, height: 38 },
});

const fld = StyleSheet.create({
  wrap:     { marginBottom: Spacing.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  label:    { fontSize: Fonts.size.sm, color: Colors.textSecondary, fontWeight: '500' },
  input:    { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: Spacing.sm, fontSize: Fonts.size.md, color: Colors.textPrimary, backgroundColor: Colors.surface },
  multiline: { height: 72, textAlignVertical: 'top' },
});

const styles = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:      { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  title:       { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.bordeaux, marginBottom: 4 },
  subtitle:    { fontSize: Fonts.size.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  card:        { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  saveBtn:     { marginTop: Spacing.lg },
});
