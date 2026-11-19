import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, type KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';

// Petit formulaire modal de champs texte (correction d'identité client,
// identité de facturation d'un chauffeur…). Ne renvoie que les champs modifiés.

export interface EditableField {
  key:           string;
  label:         string;
  value:         string;
  placeholder?:  string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?:    number;
  /** Message d'erreur si la valeur saisie est invalide, sinon null */
  validate?:     (value: string) => string | null;
}

interface Props {
  visible:       boolean;
  title:         string;
  icon?:         keyof typeof Ionicons.glyphMap;
  note?:         string;
  fields:        EditableField[];
  isSubmitting?: boolean;
  onConfirm: (changes: Record<string, string>) => void;
  onClose:   () => void;
}

export default function EditFieldsModal({
  visible, title, icon = 'create-outline', note, fields, isSubmitting, onConfirm, onClose,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    setValues(Object.fromEntries(fields.map(f => [f.key, f.value])));
  // Réinitialise à chaque ouverture uniquement (fields est recréé à chaque rendu du parent)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const changes = Object.fromEntries(
    fields
      .map(f => [f.key, (values[f.key] ?? '').trim()] as const)
      .filter(([key, v]) => v !== (fields.find(f => f.key === key)?.value ?? '').trim()),
  );
  const errors = Object.fromEntries(
    fields.map(f => [f.key, f.key in changes ? f.validate?.(changes[f.key]) ?? null : null]),
  );
  const canConfirm = Object.keys(changes).length > 0
    && Object.values(errors).every(e => !e)
    && !isSubmitting;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Ionicons name={icon} size={22} color={Colors.bordeaux} />
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {fields.map(f => (
              <View key={f.key} style={styles.field}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={[styles.input, errors[f.key] && styles.inputError]}
                  value={values[f.key] ?? ''}
                  onChangeText={v => setValues(prev => ({ ...prev, [f.key]: v }))}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType={f.keyboardType ?? 'default'}
                  maxLength={f.maxLength}
                  selectionColor={Colors.bordeaux}
                  underlineColorAndroid="transparent"
                />
                {errors[f.key] && <Text style={styles.error}>{errors[f.key]}</Text>}
              </View>
            ))}
            {note && <Text style={styles.note}>{note}</Text>}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnConfirm, !canConfirm && styles.btnConfirmDisabled]}
              onPress={() => canConfirm && onConfirm(changes)}
              disabled={!canConfirm}
            >
              {isSubmitting
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={styles.btnConfirmText}>Enregistrer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    flex: 1,
    fontSize: Fonts.size.md,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.textPrimary,
  },
  field: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Fonts.size.sm,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.error,
  },
  error: {
    fontSize: Fonts.size.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  note: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: Fonts.size.sm,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.textSecondary,
  },
  btnConfirm: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.bordeaux,
    alignItems: 'center',
  },
  btnConfirmDisabled: {
    opacity: 0.4,
  },
  btnConfirmText: {
    fontSize: Fonts.size.sm,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.white,
  },
});
