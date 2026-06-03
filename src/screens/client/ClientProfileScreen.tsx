import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Platform, Alert, Modal, TextInput,
} from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { z }           from 'zod';
import { FormField }   from '../../components/forms/FormField';
import { useForm, useWatch } from 'react-hook-form';
import { useAuth }     from '../../hooks/useAuth';
import { useToast }     from '../../hooks/useToast';
import { Ionicons }    from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { ClientTabParamList }   from '../../types/auth.types';
import { Logo }        from '../../constants/logo';


type Props = BottomTabScreenProps<ClientTabParamList, 'ClientProfile'>;

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
              {rule.label}
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
  const { user, logout, changePassword, isLoading, error, clearError, login, updateProfile, uploadAvatar } = useAuth();
  
  const [pendingImage,   setPendingImage]   = useState<string | null>(null); // sélectionnée, pas encore uploadée
  const [confirmedImage, setConfirmedImage] = useState<string | null>(null); // uploadée avec succès

  // État local des champs éditables
  const [editMode,   setEditMode]   = useState(false);
  const [firstName,  setFirstName]  = useState(user?.first_name ?? '');
  const [lastName,   setLastName]   = useState(user?.last_name  ?? '');
  const [phone,      setPhone]      = useState(user?.phone      ?? '');
  const [notifPromo, setNotifPromo] = useState(true);

  const [avatarKey, setAvatarKey] = useState(Date.now());

  const { showToast } = useToast();
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();

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

  const handleEditToggleRef = React.useRef(handleEditToggle);
  React.useEffect(() => {
    handleEditToggleRef.current = handleEditToggle;
  }, [handleEditToggle]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 20 }}
          onPress={() => handleEditToggleRef.current()}
          disabled={isLoading}
        >
          <Ionicons
            name={editMode ? 'checkmark-outline' : 'pencil-outline'}
            size={22}
            color={Colors.white}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, editMode, isLoading]);



  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Voulez-vous vraiment supprimer votre compte ?',
      [
        { text: 'Annuler',   style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: logout },
      ]
    );
  };

  // ── Modal mot de passe ──────────────────────────────────────
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


  // Priorité d'affichage : pending > confirmed > serveur
  const avatarUri = pendingImage ?? confirmedImage ?? user?.profile_photo_url;

  return (
    <View style={styles.flex}>

      {/* ── Header bordeaux ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image source={Logo.LogoEasyVTC} style={{ width: 40, height: 40 }} />
        </View>

        <TouchableOpacity style={styles.headerBtn} onPress={handleEditToggle} disabled={isLoading}>
          <Ionicons
            name={editMode ? 'checkmark-outline' : 'pencil-outline'}
            size={20}
            color={Colors.white}
          />
        </TouchableOpacity>
      </View>

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
            <View style={styles.prefRow}>
              <View style={styles.prefText}>
                <Text style={styles.prefLabel}>Notifications publicitaires</Text>
                <Text style={styles.prefSub}>Recevoir des offres et promotions</Text>
              </View>
              <Switch
                value={notifPromo}
                onValueChange={setNotifPromo}
                trackColor={{ false: Colors.border, true: Colors.bordeauxLight }}
                thumbColor={Colors.white}
              />
            </View>
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

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() =>
              Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
                { text: 'Annuler',      style: 'cancel' },
                { text: 'Déconnecter', style: 'destructive', onPress: logout },
              ])
            }
          >
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
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
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

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   Colors.bordeaux,
    paddingTop:        Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
    paddingBottom:     Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerBtn:    { padding: Spacing.sm },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  headerTitle:  { color: Colors.white, fontWeight: '700', fontSize: Fonts.size.md },

  scroll: { paddingBottom: Spacing.xxl },

  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarCircle: {
    width:           80, height: 80,
    borderRadius:    40,
    backgroundColor: Colors.beigeLight ?? '#F0EAE8',
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarInitials: { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.bordeaux },
  avatarEditBtn:  { marginTop: Spacing.sm },
  avatarEditText: { color: Colors.bordeaux, fontSize: Fonts.size.sm, fontWeight: '600' },

  formSection:          { paddingHorizontal: Spacing.lg },
  formSectionContainer: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    padding:         Spacing.md,
  },

  section:      { paddingHorizontal: Spacing.lg, marginTop: Spacing.sm },
  sectionTitle: { fontSize: Fonts.size.md, fontWeight: '800', color: Colors.bordeaux, marginBottom: Spacing.sm },
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
  prefLabel: { fontSize: Fonts.size.md, color: Colors.textPrimary, fontWeight: '500' },
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
  actionLabel: { fontSize: Fonts.size.md, color: Colors.textPrimary, fontWeight: '500' },
  divider:     { height: 1, backgroundColor: Colors.border },
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
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.15,
    shadowRadius:    16,
    elevation:       10,
  },
  title: {
    fontSize:     Fonts.size.lg,
    fontWeight:   '800',
    color:        Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  btn: {
    flex:            1,
    paddingVertical: Spacing.md,
    borderRadius:    Radius.md,
    alignItems:      'center',
  },
  btnCancel:      { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  btnCancelText:  { color: Colors.textSecondary, fontWeight: '600' },
  btnConfirm:     { backgroundColor: Colors.bordeaux },
  btnConfirmText: { color: Colors.white, fontWeight: '700' },
});