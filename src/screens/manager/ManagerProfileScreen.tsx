import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Platform, Modal, TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { zodResolver }       from '@hookform/resolvers/zod';
import { z }                 from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { Ionicons }          from '@expo/vector-icons';
import { useAlert } from '../../hooks/useAlert';
import * as ImagePicker      from 'expo-image-picker';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { FormField }         from '../../components/forms/FormField';
import { useAuth }           from '../../hooks/useAuth';
import { useToast }          from '../../hooks/useToast';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import type { ManagerDrawerParamList } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSION_LABELS } from '../../types';
import type { ManagerPermission } from '../../types';
import { AppHeader } from '../../components/common/AppHeader';

type Props = DrawerScreenProps<ManagerDrawerParamList, 'ManagerProfile'>;

// ── Règles checklist ───────────────────────────────────────────
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
  text:    { marginLeft: Spacing.xs, fontSize: Fonts.size.sm, color: Colors.textMuted },
  textOk:  { color: Colors.bordeauxLight },
});

// ── Schéma mot de passe ────────────────────────────────────────
const passwordSchema = z.object({
  current_password: z.string().min(1, 'Requis'),
  new_password:     z.string()
                      .min(8,         'Min. 8 caractères')
                      .regex(/[A-Z]/, 'Une majuscule requise')
                      .regex(/[0-9]/, 'Un chiffre requis'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path:    ['confirm_password'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

// ── Screen ─────────────────────────────────────────────────────
export default function ManagerProfileScreen({ navigation }: Props) {
  const { user, logout, changePassword, isLoading, error, clearError, login, updateProfile, uploadAvatar } = useAuth();
  const { permissions } = usePermissions();
  const { showAlert } = useAlert();
  const { showToast } = useToast();

  const [pendingImage,   setPendingImage]   = useState<string | null>(null); // sélectionnée, pas encore uploadée
  const [confirmedImage, setConfirmedImage] = useState<string | null>(null); // uploadée avec succès
  const [editMode,      setEditMode]      = useState(false);
  const [firstName,     setFirstName]     = useState(user?.first_name ?? '');
  const [lastName,      setLastName]      = useState(user?.last_name  ?? '');
  const [phone,         setPhone]         = useState(user?.phone      ?? '');
  const [email,         setEmail]         = useState(user?.email      ?? '');
  const [notifCourse,   setNotifCourse]   = useState(true);
  const [notifAlerte,   setNotifAlerte]   = useState(true);
  const [notifPromo,    setNotifPromo]    = useState(false);

  const [avatarKey, setAvatarKey] = useState(Date.now());

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();

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

  // ── Sauvegarde ─────────────────────────────────────────────
  const handleEditToggle = React.useCallback(async () => {
    if (editMode) {
      try {
        await updateProfile({ first_name: firstName, last_name: lastName, phone});        

        if (pendingImage) {
          const formData = new FormData();
          const filename = pendingImage.split('/').pop() || 'avatar.jpg';
          const type     = `image/${filename.split('.').pop() || 'jpg'}`;
          formData.append('avatar', { uri: pendingImage, name: filename, type } as any);
          await uploadAvatar(formData, pendingImage);
        
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

  const handleEditToggleRef = React.useRef(handleEditToggle);
  React.useEffect(() => {
    handleEditToggleRef.current = handleEditToggle;
  }, [handleEditToggle]);

  // ── Modal mot de passe ─────────────────────────────────────
  const [showPasswordModal, setShowPasswordModal] = useState(false);
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

  const handleDeleteAccount = () => {
    showAlert({
      title: 'Supprimer mon compte',
      message: 'Cette action est irréversible. Voulez-vous vraiment supprimer votre compte ?',
      buttons: [
        { text: 'Annuler',    style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: logout },
      ]
    });
  };

  const handleLogout = () => {
    showAlert({
      title: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter ?',
      buttons: [
        { text: 'Annuler',      style: 'cancel' },
        { text: 'Déconnecter', style: 'destructive', onPress: logout },
      ]
    });
  };

  // Priorité d'affichage : pending > confirmed > serveur
  const avatarUri = pendingImage ?? confirmedImage ?? user?.profile_photo_url;

  {avatarUri ? (
    <Image
      source={{ uri: avatarUri }}
      style={{ width: '100%', height: '100%', borderRadius: 50 }}
    />
  ) : (
    <Text style={styles.avatarInitials}>{initials}</Text>
  )}

  return (
    <View style={styles.flex}>
      <AppHeader
        left="menu"
        title="Mon compte"
        rightIcon={{
          name: editMode ? 'checkmark-outline' : 'pencil-outline',
          onPress: () => { if (!isLoading) handleEditToggleRef.current(); },
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

        {/* ── Infos personnelles ── */}
        <View style={styles.formSection}>
          <View style={styles.formSectionContainer}>
            <ProfileField label="Prénom"    value={firstName} editable={editMode} onChangeText={setFirstName} />
            <ProfileField label="Nom"       value={lastName}  editable={editMode} onChangeText={setLastName} />
            <ProfileField label="E-mail"    value={email} editable={false} />
            <ProfileField label="Téléphone" value={phone}     editable={editMode} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>
        </View>

                {/* Permissions accordées */}
       <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Mes permissions ({permissions.length}/{Object.keys(PERMISSION_LABELS).length})
          </Text>
          {permissions.length === 0 ? (
            <View style={styles.emptyPerms}>
              <Ionicons name="lock-closed-outline" size={24} color={Colors.border} />
              <Text style={styles.emptyPermsText}>Aucune permission accordée</Text>
            </View>
          ) : (
            permissions.map((perm: ManagerPermission) => (
              <View key={perm} style={styles.permRow}>
                <Ionicons name="checkmark-circle" size={16} color="#34C77B" />
                <Text style={styles.permLabel}>{PERMISSION_LABELS[perm]}</Text>
              </View>
            ))
          )}
        </View>

        {/* ── Préférences ── */}
        <View style={styles.section}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Préférences</Text>

            <View style={styles.prefRow}>
              <View style={styles.prefText}>
                <Text style={styles.prefLabel}>Mode disponible</Text>
                <Text style={styles.prefSub}>Recevoir de nouvelles courses</Text>
              </View>
              <Switch value={notifCourse} onValueChange={setNotifCourse}
                trackColor={{ false: Colors.border, true: Colors.bordeauxLight }} thumbColor={Colors.white} />
            </View>

            <View style={styles.divider} />

            <View style={styles.prefRow}>
              <View style={styles.prefText}>
                <Text style={styles.prefLabel}>Notifications</Text>
                <Text style={styles.prefSub}>Alertes de nouvelles courses</Text>
              </View>
              <Switch value={notifAlerte} onValueChange={setNotifAlerte}
                trackColor={{ false: Colors.border, true: Colors.bordeauxLight }} thumbColor={Colors.white} />
            </View>

            <View style={styles.divider} />

            <View style={styles.prefRow}>
              <View style={styles.prefText}>
                <Text style={styles.prefLabel}>Notifications promotions</Text>
                <Text style={styles.prefSub}>Offres, promotions et actualités</Text>
              </View>
              <Switch value={notifPromo} onValueChange={setNotifPromo}
                trackColor={{ false: Colors.border, true: Colors.bordeauxLight }} thumbColor={Colors.white} />
            </View>
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={styles.actionsSection}>

          <TouchableOpacity style={styles.actionRow} onPress={() => { reset(); clearError(); setShowPasswordModal(true); }}>
            <View style={styles.actionLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.actionLabel}>Changer le mot de passe</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Ionicons name="document-text-outline" size={20} color={Colors.bordeaux} />
              <Text style={[styles.actionLabel, { color: Colors.bordeaux }]}>CGU & Mentions légales</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.bordeaux} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
            <View style={styles.actionLeft}>
              <Ionicons name="log-out-outline" size={20} color={Colors.bordeaux} />
              <Text style={[styles.actionLabel, { color: Colors.bordeaux }]}>Se déconnecter</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.bordeaux} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={handleDeleteAccount}>
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

              {error && (
                <View style={modalStyles.errorBanner}>
                  <Text style={modalStyles.errorText}>⚠️ {error}</Text>
                </View>
              )}

              <FormField<PasswordForm>
                name="current_password"
                control={control}
                label="Mot de passe actuel *"
                secureTextEntry showToggle
                icon="lock-closed-outline"
                editable={!isLoading}
                error={errors.current_password?.message}
              />
              <FormField<PasswordForm>
                name="new_password"
                control={control}
                label="Nouveau mot de passe *"
                secureTextEntry showToggle
                icon="lock-closed-outline"
                editable={!isLoading}
                error={errors.new_password?.message}
              />
              <PasswordStrength value={newPasswordValue} />
              <FormField<PasswordForm>
                name="confirm_password"
                control={control}
                label="Confirmer le mot de passe *"
                secureTextEntry showToggle
                icon="lock-closed-outline"
                editable={!isLoading}
                error={errors.confirm_password?.message}
              />

              <View style={modalStyles.actions}>
                <TouchableOpacity
                  style={[modalStyles.btn, modalStyles.btnCancel]}
                  onPress={() => { reset(); clearError(); setShowPasswordModal(false); }}
                  disabled={isLoading}
                >
                  <Text style={modalStyles.btnCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modalStyles.btn, modalStyles.btnConfirm]}
                  onPress={handleSubmit(onChangePassword)}
                  disabled={isLoading}
                >
                  <Text style={modalStyles.btnConfirmText}>
                    {isLoading ? 'Envoi...' : 'Confirmer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Composant champ profil ─────────────────────────────────────
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
          selectionColor={Colors.bordeaux}
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
    paddingVertical:   Platform.OS === 'ios' ? Spacing.md : 0,
    backgroundColor:   Colors.surface,
  },
  inputDisabled:     { backgroundColor: Colors.placeHolder ?? '#F9F9F9' },
  input:             { fontSize: Fonts.size.md, color: Colors.textPrimary, minHeight: Platform.OS === 'android' ? 44 : undefined },
  inputTextDisabled: { color: Colors.textPlaceholder },
});

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing.xxl },

  avatarSection:  { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarCircle:   { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.beigeLight ?? '#F0EAE8', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: Fonts.size.xl, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.bordeaux },
  avatarEditBtn:  { marginTop: Spacing.sm },
  avatarEditText: { color: Colors.bordeaux, fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600' },

  formSection:          { paddingHorizontal: Spacing.lg },
  formSectionContainer: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },

  section:          { paddingHorizontal: Spacing.lg, marginTop: Spacing.sm },
  sectionTitle:     { fontSize: Fonts.size.md, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.bordeaux, marginBottom: Spacing.sm },
  sectionContainer: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },

  prefRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  prefText:  { flex: 1, paddingRight: Spacing.md },
  prefLabel: { fontSize: Fonts.size.md, color: Colors.textPrimary, fontFamily: Fonts.medium, fontWeight: '500' },
  prefSub:   { fontSize: Fonts.size.xs, color: Colors.textCallToAction, marginTop: 2 },

  actionsSection: { marginTop: Spacing.md, marginHorizontal: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md },
  actionRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md },
  actionLeft:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actionLabel:    { fontSize: Fonts.size.md, color: Colors.textPrimary, fontFamily: Fonts.medium, fontWeight: '500' },
  divider:        { height: 1, backgroundColor: Colors.border },

  emptyPerms:     { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  emptyPermsText: { fontSize: Fonts.size.sm, color: Colors.textMuted },

  permRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 },
  permLabel: { fontSize: Fonts.size.sm, color: Colors.textPrimary, flex: 1 },
});

const modalStyles = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  card:           { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, width: '100%', maxHeight: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 },
  title:          { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.lg },
  errorBanner:    { backgroundColor: Colors.errorLight, borderRadius: Radius.sm, borderLeftWidth: 3, borderLeftColor: Colors.error, padding: Spacing.md, marginBottom: Spacing.md },
  errorText:      { color: Colors.error, fontSize: Fonts.size.sm },
  actions:        { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  btn:            { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
  btnCancel:      { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  btnCancelText:  { color: Colors.textSecondary, fontFamily: Fonts.semibold, fontWeight: '600' },
  btnConfirm:     { backgroundColor: Colors.bordeaux },
  btnConfirmText: { color: Colors.white, fontFamily: Fonts.bold, fontWeight: '700' },
});