import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../../hooks/useAdmin';
import { Colors, Spacing, Radius } from '../../../theme/colors';
import type { UserProfile } from '../../../types';
import ChangeStatusModal from '../../../components/common/ChangeStatusModal';

// ── Données statiques pour les selects ────────────────────────────────────────
const POSTES    = ['Gestionnaire', 'Adjoint'];
const ZONES     = ['Paris Est (11e, 12e, 20e…)', 'Paris Ouest', 'Paris Nord', 'Paris Sud'];
const STATUTS   = ['Actif', 'Inactif', 'En congé'];
const PRIORITES = ['Gestionnaire prioritaire', 'Standard'];

// ── FieldInput ─────────────────────────────────────────────────────────────────
interface FieldInputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  required?: boolean;
}

function FieldInput({
  label, value, onChangeText, placeholder, error,
  keyboardType = 'default', autoCapitalize = 'sentences', required = false,
}: FieldInputProps) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>
        {label}{required && <Text style={fieldStyles.required}> *</Text>}
      </Text>
      <TextInput
        style={[fieldStyles.input, error ? fieldStyles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textPlaceholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {error ? <Text style={fieldStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

// ── FieldSelect ────────────────────────────────────────────────────────────────
interface FieldSelectProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  required?: boolean;
  /** Affiche un dot coloré devant la valeur (pour Statut) */
  withStatusDot?: boolean;
  /** Affiche une icône étoile devant la valeur (pour Priorité) */
  withStarIcon?: boolean;
}

function FieldSelect({
  label, value, options, onSelect, required,
  withStatusDot = false, withStarIcon = false,
}: FieldSelectProps) {
  const [open, setOpen] = useState(false);
  const isActive = value === 'Actif';

  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>
        {label}{required && <Text style={fieldStyles.required}> *</Text>}
      </Text>
      <TouchableOpacity
        style={fieldStyles.select}
        onPress={() => setOpen((p) => !p)}
        activeOpacity={0.7}
      >
        {/* Dot statut */}
        {withStatusDot && value && (
          <View style={[
            fieldStyles.statusDot,
            { backgroundColor: isActive ? '#34C77B' : '#E53935' },
          ]} />
        )}
        {/* Étoile priorité */}
        {withStarIcon && value && (
          <Text style={{ fontSize: 16 }}>⭐</Text>
        )}
        <Text style={[fieldStyles.selectValue, !value && { color: Colors.textPlaceholder }]}>
          {value || 'Choisir…'}
        </Text>
        <Ionicons
          name={open ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={16}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>

      {open && (
        <View style={fieldStyles.dropdown}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[fieldStyles.dropdownItem, value === opt && fieldStyles.dropdownItemActive]}
              onPress={() => { onSelect(opt); setOpen(false); }}
            >
              <Text style={[fieldStyles.dropdownText, value === opt && fieldStyles.dropdownTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.sm },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  required: { color: Colors.error },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    height: 44,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  inputError: { borderColor: Colors.error },
  errorText: { fontSize: 11, color: Colors.error, marginTop: 3 },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    height: 44,
    backgroundColor: Colors.white,
  },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  selectValue: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  dropdown: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
    marginTop: 2,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemActive: { backgroundColor: Colors.beigeLight },
  dropdownText: { fontSize: 14, color: Colors.textPrimary },
  dropdownTextActive: { color: Colors.bordeauxLight, fontWeight: '600' },
});

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function EditManagerScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { managerId } = route.params as { managerId: string };

  const { fetchManagerById, changeManagerStatus, user } = useAdmin();

  const [manager, setManager]   = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // ── Champs ────────────────────────────────────────────────────────────────
  const [fullName,    setFullName]    = useState('');
  const [poste,       setPoste]       = useState('');
  const [zone,        setZone]        = useState('');
  const [statut,      setStatut]      = useState('Actif');
  const [priorite,    setPriorite]    = useState('');
  const [email,       setEmail]       = useState('');
  const [phone,       setPhone]       = useState('');
  const [zoneContact, setZoneContact] = useState('');

  // ── Chargement initial ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchManagerById(managerId);
        if (data) {
          setManager(data);
          setFullName(`${data.first_name ?? ''} ${data.last_name ?? ''}`.trim());
          setPoste(data.role ?? 'Gestionnaire');
          setZone((data as UserProfile).zone ?? 'Paris Est (11e, 12e, 20e…)' );
          setStatut(data.status === 'active' ? 'Actif' : 'Inactif');
          setPriorite(data.priorite ?? '');
          setEmail(data.email ?? '');
          setPhone(data.phone ?? '');
          setZoneContact(data.zone_contact ?? '');
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [managerId]);

  // ── Soumission ─────────────────────────────────────────────────────────────
  const handleStatusChange = async (newStatus: 'active' | 'inactive' | 'locked', reason: string) => {
    if (!manager) return;
    setIsSaving(true);
    try {
      const updatedManager = await changeManagerStatus(manager.id, { status: newStatus, reason });
      setManager(updatedManager);
      setStatut(updatedManager?.status === 'active' ? 'Actif' : 'Inactif');
      setModalVisible(false);

      Alert.alert(
        'Succès',
        'Le statut du gestionnaire a été mis à jour.',
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  const onSelectStatus = (newStatusLabel: string) => {
    setStatut(newStatusLabel);
    setModalVisible(true);
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.bordeauxLight} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header : titre gauche + bouton "Sauvegarder" droite ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Modifier le Gestionnaire</Text>
      </View>

      {/* ── Bandeau identité sous le header (avatar + nom) ── */}
      <View style={styles.identityBanner}>
        {manager?.profile_photo_url ? (
          <Image source={{ uri: manager.profile_photo_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>
              {manager?.first_name?.[0]}{manager?.last_name?.[0]}
            </Text>
          </View>
        )}
        <Text style={styles.bannerName}>{fullName || 'Gestionnaire'}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{marginBottom: Spacing.md, elevation: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md }}>
          {/* ── Nom complet ── */}
        <FieldInput
          label="Nom complet"
          value={fullName}
          onChangeText={() => {}}
          placeholder="Marie Dubois"
          // editable={false}
          required
        />

        {/* ── Poste + Zone de couverture ── */}
        <View style={styles.row}>
          <View style={styles.col}>
              <FieldSelect
                label="Poste"
                value={poste}
                options={POSTES}
                onSelect={() => {}}
                required
              />
            </View>
            <View style={styles.col}>
              <FieldSelect
                label="Zone de couverture"
                value={zone}
                options={ZONES}
                onSelect={() => {}}
                required
              />
            </View>
          </View>

          {/* ── Statut + Niveau de priorité ── */}
          <View style={styles.row}>
            <View style={styles.col}>
              <FieldSelect
                label="Statut"
                value={statut}
                options={STATUTS}
                onSelect={onSelectStatus}
                withStatusDot
              />
            </View>
            <View style={styles.col}>
              <FieldSelect
                label="Niveau de priorité"
                value={priorite}
                options={PRIORITES}
                onSelect={() => {}}
                withStarIcon
              />
            </View>
          </View>
        </View>

        {/* ── Section Informations de contact ── */}
        <View style={{ elevation: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={18} color={Colors.bordeauxLight} />
            <Text style={styles.sectionTitle}>Informations de contact</Text>
          </View>

          <FieldInput
            label="Courriel professionnel"
            value={email}
            onChangeText={() => {}}
            placeholder="marie.dubois@easyvtc.fr"
            // editable={false}
            required
          />

          <FieldInput
            label="Téléphone direct"
            value={phone}
            onChangeText={() => {}}
            placeholder="+33123456789"
            // editable={false}
            required
          />

          <FieldInput
            label="Zone de couverture"
            value={zoneContact}
            onChangeText={() => {}}
            placeholder="Paris Est"
            // editable={false}
          />
        </View>

        {/* Espace bas pour le FAB */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FAB + */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Ionicons name="add-outline" size={26} color={Colors.white} />
      </TouchableOpacity>

      <ChangeStatusModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleStatusChange}
        currentStatus={manager?.status ?? 'inactive'}
        userName={`${manager?.first_name} ${manager?.last_name}`}
        isSaving={isSaving}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bordeaux,
    paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerBtn: { padding: Spacing.sm, width: 40 },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: Spacing.sm,
    lineHeight: 20,
  },
  /** Bouton "Sauvegarder" blanc dans le header (Image 2) */
  saveHeaderBtn: {
    backgroundColor: Colors.white,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  saveHeaderBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.bordeauxDark,
  },

  // ── Bandeau identité ────────────────────────────────────────────────────────
  identityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bordeaux,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  avatar: { width: 50, height: 50, borderRadius: 24 },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: { fontSize: 18, fontWeight: '700', color: Colors.white },
  bannerName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },

  // ── Formulaire ──────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: 100 },

  row: { flexDirection: 'row', gap: Spacing.sm, zIndex: -1 },
  col: { flex: 1 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: -1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.bordeauxDark,
  },

  // ── États ───────────────────────────────────────────────────────────────────
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── FAB ─────────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.bordeauxLight,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.bordeauxDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
});