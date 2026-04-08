// components/modals/CancelReservationModal.tsx

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../../theme/colors';

interface Props {
  visible:      boolean;
  reservationRef?: string;
  onConfirm:    (reason: string) => Promise<void>;
  onClose:      () => void;
}

export default function CancelReservationModal({
  visible,
  reservationRef,
  onConfirm,
  onClose,
}: Props) {
  const [reason,      setReason]      = useState('');
  const [cancelling,  setCancelling]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Veuillez indiquer un motif d\'annulation.');
      return;
    }
    setError(null);
    setCancelling(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
    } catch (err: any) {
      setError(err?.message ?? "Erreur lors de l'annulation.");
    } finally {
      setCancelling(false);
    }
  };

  const handleClose = () => {
    if (cancelling) return;
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={S.overlay}>
        <View style={S.sheet}>

          {/* ── En-tête ── */}
          <View style={S.header}>
            <View style={S.headerIcon}>
              <Ionicons name="close-circle" size={22} color="#D32F2F" />
            </View>
            <View style={S.headerText}>
              <Text style={S.title}>Annuler la réservation</Text>
              {reservationRef ? (
                <Text style={S.subtitle}>Réservation {reservationRef}</Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={handleClose} style={S.closeBtn} disabled={cancelling}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ── Avertissement ── */}
          <View style={S.warning}>
            <Ionicons name="warning-outline" size={16} color="#F57F17" />
            <Text style={S.warningText}>
              Cette action est irréversible. Le client sera notifié.
            </Text>
          </View>

          {/* ── Motif ── */}
          <View style={S.body}>
            <Text style={S.label}>
              Motif d'annulation <Text style={S.required}>*</Text>
            </Text>
            <TextInput
              style={[S.input, error ? S.inputError : null]}
              placeholder="Ex : Client injoignable, erreur de saisie…"
              placeholderTextColor={Colors.textMuted}
              value={reason}
              onChangeText={t => { setReason(t); setError(null); }}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={300}
              editable={!cancelling}
            />
            <View style={S.inputFooter}>
              {error ? (
                <Text style={S.errorText}>{error}</Text>
              ) : (
                <Text style={S.hint}>Minimum 1 caractère</Text>
              )}
              <Text style={S.counter}>{reason.length}/300</Text>
            </View>
          </View>

          {/* ── Actions ── */}
          <View style={S.actions}>
            <TouchableOpacity
              style={S.cancelBtn}
              onPress={handleClose}
              disabled={cancelling}
            >
              <Text style={S.cancelText}>Retour</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[S.confirmBtn, (!reason.trim() || cancelling) && S.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!reason.trim() || cancelling}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={16} color={Colors.white} />
                  <Text style={S.confirmText}>Confirmer l'annulation</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: {
    fontSize: Fonts.size.md,
    fontWeight: '800',
    color: '#D32F2F',
  },
  subtitle: {
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Warning
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFFDE7',
    borderLeftWidth: 3,
    borderLeftColor: '#F57F17',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  warningText: {
    flex: 1,
    fontSize: Fonts.size.xs,
    color: '#E65100',
    lineHeight: 18,
  },

  // Body
  body: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  label: {
    fontSize: Fonts.size.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  required: {
    color: '#D32F2F',
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
    minHeight: 90,
    backgroundColor: Colors.surface,
  },
  inputError: {
    borderColor: '#D32F2F',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  errorText: {
    fontSize: Fonts.size.xs,
    color: '#D32F2F',
    flex: 1,
  },
  hint: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
  },
  counter: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: Fonts.size.sm,
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: Colors.border,
  },
  confirmText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: Fonts.size.sm,
  },
});