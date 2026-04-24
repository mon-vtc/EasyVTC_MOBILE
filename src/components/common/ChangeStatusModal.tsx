import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Fonts } from '../../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (newStatus: 'active' | 'inactive' | 'locked', reason: string) => Promise<void>;
  currentStatus: 'active' | 'inactive' | 'locked';
  userName: string;
  isSaving: boolean;
}

export default function ChangeStatusModal({
  visible,
  onClose,
  onConfirm,
  currentStatus,
  userName,
  isSaving,
}: Props) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  const newStatusLabel = newStatus === 'active' ? 'Actif' : 'Inactif';

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Le motif est obligatoire pour changer le statut.');
      return;
    }
    setError('');
    await onConfirm(newStatus, reason);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.title}>Changer le statut</Text>
          <Text style={styles.subtitle}>
            Vous êtes sur le point de passer le statut de{' '}
            <Text style={{ fontWeight: 'bold' }}>{userName}</Text> à{' '}
            <Text style={{ fontWeight: 'bold' }}>"{newStatusLabel}"</Text>.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Motif du changement</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="Ex: Fin de contrat, congé, etc."
              placeholderTextColor={Colors.textPlaceholder}
              value={reason}
              onChangeText={(text) => {
                setReason(text);
                if (error) setError('');
              }}
              multiline
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.confirmButton, isSaving && styles.disabledButton]}
            onPress={handleConfirm}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmer le changement</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  title: {
    fontSize: Fonts.size.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Fonts.size.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    height: 80,
    textAlignVertical: 'top',
    fontSize: Fonts.size.sm,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: Fonts.size.xs,
    marginTop: Spacing.xs,
  },
  confirmButton: {
    backgroundColor: Colors.bordeaux,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.bordeauxLight,
  },
  confirmButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: Fonts.size.md,
  },
});