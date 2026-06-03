// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — AdminVehicleTypesScreen
// Sprint 3 — EasyVTC
// Gestion CRUD des types de véhicule (admin)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal,
  KeyboardAvoidingView, Platform, Switch, Image,
} from 'react-native';
import { useNavigation }      from '@react-navigation/native';
import { useVehicleTypes }    from '../../hooks/useVehicleTypes';
import { AppIcon }            from '../../components/common/AppIcon';
import { useToast } from '../../hooks/useToast';
import { Logo }               from '../../constants/logo';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type {
  VehicleTypeRecord,
  CreateVehicleTypePayload,
  UpdateVehicleTypePayload,
} from '../../services/api/vehicleTypes.api';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES LOCAUX
// ══════════════════════════════════════════════════════════════════════════════

type FormValues = {
  code:              string;
  label:             string;
  description:       string;
  capacity:          string;
  icon:              string;
  base_price_france: string;
  base_price_senegal: string;
  is_active:         boolean;
  sort_order:        string;
};

function emptyForm(): FormValues {
  return {
    code:              '',
    label:             '',
    description:       '',
    capacity:          '4',
    icon:              'car-outline',
    base_price_france: '',
    base_price_senegal: '',
    is_active:         true,
    sort_order:        '0',
  };
}

function recordToForm(r: VehicleTypeRecord): FormValues {
  return {
    code:              r.code,
    label:             r.label,
    description:       r.description ?? '',
    capacity:          String(r.capacity),
    icon:              r.icon ?? 'car-outline',
    base_price_france: String(r.base_price_france),
    base_price_senegal: String(r.base_price_senegal),
    is_active:         r.is_active,
    sort_order:        String(r.sort_order),
  };
}

function toInt(v: string): number {
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}

