import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';

const CANCEL_REASONS = [
  'Changement de plans',
  'Chauffeur trop long à arriver',
  'Erreur de saisie',
  'Autre',
];

interface Props {
  visible: boolean;
  reservationRef?: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export default function CancelReservationModal({ visible, reservationRef, onConfirm, onClose }: Props) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const effectiveReason = selectedReason === 'Autre' ? customReason.trim() : selectedReason;
  const canConfirm = effectiveReason.length > 0;

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    onClose();
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(effectiveReason);
    setSelectedReason('');
    setCustomReason('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="close-circle-outline" size={24} color={Colors.error} />
              <Text style={styles.title}>Annuler la réservation</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {reservationRef && (
              <Text style={styles.ref}>{reservationRef}</Text>
            )}

            <Text style={styles.label}>Motif d'annulation</Text>

            {CANCEL_REASONS.map(reason => (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonItem, selectedReason === reason && styles.reasonItemActive]}
                onPress={() => setSelectedReason(reason)}
              >
                <Ionicons
                  name={selectedReason === reason ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={selectedReason === reason ? Colors.bordeaux : Colors.textMuted}
                />
                <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextActive]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}

            {selectedReason === 'Autre' && (
              <TextInput
                style={styles.input}
                placeholder="Précisez le motif..."
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.btnCancel} onPress={handleClose}>
                <Text style={styles.btnCancelText}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnConfirm, !canConfirm && styles.btnConfirmDisabled]}
                onPress={handleConfirm}
                disabled={!canConfirm}
              >
                <Text style={styles.btnConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: Fonts.size.md,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.textPrimary,
  },
  ref: {
    fontSize: Fonts.size.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Fonts.size.sm,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  reasonItemActive: {
    borderColor: Colors.bordeaux,
    backgroundColor: Colors.beigeLight,
  },
  reasonText: {
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
  },
  reasonTextActive: {
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.bordeaux,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    minHeight: 80,
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
    backgroundColor: Colors.error,
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
