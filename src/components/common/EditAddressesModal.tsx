import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAddressSearch } from '../../hooks/useAddressSearch';
import type { AddressSuggestion } from '../../services/geo/addressAutocomplete';
import type { UpdateAddressesPayload } from '../../types/reservations.types';

// Modification du départ / de la destination d'une réservation existante.
// Chaque nouvelle adresse doit être choisie dans les suggestions : ses
// coordonnées servent au serveur pour recalculer la distance et le prix.

interface Props {
  visible:       boolean;
  pickupAddress: string;
  destAddress:   string;
  /** Le départ n'est plus modifiable une fois le passager à bord */
  pickupLocked?: boolean;
  isSubmitting?: boolean;
  onConfirm: (payload: UpdateAddressesPayload) => void;
  onClose:   () => void;
}

type Field = 'pickup' | 'dest';

export default function EditAddressesModal({
  visible, pickupAddress, destAddress, pickupLocked, isSubmitting, onConfirm, onClose,
}: Props) {
  const [pickupInput, setPickupInput] = useState(pickupAddress);
  const [destInput,   setDestInput]   = useState(destAddress);
  const [pickupPoint, setPickupPoint] = useState<AddressSuggestion | null>(null);
  const [destPoint,   setDestPoint]   = useState<AddressSuggestion | null>(null);
  const [focused,     setFocused]     = useState<Field | null>(null);

  const { suggestions: pickupSuggestions, isSearching: isSearchingPickup } =
    useAddressSearch(pickupInput, focused === 'pickup');
  const { suggestions: destSuggestions, isSearching: isSearchingDest } =
    useAddressSearch(destInput, focused === 'dest');

  // Repartir des adresses actuelles à chaque ouverture
  useEffect(() => {
    if (!visible) return;
    setPickupInput(pickupAddress);
    setDestInput(destAddress);
    setPickupPoint(null);
    setDestPoint(null);
    setFocused(null);
  }, [visible, pickupAddress, destAddress]);

  // Une saisie libre (texte modifié sans choisir de suggestion) n'est pas envoyable
  const pickupDirty = pickupInput.trim() !== pickupAddress && pickupPoint?.label !== pickupInput;
  const destDirty   = destInput.trim()   !== destAddress   && destPoint?.label   !== destInput;
  const hasChange   = !!pickupPoint || !!destPoint;
  const canConfirm  = hasChange && !pickupDirty && !destDirty && !isSubmitting;

  const handleSelect = (field: Field, s: AddressSuggestion) => {
    if (field === 'pickup') { setPickupInput(s.label); setPickupPoint(s); }
    else                    { setDestInput(s.label);   setDestPoint(s); }
    setFocused(null);
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({
      ...(pickupPoint ? { pickup_address: pickupPoint.label, pickup_lat: pickupPoint.latitude, pickup_lng: pickupPoint.longitude } : {}),
      ...(destPoint   ? { dest_address:   destPoint.label,   dest_lat:   destPoint.latitude,   dest_lng:   destPoint.longitude   } : {}),
    });
  };

  const renderField = (
    field: Field,
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
    value: string,
    setValue: (v: string) => void,
    clearPoint: () => void,
    suggestions: AddressSuggestion[],
    isSearching: boolean,
    dirty: boolean,
    locked?: boolean,
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, locked && styles.inputRowLocked]}>
        <Ionicons name={icon} size={18} color={locked ? Colors.textMuted : Colors.bordeaux} />
        <TextInput
          style={styles.input}
          value={value}
          editable={!locked}
          onChangeText={v => { setValue(v); clearPoint(); }}
          onFocus={() => setFocused(field)}
          placeholder="Rechercher une adresse..."
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.bordeaux}
          underlineColorAndroid="transparent"
        />
        {isSearching && <ActivityIndicator size="small" color={Colors.bordeaux} />}
      </View>
      {locked && <Text style={styles.hint}>Le passager est à bord : seul l'arrivée peut changer.</Text>}
      {dirty && !isSearching && focused !== field && (
        <Text style={styles.warning}>Choisissez l'adresse dans la liste proposée.</Text>
      )}
      {focused === field && suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((s, i) => (
            <TouchableOpacity
              key={`${s.label}-${i}`}
              style={[styles.suggestion, i > 0 && styles.suggestionBorder]}
              onPress={() => handleSelect(field, s)}
            >
              <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.suggestionText} numberOfLines={2}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Ionicons name="navigate-outline" size={22} color={Colors.bordeaux} />
            <Text style={styles.title}>Modifier l'itinéraire</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {renderField('pickup', 'Départ', 'radio-button-on-outline', pickupInput, setPickupInput,
              () => setPickupPoint(null), pickupSuggestions, isSearchingPickup, pickupDirty, pickupLocked)}
            {renderField('dest', 'Destination', 'flag-outline', destInput, setDestInput,
              () => setDestPoint(null), destSuggestions, isSearchingDest, destDirty)}

            <Text style={styles.note}>
              Le prix estimé est recalculé selon le nouvel itinéraire. Le chauffeur et le client sont prévenus.
            </Text>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnConfirm, !canConfirm && styles.btnConfirmDisabled]}
              onPress={handleConfirm}
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
  },
  inputRowLocked: {
    backgroundColor: Colors.beigeLight,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
  },
  hint: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  warning: {
    fontSize: Fonts.size.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  suggestions: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  suggestionBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  suggestionText: {
    flex: 1,
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
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
