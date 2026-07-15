import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Platform, Modal, TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import * as FileSystem from 'expo-file-system/legacy';
import { Paths } from 'expo-file-system';
import { z }           from 'zod';
import { FormField }   from '../../components/forms/FormField';
import { useFocusEffect } from '@react-navigation/native';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { useAuth }     from '../../hooks/useAuth';
import { useAlert } from '../../hooks/useAlert';
import { useToast }     from '../../hooks/useToast';
import { Ionicons }    from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ClientTabParamList, ClientStackParamList } from '../../types/auth.types';
import { useAuthStore } from '../../store/auth.store';
import { useMarketingStore } from '../../store/marketing.store';
import { AppHeader }   from '../../components/common/AppHeader';


type Props = CompositeScreenProps<
  BottomTabScreenProps<ClientTabParamList, 'ClientProfile'>,
  NativeStackScreenProps<ClientStackParamList>
>;

// ── Règles mot de passe ─────────────────────────────────────────
const PASSWORD_RULES = [
  { label: 'Au moins 8 caractères', test: (v: string) => v.length >= 8 },
  { label: 'Une lettre majuscule',  test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Un chiffre',            test: (v: string) => /[0-9]/.test(v) },
];

function PasswordStrength({ value }: { value: string }) {
  return (
    <View style={strengthStyles.wrapper}>
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value ?? '');
        return (
          <View key={rule.label} style={strengthStyles.row}>
            <Ionicons
              name={ok ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={ok ? Colors.bordeauxLight : Colors.textMuted}
            />
            <Text style={[strengthStyles.text, ok && strengthStyles.textOk]}>
              {rule.label}{'  '}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const strengthStyles = StyleSheet.create({
  wrapper: { marginTop: -Spacing.xs, marginBottom: Spacing.md },
  row:     { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  text:    { marginLeft: Spacing.xs, fontSize: Fonts.size.sm, color: Colors.textCallToAction, opacity: 0.8 },
  textOk:  { color: Colors.bordeauxLight },
});

function PrefRow({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void; }) {
  return (
    <View style={styles.prefRow}>
      <View style={styles.prefText}>
        <Text style={styles.prefLabel}>{label}</Text>
        <Text style={styles.prefSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.border, true: Colors.bordeauxLight }}
        thumbColor={value ? Colors.white : Colors.surface}
        style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
      />
    </View>
  );
}

// ── Schéma mot de passe ─────────────────────────────────────────
const passwordSchema = z.object({
  current_password: z.string().min(1, 'Requis'),
  new_password:     z.string()
                      .min(8,        'Min. 8 caractères')
                      .regex(/[A-Z]/, 'Une majuscule requise')
                      .regex(/[0-9]/, 'Un chiffre requis'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

// ── Écran ───────────────────────────────────────────────────────
export default function ClientProfileScreen({ navigation }: Props) {
  const { user, logout, changePassword, isLoading, error, clearError, login, updateProfile, uploadAvatar, exportMyData, anonymizeMyAccount } = useAuth();
  const accessToken = useAuthStore(s => s.accessToken);
  const { fetchMyMarketingProfile } = useMarketingStore();
  const _updateMyMarketingConsents = useMarketingStore(s => s.updateMyMarketingConsents);
  
  const [pendingImage,   setPendingImage]   = useState<string | null>(null); // sélectionnée, pas encore uploadée
  const [confirmedImage, setConfirmedImage] = useState<string | null>(null); // uploadée avec succès

  // État local des champs éditables
  const [editMode,   setEditMode]   = useState(false);
  const [firstName,  setFirstName]  = useState(user?.first_name ?? ''); 
  const [lastName,   setLastName]   = useState(user?.last_name  ?? ''); 
  const [phone,      setPhone]      = useState(user?.phone      ?? '');

  const [avatarKey, setAvatarKey] = useState(Date.now());

  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();

  useFocusEffect(
    React.useCallback(() => {
      if (accessToken) fetchMyMarketingProfile(accessToken);
    }, [accessToken, fetchMyMarketingProfile])
  );


  // ── Galerie photo ──────────────────────────────────────────
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPendingImage(result.assets[0].uri);
  };

  const handleConsentChange = async (type: 'email' | 'sms' | 'push', value: boolean) => {
    if (!accessToken) return;

    try {
      const dto = {
        ...(type === 'email' && { marketing_email_opt_in: value }),
        ...(type === 'sms'   && { marketing_sms_opt_in:   value }),
        ...(type === 'push'  && { marketing_push_opt_in:  value }),
      };
      await _updateMyMarketingConsents(accessToken, dto);
      showToast({ type: 'success', title: 'Préférences mises à jour', message: 'Vos choix ont été enregistrés.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Erreur', message: 'Impossible de sauvegarder vos préférences.' });
    }
  };

  // ── Sauvegarde ─────────────────────────────────────────────
  const handleEditToggle = React.useCallback(async () => {
    if (editMode) {
      try {
        await updateProfile({ first_name: firstName, last_name: lastName, phone });

        if (pendingImage) {
          const formData = new FormData();
          const filename = pendingImage.split('/').pop() || 'avatar.jpg';
          const type     = `image/${filename.split('.').pop() || 'jpg'}`;
          formData.append('avatar', { uri: pendingImage, name: filename, type } as any);
          await uploadAvatar(formData);
        
          setConfirmedImage(pendingImage); 
          setPendingImage(null);
        }

        showToast({ type: 'success', title: 'Succès', message: 'Profil mis à jour avec succès.' });
      } catch (err) {
        if (__DEV__) console.error('Update error:', err);
        showToast({ type: 'error', title: 'Erreur', message: 'Impossible de sauvegarder les modifications.' });
        return;
      }
    }
    setEditMode(prev => !prev);
  }, [editMode, firstName, lastName, phone, pendingImage, confirmedImage, updateProfile, uploadAvatar]);

  // ── Modal mot de passe ──────────────────────────────────────
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });
  const newPasswordValue = useWatch({ control, name: 'new_password', defaultValue: '' });

  const onChangePassword = async (data: PasswordForm) => {
    clearError();
    try {
      await changePassword(data.current_password, data.new_password, data.confirm_password);
      await login({ email: user!.email, password: data.new_password });
      showToast({ type: 'success', title: 'Succès', message: 'Votre mot de passe a été changé avec succès.' });
      reset();
      setShowPasswordModal(false);
    } catch (err) {
      if (__DEV__) console.error('Reset password error:', err);
      showToast({ type: 'error', title: 'Erreur', message: 'Impossible de changer le mot de passe. Vérifiez vos informations.' });
    }
  };

  const handleAnonymize = async (password: string) => {
    if (!password) {
      showToast({ type: 'error', title: 'Erreur', message: 'Le mot de passe est requis.' });
      return;
    }
    try {
      await anonymizeMyAccount(password);
      showToast({ type: 'success', title: 'Compte supprimé', message: 'Votre compte et vos données ont été supprimés.' });
      setShowDeleteModal(false);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Erreur', message: err.message ?? 'Impossible de supprimer le compte.' });
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportMyData();
      const jsonString = JSON.stringify(data, null, 2);
      const fileUri = `${Paths.document.uri}/easyvtc_export_${user!.id}.json`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Erreur', message: 'Impossible d\'exporter vos données.' });
    }
  };

  // Priorité d'affichage : pending > confirmed > serveur
  const avatarUri = pendingImage ?? confirmedImage ?? user?.profile_photo_url;
  const myProfile = useMarketingStore(s => s.myProfile);
  return (
    <View style={styles.flex}>

      {/* ── Header bordeaux ── */}
      <AppHeader
        left="none"
        title="Mon compte"
        rightIcon={{
          name: editMode ? 'checkmark-outline' : 'pencil-outline',
          onPress: () => { if (!isLoading) handleEditToggle(); },
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            {(pendingImage ?? confirmedImage ?? user?.profile_photo_url) ? (
              <Image
                source={{ uri: pendingImage ?? confirmedImage ?? user?.profile_photo_url ?? undefined }}
                style={{ width: '100%', height: '100%', borderRadius: 50 }}
              />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>
          
          {editMode && (
            <TouchableOpacity onPress={pickImage} style={styles.avatarEditBtn}>
              <Text style={styles.avatarEditText}>
                {pendingImage ? 'Changer la photo' : 'Modifier la photo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        


        {/* ── Champs infos ── */}
        <View style={styles.formSection}>
          <View style={styles.formSectionContainer}>
            <ProfileField
              label="Prénom"
              value={firstName}
              editable={editMode}
              onChangeText={setFirstName}
            />
            <ProfileField
              label="Nom"
              value={lastName}
              editable={editMode}
              onChangeText={setLastName}
            />
            <ProfileField
              label="Email"
              value={user?.email ?? ''}
              editable={false}
            />
            <ProfileField
              label="Téléphone"
              value={phone}
              editable={editMode}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* ── Préférences ── */}
        <View style={styles.section}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Préférences</Text>
            <PrefRow
              label="Offres par Email"
              sub="Recevoir nos promotions par email"
              value={myProfile?.marketing_email_opt_in ?? false}
              onChange={(val) => handleConsentChange('email', val)}
            />
            <View style={styles.divider} />
            {/* <PrefRow
              label="Offres par SMS"
              sub="Recevoir nos promotions par SMS"
              value={myProfile?.marketing_sms_opt_in ?? false}
              onChange={(val) => handleConsentChange('sms', val)}
            />
            <View style={styles.divider} /> */}
            <PrefRow
              label="Notifications Push"
              sub="Recevoir nos offres via l'application"
              value={myProfile?.marketing_push_opt_in ?? false}
              onChange={(val) => handleConsentChange('push', val)}
            />
          </View>
        </View>

        {/* ── Documents financiers (S4) ── */}
        <View style={styles.section}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Documents</Text>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('MyOrders')}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="document-text-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.actionLabel}>Mes bons de commande</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('MyInvoices')}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="receipt-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.actionLabel}>Mes factures</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('CGU')}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="document-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.actionLabel}>Conditions Générales d'Utilisation</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => { reset(); clearError(); setShowPasswordModal(true); }}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.actionLabel}>Changer le mot de passe</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={handleExportData} disabled={isLoading}>
            <View style={styles.actionLeft}>
              <Ionicons name="download-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.actionLabel}>Exporter mes données</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.actionRow, styles.logoutRow]}
            testID="profile-logout-btn"
            onPress={() => {
              showAlert({title: 'Déconnexion', message: 'Voulez-vous vraiment vous déconnecter ?', buttons: [
                { text: 'Annuler',      style: 'cancel' },
                { text: 'Déconnecter', style: 'destructive', onPress: logout },
              ]});
            }}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="log-out-outline" size={20} color={Colors.bordeaux} />
              <Text style={[styles.actionLabel, styles.logoutLabel]}>Se déconnecter</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.bordeaux} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={() => {
            showAlert({
              title: 'Supprimer mon compte',
              message: 'Cette action est irréversible. Pour confirmer, veuillez saisir votre mot de passe.',
              buttons: [{ text: 'Annuler', style: 'cancel' }, { text: 'Continuer', onPress: () => setShowDeleteModal(true) }]
            });
          }}>
            <View style={styles.actionLeft}>
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
              <Text style={[styles.actionLabel, { color: Colors.error }]}>Supprimer mon compte</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Modal mot de passe ── */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => { reset(); clearError(); setShowPasswordModal(false); }}
      >
        <KeyboardAvoidingView
          style={modalStyles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={modalStyles.card}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={modalStyles.title}>Changer le mot de passe</Text>

              <FormField<PasswordForm>
                name="current_password"
                control={control}
                label="Mot de passe actuel *"
                secureTextEntry
                showToggle
                editable={!isLoading}
                error={errors.current_password?.message}
              />
              <FormField<PasswordForm>
                name="new_password"
                control={control}
                label="Nouveau mot de passe *"
                secureTextEntry
                showToggle
                editable={!isLoading}
                error={errors.new_password?.message}
              />
              <PasswordStrength value={newPasswordValue} />
              <FormField<PasswordForm>
                name="confirm_password"
                control={control}
                label="Confirmer le mot de passe *"
                secureTextEntry
                showToggle
                error={errors.confirm_password?.message}
              />

              <View style={modalStyles.actions}>
                <TouchableOpacity
                  style={[modalStyles.btn, modalStyles.btnCancel]}
                  onPress={() => { reset(); setShowPasswordModal(false); }}
                >
                  <Text style={modalStyles.btnCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modalStyles.btn, modalStyles.btnConfirm]}
                  onPress={handleSubmit(onChangePassword)}
                  disabled={isLoading}
                >
                  <Text style={modalStyles.btnConfirmText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal Suppression Compte ── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setDeletePassword(''); setShowDeleteModal(false); }}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
            <Text style={modalStyles.title}>Supprimer le compte</Text>
            <Text style={modalStyles.warningText}>
              Cette action est irréversible. Pour confirmer, veuillez saisir votre mot de passe.
            </Text>

            <View style={fieldStyles.wrapper}>
              <Text style={fieldStyles.label}>Mot de passe</Text>
              <View style={fieldStyles.inputWrapper}>
                <TextInput
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  editable={!isLoading}
                  secureTextEntry
                  style={fieldStyles.input}
                  selectionColor={Colors.bordeaux}
                  underlineColorAndroid="transparent"
                  placeholder="Saisissez votre mot de passe"
                />
              </View>
            </View>

            <View style={modalStyles.actions}>
              <TouchableOpacity
                style={[modalStyles.btn, modalStyles.btnCancel]}
                onPress={() => { setDeletePassword(''); setShowDeleteModal(false); }}
              >
                <Text style={modalStyles.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.btn, modalStyles.btnDelete]}
                onPress={() => handleAnonymize(deletePassword)}
                disabled={isLoading}
              >
                <Text style={modalStyles.btnConfirmText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── ProfileField ────────────────────────────────────────────────
function ProfileField({
  label, value, editable, onChangeText, keyboardType,
}: {
  label:          string;
  value:          string;
  editable:       boolean;
  onChangeText?:  (text: string) => void;
  keyboardType?:  'default' | 'phone-pad' | 'email-address';
}) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={[fieldStyles.inputWrapper, !editable && fieldStyles.inputDisabled]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          keyboardType={keyboardType ?? 'default'}
          style={[fieldStyles.input, !editable && fieldStyles.inputTextDisabled]}
          // iOS : pas de curseur bleu sur les champs désactivés
          selectionColor={Colors.bordeaux}
          // Android : retire le soulignement natif
          underlineColorAndroid="transparent"
        />
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label:   { fontSize: Fonts.size.sm, color: Colors.textCallToAction, marginBottom: Spacing.xs },

  inputWrapper: {
    borderWidth:       1,
    borderColor:       Colors.border,
    borderRadius:      Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Platform.OS === 'ios' ? Spacing.md : 0, // Android gère son propre padding
    backgroundColor:   Colors.surface,
  },
  inputDisabled: { backgroundColor: Colors.placeHolder ?? '#F9F9F9' },

  input: {
    fontSize:  Fonts.size.md,
    color:     Colors.textPrimary,
    // hauteur minimale pour Android
    minHeight: Platform.OS === 'android' ? 44 : undefined,
  },
  inputTextDisabled: { color: Colors.textPlaceholder },
});

// ── Styles globaux ──────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },

  scroll: { paddingBottom: Spacing.xxl },

  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarCircle: {
    width:           80, height: 80,
    borderRadius:    40,
    backgroundColor: Colors.beigeLight ?? '#F0EAE8',
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarInitials: { fontSize: Fonts.size.xl, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.bordeaux },
  avatarEditBtn:  { marginTop: Spacing.sm },
  avatarEditText: { color: Colors.bordeaux, fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600' },

  formSection:          { paddingHorizontal: Spacing.lg },
  formSectionContainer: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    padding:         Spacing.md,
  },

  section:      { paddingHorizontal: Spacing.lg, marginTop: Spacing.sm },
  sectionTitle: { fontSize: Fonts.size.md, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.bordeaux, marginBottom: Spacing.sm },
  sectionContainer: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    padding:         Spacing.md,
  },
  prefRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingVertical: Spacing.sm,
  },
  prefText:  { flex: 1, paddingRight: Spacing.md },
  prefLabel: { fontSize: Fonts.size.md, color: Colors.textPrimary, fontFamily: Fonts.medium, fontWeight: '500' },
  prefSub:   { fontSize: Fonts.size.xs, color: Colors.textCallToAction, marginTop: 2 },

  actionsSection: {
    marginTop:         Spacing.md,
    marginHorizontal:  Spacing.lg,
    backgroundColor:   Colors.surface,
    borderRadius:      Radius.md,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    paddingHorizontal: Spacing.md,
  },
  actionRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical: Spacing.md,
  },
  actionLeft:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actionLabel: { fontSize: Fonts.size.md, color: Colors.textPrimary, fontFamily: Fonts.medium, fontWeight: '500' },
  divider:     { height: 1, backgroundColor: Colors.border },
  logoutRow:   { backgroundColor: Colors.overlayLight, borderRadius: Radius.md, marginVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
  logoutLabel: { color: Colors.bordeaux, fontFamily: Fonts.bold, fontWeight: '700' },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent:  'center',
    alignItems:      'center',
    padding:         Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.lg,
    padding:         Spacing.lg,
    width:           '100%',
    maxHeight:       '90%',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.15,
    shadowRadius:    16,
    elevation:       10,
  },
  title: {
    fontSize:     Fonts.size.lg,
    fontFamily: Fonts.bold, fontWeight:   '800',
    color:        Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  warningText: {
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  btn: {
    flex:            1,
    paddingVertical: Spacing.md,
    borderRadius:    Radius.md,
    alignItems:      'center',
  },
  btnCancel:      { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  btnCancelText:  { color: Colors.textSecondary, fontFamily: Fonts.semibold, fontWeight: '600' },
  btnConfirm:     { backgroundColor: Colors.bordeaux },
  btnDelete:      { backgroundColor: Colors.error },
  btnConfirmText: { color: Colors.white, fontFamily: Fonts.bold, fontWeight: '700' },
});