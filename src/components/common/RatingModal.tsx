// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT — Modal d'évaluation étoile (1–5)
// Sprint 6 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { SubmitRatingDto } from '../../types/ratings.types';

interface Props {
  visible:      boolean;
  driverName?:  string;
  isSubmitting: boolean;
  onConfirm:    (dto: SubmitRatingDto) => void;
  onClose:      () => void;
}

const LABELS: Record<number, string> = {
  1: 'Très mauvais',
  2: 'Mauvais',
  3: 'Correct',
  4: 'Bien',
  5: 'Excellent',
};

export default function RatingModal({ visible, driverName, isSubmitting, onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<number>(0);
  const [comment, setComment] = useState<string>('');

  const handleClose = () => {
    setSelected(0);
    setComment('');
    onClose();
  };

  const handleConfirm = () => {
    if (selected === 0 || isSubmitting) return;
    onConfirm({ note: selected, comment: comment.trim() || null });
    setSelected(0);
    setComment('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="star-outline" size={22} color={Colors.beige} />
            <Text style={styles.title}>Évaluer le chauffeur</Text>
            <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {driverName && (
            <Text style={styles.subtitle}>Comment s'est passée votre course avec {driverName} ?</Text>
          )}

          {/* Étoiles */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => setSelected(n)}
                activeOpacity={0.7}
                style={styles.starBtn}
              >
                <Ionicons
                  name={n <= selected ? 'star' : 'star-outline'}
                  size={40}
                  color={n <= selected ? '#F59E0B' : Colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Label de la note sélectionnée */}
          <Text style={styles.noteLabel}>
            {selected > 0 ? LABELS[selected] : 'Sélectionnez une note'}
          </Text>

          {/* Commentaire optionnel */}
          <TextInput
            style={styles.commentInput}
            placeholder="Ajouter un commentaire (optionnel)"
            placeholderTextColor={Colors.textMuted}
            value={comment}
            onChangeText={setComment}
            editable={!isSubmitting}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.commentCounter}>{comment.length}/500</Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={handleClose} disabled={isSubmitting}>
              <Text style={styles.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnConfirm, (selected === 0 || isSubmitting) && styles.btnConfirmDisabled]}
              onPress={handleConfirm}
              disabled={selected === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.btnConfirmText}>Envoyer</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
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
    padding: Spacing.lg,
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
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  starBtn: {
    padding: Spacing.xs,
  },
  noteLabel: {
    textAlign: 'center',
    fontSize: Fonts.size.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    minHeight: 20,
  },
  commentInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    marginBottom: Spacing.xs,
  },
  commentCounter: {
    alignSelf: 'flex-end',
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
    fontWeight: '600',
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
    fontWeight: '700',
    color: Colors.white,
  },
});
