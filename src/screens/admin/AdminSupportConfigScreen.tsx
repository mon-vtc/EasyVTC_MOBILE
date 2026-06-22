import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { appConfigApi } from '../../services/api/appConfig.api';
import { Colors, Spacing, Radius } from '../../theme/colors';
import type { SupportConfig, SupportConfigKey } from '../../types';

const FIELDS: { key: SupportConfigKey; label: string; icon: keyof typeof Ionicons.glyphMap; placeholder: string; keyboardType?: 'default' | 'email-address' | 'phone-pad' }[] = [
  { key: 'support_phone',   label: 'Téléphone',      icon: 'call-outline',         placeholder: '+33 1 XX XX XX XX',        keyboardType: 'phone-pad' },
  { key: 'support_email',   label: 'Email',           icon: 'mail-outline',         placeholder: 'support@eazyvtc.com',      keyboardType: 'email-address' },
  { key: 'support_address', label: 'Adresse',         icon: 'location-outline',     placeholder: '12 rue de la Paix, Paris'  },
  { key: 'support_hours',   label: 'Horaires',        icon: 'time-outline',         placeholder: 'Lun–Ven 9h–18h'            },
];

export default function AdminSupportConfigScreen() {
  const token = useAuthStore(s => s.accessToken) ?? '';

  const [form, setForm]       = useState<SupportConfig>({
    support_phone:   '',
    support_email:   '',
    support_address: '',
    support_hours:   '',
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<SupportConfigKey | null>(null);
  const [saved, setSaved]       = useState<SupportConfigKey | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await appConfigApi.getSupportConfig(token);
    if (res.ok && res.data) {
      setForm(res.data);
    } else {
      setError(res.message ?? 'Impossible de charger la configuration');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const handleSave = async (key: SupportConfigKey) => {
    setSaving(key);
    const res = await appConfigApi.updateConfig(token, key, form[key]);
    setSaving(null);
    if (res.ok) {
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } else {
      Alert.alert('Erreur', res.message ?? 'Échec de la mise à jour');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadConfig}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Ionicons name="headset-outline" size={32} color={Colors.bordeaux} />
          <Text style={styles.title}>Coordonnées du support</Text>
          <Text style={styles.subtitle}>Ces informations sont affichées aux utilisateurs de l'application.</Text>
        </View>

        {FIELDS.map(({ key, label, icon, placeholder, keyboardType }) => (
          <View key={key} style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <Ionicons name={icon} size={18} color={Colors.bordeaux} />
              <Text style={styles.fieldLabel}>{label}</Text>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={form[key]}
                onChangeText={v => setForm(prev => ({ ...prev, [key]: v }))}
                placeholder={placeholder}
                placeholderTextColor={Colors.textSecondary}
                keyboardType={keyboardType ?? 'default'}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.saveBtn, saved === key && styles.saveBtnSaved]}
                onPress={() => handleSave(key)}
                disabled={saving === key}
              >
                {saving === key ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : saved === key ? (
                  <Ionicons name="checkmark" size={18} color={Colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  content:     { padding: Spacing.md, paddingBottom: 40 },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: Spacing.lg },

  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 8,
  },
  title:    { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },

  fieldCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  fieldLabel:  { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8D5D5',
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },

  saveBtn: {
    backgroundColor: Colors.bordeaux,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    height: 42,
  },
  saveBtnSaved:  { backgroundColor: Colors.success },
  saveBtnText:   { color: Colors.white, fontWeight: '600', fontSize: 13 },

  errorText: { fontSize: 14, color: Colors.error, textAlign: 'center' },
  retryBtn:  { backgroundColor: Colors.bordeaux, borderRadius: Radius.sm, paddingHorizontal: 20, paddingVertical: 10 },
  retryBtnText: { color: Colors.white, fontWeight: '600' },
});