function toFloat(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

// ══════════════════════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ══════════════════════════════════════════════════════════════════════════════

function Header({ onAdd }: { onAdd: () => void }) {
  const navigation = useNavigation();
  return (
    <View style={hdr.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={hdr.side} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <AppIcon name="arrow-back-outline" size={24} color={Colors.white} />
      </TouchableOpacity>
      <View style={hdr.center}>
        <Image source={Logo.LogoEasyVTC} style={hdr.logo} resizeMode="contain" />
      </View>
      <TouchableOpacity onPress={onAdd} style={hdr.side} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <AppIcon name="add-outline" size={26} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const hdr = StyleSheet.create({
  container: { height: 100, backgroundColor: Colors.bordeaux, flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 14, paddingHorizontal: Spacing.md, elevation: 4 },
  side:      { width: 40, alignItems: 'center' },
  center:    { flex: 1, alignItems: 'center' },
  logo:      { width: 38, height: 38 },
});

function Field({
  label, value, onChange, placeholder, keyboardType = 'default', editable = true, multiline = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'numeric' | 'decimal-pad'; editable?: boolean; multiline?: boolean;
}) {
  return (
    <View style={fld.wrap}>
      <Text style={fld.label}>{label}</Text>
      <TextInput
        style={[fld.input, !editable && fld.disabled, multiline && fld.multiline]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textPlaceholder}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

const fld = StyleSheet.create({
  wrap:      { marginBottom: Spacing.md },
  label:     { fontSize: Fonts.size.sm, color: Colors.textSecondary, marginBottom: 4, fontWeight: '500' },
  input:     { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: Spacing.sm, fontSize: Fonts.size.md, color: Colors.textPrimary, backgroundColor: Colors.surface },
  disabled:  { backgroundColor: Colors.background, color: Colors.textMuted },
  multiline: { height: 72, textAlignVertical: 'top' },
});

function TypeCard({
  item, onEdit, onDelete, onToggleActive,
}: {
  item: VehicleTypeRecord;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <View style={card.container}>
      {/* En-tête carte */}
      <View style={card.header}>
        <View style={card.iconWrap}>
          <AppIcon name={(item.icon ?? 'car-outline') as any} size={28} color={Colors.bordeaux} />
        </View>
        <View style={card.info}>
          <Text style={card.label}>{item.label}</Text>
          <Text style={card.code}>Code : {item.code}</Text>
          {item.description ? <Text style={card.desc}>{item.description}</Text> : null}
        </View>
        <View style={[card.badge, item.is_active ? card.badgeActive : card.badgeInactive]}>
          <Text style={[card.badgeText, item.is_active ? card.badgeTextActive : card.badgeTextInactive]}>
            {item.is_active ? 'Actif' : 'Inactif'}
          </Text>
        </View>
      </View>

      {/* Détails */}
      <View style={card.details}>
        <Detail icon="people-outline" text={`${item.capacity} passager(s) max`} />
        <Detail icon="pricetag-outline" text={`Prix de base : ${Number(item.base_price_france).toFixed(2)} €`} />
        <Detail icon="swap-vertical-outline" text={`Ordre d'affichage : ${item.sort_order}`} />
      </View>

      {/* Actions */}
      <View style={card.actions}>
        <TouchableOpacity style={[card.btn, card.btnEdit]} onPress={onEdit}>
          <AppIcon name="create-outline" size={16} color={Colors.bordeaux} />
          <Text style={card.btnEditText}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[card.btn, card.btnToggle]} onPress={onToggleActive}>
          <AppIcon name={item.is_active ? 'eye-off-outline' : 'eye-outline'} size={16} color={Colors.textSecondary} />
          <Text style={card.btnToggleText}>{item.is_active ? 'Désactiver' : 'Activer'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[card.btn, card.btnDelete]} onPress={onDelete}>
          <AppIcon name="trash-outline" size={16} color={Colors.error} />
          <Text style={card.btnDeleteText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Detail({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={card.detailRow}>
      <AppIcon name={icon as any} size={14} color={Colors.textMuted} />
      <Text style={card.detailText}>{text}</Text>
    </View>
  );
}

const card = StyleSheet.create({
  container:       { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  header:          { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  iconWrap:        { width: 48, height: 48, borderRadius: Radius.md, backgroundColor: Colors.overlayLight, alignItems: 'center', justifyContent: 'center' },
  info:            { flex: 1 },
  label:           { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.textPrimary },
  code:            { fontSize: Fonts.size.xs, color: Colors.textMuted, marginTop: 2 },
  desc:            { fontSize: Fonts.size.sm, color: Colors.textSecondary, marginTop: 2 },
  badge:           { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  badgeActive:     { backgroundColor: Colors.successLight },
  badgeInactive:   { backgroundColor: Colors.errorLight },
  badgeText:       { fontSize: Fonts.size.xs, fontWeight: '600' },
  badgeTextActive: { color: Colors.success },
  badgeTextInactive:{ color: Colors.error },
  details:         { gap: 4, marginBottom: Spacing.sm },
  detailRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText:      { fontSize: Fonts.size.sm, color: Colors.textSecondary },
  actions:         { flexDirection: 'row', gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  btn:             { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: Radius.sm, borderWidth: 1 },
  btnEdit:         { borderColor: Colors.bordeaux },
  btnEditText:     { fontSize: Fonts.size.sm, color: Colors.bordeaux, fontWeight: '600' },
  btnToggle:       { borderColor: Colors.border },
  btnToggleText:   { fontSize: Fonts.size.sm, color: Colors.textSecondary, fontWeight: '600' },
  btnDelete:       { borderColor: Colors.errorLight, backgroundColor: Colors.errorLight },
  btnDeleteText:   { fontSize: Fonts.size.sm, color: Colors.error, fontWeight: '600' },
});

// ══════════════════════════════════════════════════════════════════════════════
// MODAL FORMULAIRE
// ══════════════════════════════════════════════════════════════════════════════

function VehicleTypeFormModal({
  visible, onClose, onSave, editItem, saving,
}: {
  visible:  boolean;
  onClose:  () => void;
  onSave:   (values: FormValues) => void;
  editItem: VehicleTypeRecord | null;
  saving:   boolean;
}) {
  const [form, setForm] = useState<FormValues>(emptyForm());

  useEffect(() => {
    setForm(editItem ? recordToForm(editItem) : emptyForm());
  }, [editItem, visible]);

  const set = (key: keyof FormValues) => (val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.code.trim())               return Alert.alert('Champ requis', 'Le code est obligatoire.');
    if (!form.label.trim())              return Alert.alert('Champ requis', 'Le libellé est obligatoire.');
    if (!form.capacity || toInt(form.capacity) < 1) return Alert.alert('Champ invalide', 'La capacité doit être ≥ 1.');
    if (form.base_price_france === '')   return Alert.alert('Champ requis', 'Le prix de base est obligatoire.');
    onSave(form);
  };

  const isEdit = editItem !== null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={modal.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={modal.sheet}>
          <View style={modal.titleRow}>
            <Text style={modal.title}>{isEdit ? 'Modifier le type' : 'Nouveau type de véhicule'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppIcon name="close-outline" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Field
              label="Code *"
              value={form.code}
              onChange={set('code')}
              placeholder="ex: minibus"
              editable={!isEdit}
            />
            {isEdit && (
              <Text style={modal.hint}>Le code est immuable une fois créé.</Text>
            )}
            <Field label="Libellé *" value={form.label} onChange={set('label')} placeholder="ex: Minibus" />
            <Field label="Description" value={form.description} onChange={set('description')} placeholder="ex: 1-8 passagers • Grande capacité" multiline />
            <Field label="Capacité (passagers) *" value={form.capacity} onChange={set('capacity')} keyboardType="numeric" placeholder="4" />
            <Field label="Icône Ionicons" value={form.icon} onChange={set('icon')} placeholder="car-outline" />
            <Field label="Prix de base (€) *" value={form.base_price_france} onChange={set('base_price_france')} keyboardType="decimal-pad" placeholder="18.00" />
            {/* <Field label="Prix de base (€) - Sénégal" value={form.base_price_senegal} onChange={set('base_price_senegal')} keyboardType="decimal-pad" placeholder="18.00"  /> */}
            <Field label="Ordre d'affichage" value={form.sort_order} onChange={set('sort_order')} keyboardType="numeric" placeholder="0" />

            <View style={modal.switchRow}>
              <Text style={modal.switchLabel}>Actif</Text>
              <Switch
                value={form.is_active}
                onValueChange={v => set('is_active')(v)}
                trackColor={{ false: Colors.border, true: Colors.success }}
                thumbColor={Colors.white}
              />
            </View>
          </ScrollView>

          <View style={modal.footer}>
            <TouchableOpacity style={modal.btnCancel} onPress={onClose} disabled={saving}>
              <Text style={modal.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modal.btnSave, saving && modal.btnDisabled]} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={modal.btnSaveText}>Enregistrer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet:       { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, padding: Spacing.md, maxHeight: '90%' },
  titleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  title:       { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.textPrimary },
  hint:        { fontSize: Fonts.size.xs, color: Colors.textMuted, marginTop: -Spacing.sm, marginBottom: Spacing.md },
  switchRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm },
  switchLabel: { fontSize: Fonts.size.md, color: Colors.textPrimary, fontWeight: '500' },
  footer:      { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm },
  btnCancel:   { flex: 1, padding: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  btnCancelText:{ fontSize: Fonts.size.md, color: Colors.textSecondary },
  btnSave:     { flex: 2, padding: Spacing.sm, borderRadius: Radius.sm, backgroundColor: Colors.bordeaux, alignItems: 'center' },
  btnSaveText: { fontSize: Fonts.size.md, color: Colors.white, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});

// ══════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export default function AdminVehicleTypesScreen() {
  const { allTypes, isLoading, error, refresh, createType, updateType, deleteType } = useVehicleTypes();

  const { showToast } = useToast();
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem]         = useState<VehicleTypeRecord | null>(null);
  const [saving, setSaving]             = useState(false);

  useEffect(() => { refresh(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setModalVisible(true);
  };

  const openEdit = (item: VehicleTypeRecord) => {
    setEditItem(item);
    setModalVisible(true);
  };

  const handleSave = useCallback(async (values: FormValues) => {
    setSaving(true);
    try {
      if (editItem) {
        const dto: UpdateVehicleTypePayload = {
          label:              values.label.trim(),
          description:        values.description.trim() || null,
          capacity:           toInt(values.capacity),
          icon:               values.icon.trim() || null,
          base_price_france:  toFloat(values.base_price_france),
          // base_price_senegal: toInt(values.base_price_senegal),
          base_price_senegal: toFloat(values.base_price_senegal),
          is_active:          values.is_active,
          sort_order:         toInt(values.sort_order),
        };
        await updateType(editItem.id, dto);
        showToast({ type: 'success', message: 'Type de véhicule mis à jour.' });
      } else {
        const dto: CreateVehicleTypePayload = {
          code:               values.code.trim().toLowerCase(),
          label:              values.label.trim(),
          description:        values.description.trim() || null,
          capacity:           toInt(values.capacity),
          icon:               values.icon.trim() || null,
          base_price_france:  toFloat(values.base_price_france), 
          base_price_senegal: toFloat(values.base_price_senegal),
          is_active:          values.is_active,
          sort_order:         toInt(values.sort_order),
        };
        await createType(dto);
        showToast({ type: 'success', message: 'Type de véhicule créé avec succès.' });
      }
      setModalVisible(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue.';
      Alert.alert('Erreur', msg);
    } finally {
      setSaving(false);
    }
  }, [editItem, createType, updateType]);

  const handleToggleActive = useCallback((item: VehicleTypeRecord) => {
    const action = item.is_active ? 'désactiver' : 'activer';
    Alert.alert(
      'Confirmation',
      `Voulez-vous ${action} le type "${item.label}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await updateType(item.id, { is_active: !item.is_active });
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour.'; 
              Alert.alert('Erreur', msg);
            }
          },
        },
      ]
    );
  }, [updateType]);

  const handleDelete = useCallback((item: VehicleTypeRecord) => {
    Alert.alert(
      'Supprimer ce type',
      `Supprimer "${item.label}" définitivement ?\n\nCette action est impossible si des réservations ou véhicules utilisent ce type.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setSaving(true); // Activer l'indicateur de chargement si nécessaire
            try {
              await deleteType(item.id);
              showToast({ type: 'success', message: `Le type "${item.label}" a été supprimé.` });
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression.';
              showToast({ type: 'error', title: 'Impossible de supprimer', message: msg });
            }
          },
        },
      ],
      { cancelable: false } // Empêche la fermeture de l'alerte en dehors des boutons
    );
  }, [deleteType]);

  return (
    <View style={s.screen}>
      <Header onAdd={openCreate} />

      <View style={s.titleRow}>
        <Text style={s.pageTitle}>Types de véhicule</Text>
        <Text style={s.pageSubtitle}>{allTypes.length} type(s) configuré(s)</Text>
      </View>

      {isLoading && allTypes.length === 0 ? (
        <ActivityIndicator style={s.loader} size="large" color={Colors.bordeaux} />
      ) : error ? (
        <View style={s.errorBox}>
          <AppIcon name="alert-circle-outline" size={20} color={Colors.error} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={s.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : allTypes.length === 0 ? (
        <View style={s.empty}>
          <AppIcon name="car-outline" size={48} color={Colors.border} />
          <Text style={s.emptyText}>Aucun type de véhicule configuré.</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={openCreate}>
            <Text style={s.emptyBtnText}>Créer le premier type</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={s.list} contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
          {allTypes.map(item => (
            <TypeCard
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item)}
              onToggleActive={() => handleToggleActive(item)}
            />
          ))}
        </ScrollView>
      )}

      <VehicleTypeFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        editItem={editItem}
        saving={saving}
      />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: Colors.background },
  titleRow:    { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  pageTitle:   { fontSize: Fonts.size.xl, fontWeight: '700', color: Colors.textPrimary },
  pageSubtitle:{ fontSize: Fonts.size.sm, color: Colors.textSecondary, marginTop: 2 },
  loader:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBox:    { margin: Spacing.md, padding: Spacing.md, backgroundColor: Colors.errorLight, borderRadius: Radius.md, alignItems: 'center', gap: Spacing.sm },
  errorText:   { fontSize: Fonts.size.sm, color: Colors.error, textAlign: 'center' },
  retryText:   { fontSize: Fonts.size.sm, color: Colors.bordeaux, fontWeight: '600', textDecorationLine: 'underline' },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  emptyText:   { fontSize: Fonts.size.md, color: Colors.textMuted, textAlign: 'center' },
  emptyBtn:    { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.bordeaux, borderRadius: Radius.md },
  emptyBtnText:{ fontSize: Fonts.size.md, color: Colors.white, fontWeight: '600' },
  list:        { flex: 1 },
  listContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
});
