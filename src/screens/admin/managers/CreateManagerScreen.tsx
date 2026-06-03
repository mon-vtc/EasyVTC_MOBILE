// screens/admin/managers/CreateManagerScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../../hooks/useAdmin';
import { useToast } from '../../../hooks/useToast';
import { AppInput } from '../../../components/common/AppInput';
import { AppButton } from '../../../components/common/AppButton';
import { Colors, Spacing, Radius, Fonts } from '../../../theme/colors';

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Standard' },
  { value: 2, label: 'Prioritaire' },
  { value: 3, label: 'Haute priorité' },
];

export default function CreateManagerScreen() {
  const navigation = useNavigation();
  const { createManager } = useAdmin();
  const { showToast } = useToast();

  const [firstName,     setFirstName]     = useState('');
  const [lastName,      setLastName]      = useState('');
  const [email,         setEmail]         = useState('');
  const [phone,         setPhone]         = useState('');
  const [coverageZone,  setCoverageZone]  = useState('');
  const [priorityLevel, setPriorityLevel] = useState<number | null>(null);

  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'Le prénom est requis';
    if (!lastName.trim())  e.lastName  = 'Le nom est requis';
    if (!email.trim()) {
      e.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      e.email = "L'email est invalide";
    }
    if (!phone.trim()) {
      e.phone = 'Le numéro de téléphone est requis';
    } else if (!/^\+?[1-9]\d{7,14}$/.test(phone)) {
      e.phone = 'Format international attendu (ex : +33612345678)';
    }
    if (coverageZone.trim() && coverageZone.trim().length < 2) {
      e.coverageZone = 'La zone de couverture doit comporter au moins 2 caractères';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const created = await createManager({
        first_name:    firstName,
        last_name:     lastName,
        email,
        phone,
        ...(coverageZone.trim()  ? { coverage_zone: coverageZone.trim() } : {}),
        ...(priorityLevel !== null ? { priority_level: priorityLevel }     : {}),
      });
      if (created) {
        showToast({
          title: 'Succès',
          message: `Le gestionnaire ${created.first_name} a été créé. Un email avec ses identifiants lui a été envoyé.`,
          type: 'success',
        });
        navigation.goBack();
      }
    } catch (err: any) {
      showToast({
        title: 'Erreur',
        message: err.message || 'Une erreur est survenue',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau gestionnaire</Text>
        <View style={{ width: 40 }} />
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
            placeholder="Marie"
            value={firstName}
            onChangeText={setFirstName}
            error={errors.firstName}
            autoCapitalize="words"
          />
          <AppInput
            label="Nom *"
            placeholder="Dubois"
            value={lastName}
            onChangeText={setLastName}
            error={errors.lastName}
            autoCapitalize="words"
          />
          <AppInput
            label="Email *"
            placeholder="marie.dubois@easyvtc.fr"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <AppInput
            label="Téléphone *"
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
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.hint}>
          Le mot de passe temporaire est généré automatiquement et envoyé par email au gestionnaire.
        </Text>

        <AppButton
          label="Créer le gestionnaire"
          onPress={handleCreate}
          loading={isSaving}
          style={styles.button}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

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
  headerTitle: { fontSize: Fonts.size.lg, fontWeight: '600', color: Colors.white },

  scroll:  { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.md },

  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.md,
    gap:             Spacing.sm,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  sectionTitle:  { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeauxDark },

  fieldLabel: {
    fontSize:    Fonts.size.sm,
    fontWeight:  '600',
    color:       Colors.textSecondary,
    marginBottom: 6,
  },
  priorityRow:   { gap: Spacing.xs },
  priorityOption: {
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
    fontWeight: '500',
    color:      Colors.textSecondary,
  },
  priorityOptionTextSelected: {
    color:      Colors.bordeaux,
    fontWeight: '700',
  },

  hint: {
    fontSize: Fonts.size.xs,
    color:    Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  button: { marginTop: Spacing.xs },
});
