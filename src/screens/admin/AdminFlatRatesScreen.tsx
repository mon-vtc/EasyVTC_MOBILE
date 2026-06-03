// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — AdminFlatRatesScreen + AdminFlatRateDetailScreen
// Sprint 3 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal, KeyboardAvoidingView,
  Platform, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePricing }    from '../../hooks/usePricing';
import type { PricingFlatRate, PricingCountry } from '../../types/pricing.types';
import { Logo }          from '../../constants/logo';
import { AppIcon }       from '../../components/common/AppIcon';
import { Colors, Spacing, Radius } from '../../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import type {AppIconProps}  from '../../types/app-icon-props.types';
import { useToast } from '../../hooks/useToast';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES LOCAUX
// ══════════════════════════════════════════════════════════════════════════════

// Champs éditables selon PricingFlatRate :
//   label | origin_label | destination_label | price
// Les champs suivants sont en commentaire pour future feature :
//   pickup_surcharge (non présent dans l'interface actuelle)
type FlatRateFormValues = {
  label:             string;
  origin_label:      string;
  destination_label: string;
  price:             string;
  // pickup_surcharge: string; // future feature
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function fmt(n: number, symbol: string): string {
  if (symbol === 'F CFA') return `${Math.round(n).toLocaleString('fr-FR')} F CFA`;
  return `${n.toFixed(2)} ${symbol}`;
}

function flatRateToForm(fr: PricingFlatRate): FlatRateFormValues {
  return {
    label:             fr.label,
    origin_label:      fr.origin_label,
    destination_label: fr.destination_label,
    price:             String(fr.price),
    // pickup_surcharge: String(fr.pickup_surcharge ?? 0), // future feature
  };
}

function emptyForm(): FlatRateFormValues {
  return {
    label:             '',
    origin_label:      '',
    destination_label: '',
    price:             '',
    // pickup_surcharge: '0', // future feature
  };
}

function toFloat(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

// ══════════════════════════════════════════════════════════════════════════════
// CHAMP TEXTE GÉNÉRIQUE
// ══════════════════════════════════════════════════════════════════════════════

function Field({
  label,
  value,
  onChange,
  editable,
  keyboardType = 'default',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  keyboardType?: 'default' | 'decimal-pad';
  placeholder?: string;
}) {
  return (
    <View style={fd.container}>
      <Text style={fd.label}>{label}</Text>
      <TextInput
        style={[fd.input, !editable && fd.inputDisabled]}
        value={value}
        onChangeText={onChange}
        editable={editable}
        keyboardType={keyboardType}
        placeholder={placeholder ?? ''}
        placeholderTextColor={Colors.textSecondary}
      />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HEADER LISTE
// ══════════════════════════════════════════════════════════════════════════════

function ListHeader({ onAdd }: { onAdd: () => void }) {
  const navigation = useNavigation();
  return (
    <View style={hdr.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={hdr.side}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <AppIcon name="arrow-back-outline" size={24} color={Colors.white} />
      </TouchableOpacity>
      <View style={hdr.center}>
        <Image source={Logo.LogoEasyVTC} style={hdr.logo} resizeMode="contain" />
      </View>
      <TouchableOpacity
        onPress={onAdd}
        style={hdr.side}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <AppIcon name="add-outline" size={26} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HEADER DÉTAIL
// ══════════════════════════════════════════════════════════════════════════════

function DetailHeader({
  isEditing,
  onBack,
  onToggleEdit,
}: {
  isEditing: boolean;
  onBack: () => void;
  onToggleEdit: () => void;
}) {
  return (
    <View style={hdr.container}>
      <TouchableOpacity
        onPress={onBack}
        style={hdr.side}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <AppIcon name="arrow-back-outline" size={24} color={Colors.white} />
      </TouchableOpacity>
      <View style={hdr.center}>
        <Image source={Logo.LogoEasyVTC} style={hdr.logo} resizeMode="contain" />
      </View>
      <TouchableOpacity
        onPress={onToggleEdit}
        style={hdr.side}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <AppIcon
          name={isEditing ? 'close-outline' : 'create-outline'}
          size={24}
          color={Colors.white}
        />
      </TouchableOpacity>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MENU 3 POINTS
// ══════════════════════════════════════════════════════════════════════════════

type QuickAction = 'view' | 'edit' | 'delete';

function ThreeDotMenu({
  visible,
  onAction,
  onClose,
}: {
  visible: boolean;
  onAction: (a: QuickAction) => void;
  onClose: () => void;
}) {
  if (!visible) return null;

  const actions: { key: QuickAction; label: string; icon: string; color?: string }[] = [
    { key: 'view',   label: 'Voir le détail', icon: 'eye-outline' },
    { key: 'edit',   label: 'Modifier',       icon: 'create-outline' },
    { key: 'delete', label: 'Supprimer',      icon: 'trash-outline', color: '#E53935' },
  ];

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={menu.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={menu.popover}>
        {actions.map((a, i) => (
          <React.Fragment key={a.key}>
            {i > 0 && <View style={menu.divider} />}
            <TouchableOpacity
              style={menu.item}
              onPress={() => { onClose(); onAction(a.key); }}
            >
              <AppIcon name={a.icon as AppIconProps['name']} size={18} color={a.color ?? Colors.textPrimary} />
              <Text style={[menu.itemText, a.color ? { color: a.color } : undefined]}>
                {a.label}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CARD FORFAIT
// ══════════════════════════════════════════════════════════════════════════════

function FlatRateCard({
  item,
  currencySymbol,
  onPress,
  onAction,
}: {
  item: PricingFlatRate;
  currencySymbol: string;
  onPress: () => void;
  onAction: (a: QuickAction) => void;
}) {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <TouchableOpacity style={card.container} onPress={onPress} activeOpacity={0.8}>
      {/* Ligne principale */}
      <View style={card.row}>
        <View style={card.iconBox}>
          <AppIcon name="navigate-outline" size={22} color={Colors.bordeaux} />
        </View>

        <View style={card.info}>
          <Text style={card.labelText} numberOfLines={1}>{item.label}</Text>
          <View style={card.routeRow}>
            <Text style={card.routeText} numberOfLines={1}>{item.origin_label}</Text>
            <AppIcon name="arrow-forward-outline" size={12} color={Colors.textSecondary} />
            <Text style={card.routeText} numberOfLines={1}>{item.destination_label}</Text>
          </View>
        </View>

        <Text style={card.price}>{fmt(item.price, currencySymbol)}</Text>

        {/* 3 points verticaux */}
        <TouchableOpacity
          style={card.dotsBtn}
          onPress={(e) => { e.stopPropagation(); setMenuVisible(true); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppIcon name="ellipsis-vertical" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* future feature — badge surcharge passager */}
      {/* {item.pickup_surcharge > 0 && (
        <View style={card.badge}>
          <AppIcon name="person-add-outline" size={11} color={Colors.bordeaux} />
          <Text style={card.badgeText}>
            +{fmt(item.pickup_surcharge, currencySymbol)} / passager supplémentaire
          </Text>
        </View>
      )} */}

      {/* Statut */}
      <View style={card.statusRow}>
        <View style={[card.dot, { backgroundColor: item.is_active ? '#22C55E' : '#94A3B8' }]} />
        <Text style={card.statusText}>{item.is_active ? 'Actif' : 'Inactif'}</Text>
      </View>

      <ThreeDotMenu
        visible={menuVisible}
        onAction={onAction}
        onClose={() => setMenuVisible(false)}
      />
    </TouchableOpacity>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL CRÉATION
// ══════════════════════════════════════════════════════════════════════════════

function CreateModal({
  visible,
  currencySymbol,
  isSaving,
  onClose,
  onSave,
}: {
  visible: boolean;
  currencySymbol: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (form: FlatRateFormValues) => void;
}) {
  const [form, setForm] = useState<FlatRateFormValues>(emptyForm());
  const set = (k: keyof FlatRateFormValues) => (v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => { if (visible) setForm(emptyForm()); }, [visible]);

  const handleSave = () => {
    if (
      !form.label.trim() ||
      !form.origin_label.trim() ||
      !form.destination_label.trim() ||
      !form.price.trim()
    ) {
      Alert.alert('Champs requis', 'Tous les champs sont obligatoires.');
      return;
    }
    onSave(form);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.background ?? '#F5F5F5' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={hdr.container}>
          <TouchableOpacity
            onPress={onClose}
            style={hdr.side}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppIcon name="close-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={hdr.center}>
            <Text style={hdr.title}>Nouveau forfait</Text>
          </View>
          <View style={hdr.side} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={sec.container}>
            <Text style={sec.title}>Informations du forfait</Text>
            <View style={sec.body}>
              <Field
                label="Libellé *"
                value={form.label}
                onChange={set('label')}
                editable
                placeholder="Ex: Massy → Orly"
              />
              <Field
                label="Origine *"
                value={form.origin_label}
                onChange={set('origin_label')}
                editable
                placeholder="Ex: Gare de Massy"
              />
              <Field
                label="Destination *"
                value={form.destination_label}
                onChange={set('destination_label')}
                editable
                placeholder="Ex: Aéroport d'Orly"
              />
              <Field
                label={`Prix (${currencySymbol}) *`}
                value={form.price}
                onChange={set('price')}
                editable
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
              {/* future feature — surcharge passager */}
              {/* <Field
                label={`Surcharge / passager suppl. (${currencySymbol})`}
                value={form.pickup_surcharge}
                onChange={set('pickup_surcharge')}
                editable
                keyboardType="decimal-pad"
                placeholder="0.00"
              /> */}
            </View>
          </View>

          <LinearGradient
            colors={[Colors.bordeaux, Colors.bordeauxLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: Radius.lg }}
          >
            <TouchableOpacity
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.saveBtnText}>Créer le forfait</Text>
              }
            </TouchableOpacity>
          </LinearGradient>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉCRAN DÉTAIL FORFAIT
// ══════════════════════════════════════════════════════════════════════════════

function FlatRateDetailScreen({
  item,
  currencySymbol,
  isSaving,
  onBack,
  onSave,
  onDelete,
}: {
  item: PricingFlatRate;
  currencySymbol: string;
  isSaving: boolean;
  onBack: () => void;
  onSave: (id: string, form: FlatRateFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm]           = useState<FlatRateFormValues>(flatRateToForm(item));
  const [savedForm, setSavedForm] = useState<FlatRateFormValues>(flatRateToForm(item));

  const set = (k: keyof FlatRateFormValues) => (v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  // Resync si l'item change depuis le store (ex: après update)
  useEffect(() => {
    const f = flatRateToForm(item);
    setForm(f);
    setSavedForm(f);
  }, [item.id]);

  const handleToggleEdit = () => {
    if (isEditing) {
      Alert.alert(
        'Annuler les modifications',
        'Les modifications non enregistrées seront perdues.',
        [
          { text: 'Continuer', style: 'cancel' },
          {
            text: 'Annuler',
            style: 'destructive',
            onPress: () => { setForm(savedForm); setIsEditing(false); },
          },
        ]
      );
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!form.label.trim() || !form.price.trim()) {
      Alert.alert('Champs requis', 'Le libellé et le prix sont obligatoires.');
      return;
    }
    await onSave(item.id, form);
    setSavedForm(form);
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le forfait',
      `Voulez-vous vraiment supprimer le forfait "${item.label}" ?\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(item.id) },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background ?? '#F5F5F5' }}>
      <DetailHeader isEditing={isEditing} onBack={onBack} onToggleEdit={handleToggleEdit} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Bannière mode lecture ──────────────────────────────────── */}
          {!isEditing && (
            <View style={styles.readonlyBanner}>
              <AppIcon name="lock-closed-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.readonlyText}>
                Appuyez sur le crayon pour modifier ce forfait
              </Text>
            </View>
          )}

          {/* ── Champs éditables ──────────────────────────────────────── */}
          <View style={sec.container}>
            <Text style={sec.title}>Informations</Text>
            <View style={sec.body}>
              <Field
                label="Libellé"
                value={form.label}
                onChange={set('label')}
                editable={isEditing}
              />
              <Field
                label="Origine"
                value={form.origin_label}
                onChange={set('origin_label')}
                editable={isEditing}
              />
              <Field
                label="Destination"
                value={form.destination_label}
                onChange={set('destination_label')}
                editable={isEditing}
              />
              <Field
                label={`Prix (${currencySymbol})`}
                value={form.price}
                onChange={set('price')}
                editable={isEditing}
                keyboardType="decimal-pad"
              />
              {/* future feature — surcharge passager */}
              {/* <Field
                label={`Surcharge / passager suppl. (${currencySymbol})`}
                value={form.pickup_surcharge}
                onChange={set('pickup_surcharge')}
                editable={isEditing}
                keyboardType="decimal-pad"
              /> */}
            </View>
          </View>

          {/* ── Métadonnées système (lecture seule) ───────────────────── */}
          <View style={sec.container}>
            <Text style={sec.title}>Informations système</Text>
            <View style={sec.body}>
              <MetaRow label="Pays"       value={item.country === 'france' ? 'France' : 'Sénégal'} />
              <MetaRow label="Devise"     value={item.currency} />
              <MetaRow
                label="Statut"
                value={item.is_active ? 'Actif' : 'Inactif'}
                color={item.is_active ? '#22C55E' : '#94A3B8'}
              />
              <MetaRow label="Créé le"    value={new Date(item.created_at).toLocaleDateString('fr-FR')} />
              <MetaRow label="Modifié le" value={new Date(item.updated_at).toLocaleDateString('fr-FR')} />
            </View>
          </View>

          {/* ── Bouton enregistrer — mode édition uniquement ───────────── */}
          {isEditing && (
            <LinearGradient
              colors={[Colors.bordeaux, Colors.bordeauxLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: Radius.lg }}
            >
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                {isSaving
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
                }
              </TouchableOpacity>
            </LinearGradient>
          )}

          {/* ── Bouton supprimer — mode lecture uniquement ─────────────── */}
          {!isEditing && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <AppIcon name="trash-outline" size={18} color="#E53935" />
              <Text style={styles.deleteBtnText}>Supprimer ce forfait</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Ligne métadonnée ──────────────────────────────────────────────────────────
function MetaRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={meta.row}>
      <Text style={meta.label}>{label}</Text>
      <Text style={[meta.value, color ? { color } : undefined]}>{value}</Text>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉCRAN LISTE — AdminFlatRatesScreen
// ══════════════════════════════════════════════════════════════════════════════

export default function AdminFlatRatesScreen() {
  const {
    activeCountry,
    flatRates,
    isLoading,
    isSaving,
    error,
    clearError,
    currencySymbol,
    createFlatRate,
    updateFlatRate,
    deactivateFlatRate,
  } = usePricing();

  const [selectedItem,  setSelectedItem]  = useState<PricingFlatRate | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (error) Alert.alert('Erreur', error, [{ text: 'OK', onPress: clearError }]);
  }, [error]);

  // ── Chargement ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background ?? '#F5F5F5' }}>
        <ListHeader onAdd={() => {}} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
          <Text style={styles.loadingText}>Chargement des forfaits…</Text>
        </View>
      </View>
    );
  }

  // ── Vue détail ────────────────────────────────────────────────────────────
  if (selectedItem) {
    const fresh = flatRates.find(f => f.id === selectedItem.id) ?? selectedItem;
    return (
      <FlatRateDetailScreen
        item={fresh}
        currencySymbol={currencySymbol}
        isSaving={isSaving}
        onBack={() => setSelectedItem(null)}
        onSave={async (id, form) => {
          await updateFlatRate(id, {
            label:             form.label,
            origin_label:      form.origin_label,
            destination_label: form.destination_label,
            price:             toFloat(form.price),
            // pickup_surcharge: toFloat(form.pickup_surcharge), // future feature
          });
          showToast({ type: 'success', title: 'Enregistré', message: 'Le forfait a été mis à jour.' });
        }}
        onDelete={async (id) => {
          await deactivateFlatRate(id);
          setSelectedItem(null);
          showToast({ type: 'success', title: 'Supprimé', message: 'Le forfait a été désactivé.' });
        }}
      />
    );
  }

  // ── Actions rapides (menu 3 points) ──────────────────────────────────────
  const handleQuickAction = (item: PricingFlatRate) => (action: QuickAction) => {
    if (action === 'view' || action === 'edit') {
      setSelectedItem(item);
    } else if (action === 'delete') {
      Alert.alert(
        'Supprimer le forfait',
        `Voulez-vous vraiment supprimer le forfait "${item.label}" ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              await deactivateFlatRate(item.id);
              showToast({ type: 'success', title: 'Supprimé', message: 'Le forfait a été désactivé.' });
            },
          },
        ]
      );
    }
  };

  // ── Vue liste ─────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background ?? '#F5F5F5' }}>
      <ListHeader onAdd={() => setCreateVisible(true)} />

      <FlatList
        data={flatRates}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionCount}>
            {flatRates.length} forfait{flatRates.length !== 1 ? 's' : ''}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppIcon name="receipt-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucun forfait</Text>
            <Text style={styles.emptySubtitle}>
              Appuyez sur + pour créer votre premier forfait itinéraire
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <FlatRateCard
            item={item}
            currencySymbol={currencySymbol}
            onPress={() => setSelectedItem(item)}
            onAction={handleQuickAction(item)}
          />
        )}
      />

      <CreateModal
        visible={createVisible}
        currencySymbol={currencySymbol}
        isSaving={isSaving}
        onClose={() => setCreateVisible(false)}
        onSave={async (form) => {
          await createFlatRate({
            country:           activeCountry,
            currency:          activeCountry === 'france' ? 'EUR' : 'XOF',
            label:             form.label,
            origin_label:      form.origin_label,
            destination_label: form.destination_label,
            price:             toFloat(form.price),
            // pickup_surcharge: toFloat(form.pickup_surcharge), // future feature
          });
          setCreateVisible(false);
          showToast({ type: 'success', title: 'Créé', message: 'Le forfait a été créé avec succès.' });
        }}
      />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  sectionCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  readonlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface ?? '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.bordeaux,
  },
  readonlyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  saveBtn: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderRadius: Radius.lg,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E53935',
    borderRadius: Radius.lg,
    backgroundColor: '#FFF5F5',
  },
  deleteBtnText: {
    color: '#E53935',
    fontWeight: '600',
    fontSize: 15,
  },
});

// ── Card forfait ──────────────────────────────────────────────────────────────
const card = StyleSheet.create({
  container: {
    backgroundColor: Colors.white ?? '#fff',
    borderRadius: 12,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.bordeaux}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.bordeaux,
    marginRight: 4,
  },
  dotsBtn: {
    paddingHorizontal: 4,
  },
  // future feature — badge surcharge passager
  // badge: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   gap: 4,
  //   backgroundColor: `${Colors.bordeaux}10`,
  //   paddingHorizontal: 8,
  //   paddingVertical: 4,
  //   borderRadius: 6,
  //   alignSelf: 'flex-start',
  // },
  // badgeText: {
  //   fontSize: 11,
  //   color: Colors.bordeaux,
  //   fontWeight: '500',
  // },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

// ── ThreeDotMenu ──────────────────────────────────────────────────────────────
const menu = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  popover: {
    position: 'absolute',
    right: 24,
    top: '40%',
    backgroundColor: Colors.white ?? '#fff',
    borderRadius: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    minWidth: 180,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  itemText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border ?? '#E5E7EB',
  },
});

// ── Section ───────────────────────────────────────────────────────────────────
const sec = StyleSheet.create({
  container: {
    backgroundColor: Colors.white ?? '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  body: {
    marginTop: 8,
    gap: 4,
  },
});

// ── Field ─────────────────────────────────────────────────────────────────────
const fd = StyleSheet.create({
  container: {
    gap: 5,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border ?? '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.white ?? '#fff',
  },
  inputDisabled: {
    backgroundColor: Colors.surface ?? '#F9FAFB',
    color: Colors.textSecondary,
  },
});

// ── MetaRow ───────────────────────────────────────────────────────────────────
const meta = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border ?? '#F3F4F6',
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

// ── Header ────────────────────────────────────────────────────────────────────
const hdr = StyleSheet.create({
  container: {
    height: 100,
    backgroundColor: Colors.bordeaux,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 14,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  side: {
    width: 40,
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 32,
    height: 32,
  },
  title: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});