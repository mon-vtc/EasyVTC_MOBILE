// screens/driver/DriverProfileScreen.tsx
import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Platform, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { zodResolver }       from '@hookform/resolvers/zod';
import { z }                 from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { Ionicons }          from '@expo/vector-icons';
import { useAlert } from '../../hooks/useAlert';
import * as ImagePicker      from 'expo-image-picker';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { FormField }         from '../../components/forms/FormField';
import { useDriver }         from '../../hooks/useDriver';
import type { VehicleType, ZoneType, Vehicle } from '../../types/user.types';
import type { DrawerScreenProps }     from '@react-navigation/drawer';
import type { DriverDrawerParamList } from '../../types';
import { useToast } from '../../hooks/useToast';


type Props = DrawerScreenProps<DriverDrawerParamList, 'DriverProfile'>;

// ── Password rules ──────────────────────────────────────────────
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
            <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={16}
              color={ok ? Colors.bordeauxLight : Colors.textMuted} />
            <Text style={[strengthStyles.text, ok && strengthStyles.textOk]}>{rule.label}</Text>
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

// ── Password schema ─────────────────────────────────────────────
const passwordSchema = z.object({
  current_password: z.string().min(1, 'Requis'),
  new_password: z.string()
    .min(8, 'Min. 8 caractères')
    .regex(/[A-Z]/, 'Une majuscule requise')
    .regex(/[0-9]/, 'Un chiffre requis'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path:    ['confirm_password'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

// ══════════════════════════════════════════════════════════════
// MODAL — Création véhicule (2 étapes)
// ══════════════════════════════════════════════════════════════
interface CreateVehicleModalProps {
  visible:     boolean;
  isLoading:   boolean;
  onClose:     () => void;
  onCreate:    (data: { plate_number: string; brand: string; model: string; year?: number; color?: string; type: VehicleType }) => Promise<string>; // retourne vehicleId
  onUploadPhoto: (vehicleId: string, formData: FormData) => Promise<Vehicle>;
}

function CreateVehicleModal({ visible, isLoading, onClose, onCreate, onUploadPhoto }: CreateVehicleModalProps) {
  const [step, setStep]               = useState<1 | 2>(1);
  const [createdVehicleId, setCreatedVehicleId] = useState<string | null>(null);
  const { showToast } = useToast();

  // Étape 1
  const [plate, setPlate]   = useState('');
  const [brand, setBrand]   = useState('');
  const [model, setModel]   = useState('');
  const [year,  setYear]    = useState('');
  const [color, setColor]   = useState('');
  const [type,  setType]    = useState<VehicleType>('standard');

  // Étape 2
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setStep(1); setPlate(''); setBrand(''); setModel('');
    setYear(''); setColor(''); setType('standard');
    setPhotoUri(null); setCreatedVehicleId(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleCreate = async () => {
    if (!plate.trim() || !brand.trim() || !model.trim()) {
      showToast({type: 'error', title: 'Champs requis', message : 'Plaque, marque et modèle sont obligatoires.'});
      return;
    }
    try {
      const vehicleId = await onCreate({
        plate_number: plate.trim(),
        brand:        brand.trim(),
        model:        model.trim(),
        color:        color.trim() || undefined,
        year:         year ? Number(year) : undefined,
        type,
      });
      setCreatedVehicleId(vehicleId);
      setStep(2);
    } catch (err: any) {
      showToast({type: 'error', title: 'Erreur', message : err.message ?? 'Impossible de créer le véhicule.'});
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handleUpload = async () => {
    if (!createdVehicleId || !photoUri) { handleClose(); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      const filename = photoUri.split('/').pop() || 'vehicle.jpg';
      const mimeType = `image/${filename.split('.').pop() || 'jpg'}`;
      formData.append('photo', { uri: photoUri, name: filename, type: mimeType } as any);
      await onUploadPhoto(createdVehicleId, formData);
      showToast({ type: 'success', title: 'Succès', message: 'Photo du véhicule ajoutée.' });
    } catch {
      showToast({ type:'warning', title: 'Attention', message: 'Véhicule créé mais la photo n\'a pas pu être uploadée.'});
    } finally {
      setUploading(false);
      handleClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>

          {/* Étape 1 — Formulaire */}
          {step === 1 && (
            <>
              <Text style={modalStyles.title}>Ajouter un véhicule</Text>
              <Text style={modalStyles.stepHint}>Étape 1 / 2 — Informations</Text>

              <VehicleField label="Immatriculation *" value={plate} onChangeText={setPlate} />
              <VehicleField label="Marque *"          value={brand} onChangeText={setBrand} />
              <VehicleField label="Modèle *"          value={model} onChangeText={setModel} />
              <VehicleField label="Couleur"           value={color} onChangeText={setColor} />
              <VehicleField label="Année"             value={year}  onChangeText={setYear} keyboardType="numeric" />

              {/* Sélecteur type simple */}
              <Text style={modalStyles.fieldLabel}>Type *</Text>
              <View style={modalStyles.typeRow}>
                {(['standard', 'berline', 'van'] as VehicleType[]).map(t => (
                  <TouchableOpacity key={t} style={[modalStyles.typeBtn, type === t && modalStyles.typeBtnActive]}
                    onPress={() => setType(t)}>
                    <Text style={[modalStyles.typeBtnText, type === t && modalStyles.typeBtnTextActive]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={modalStyles.actions}>
                <TouchableOpacity style={[modalStyles.btn, modalStyles.btnCancel]} onPress={handleClose} disabled={isLoading}>
                  <Text style={modalStyles.btnCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[modalStyles.btn, modalStyles.btnConfirm]} onPress={handleCreate} disabled={isLoading}>
                  {isLoading
                    ? <ActivityIndicator color={Colors.white} size="small" />
                    : <Text style={modalStyles.btnConfirmText}>Suivant →</Text>
                  }
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Étape 2 — Photo */}
          {step === 2 && (
            <>
              <Text style={modalStyles.title}>Photo du véhicule</Text>
              <Text style={modalStyles.stepHint}>Étape 2 / 2 — Optionnelle</Text>

              <TouchableOpacity style={modalStyles.photoZone} onPress={pickPhoto}>
                {photoUri
                  ? <Image source={{ uri: photoUri }} style={modalStyles.photoPreview} />
                  : (
                    <View style={modalStyles.photoPlaceholder}>
                      <Ionicons name="camera-outline" size={32} color={Colors.textMuted} />
                      <Text style={modalStyles.photoPlaceholderText}>Appuyer pour choisir une photo</Text>
                    </View>
                  )
                }
              </TouchableOpacity>

              <View style={modalStyles.actions}>
                <TouchableOpacity style={[modalStyles.btn, modalStyles.btnCancel]} onPress={handleClose} disabled={uploading}>
                  <Text style={modalStyles.btnCancelText}>Passer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[modalStyles.btn, modalStyles.btnConfirm]} onPress={handleUpload} disabled={uploading}>
                  {uploading
                    ? <ActivityIndicator color={Colors.white} size="small" />
                    : <Text style={modalStyles.btnConfirmText}>
                        {photoUri ? 'Enregistrer' : 'Terminer'}
                      </Text>
                  }
                </TouchableOpacity>
              </View>
            </>
          )}

        </View>
      </View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — Édition véhicule
// ══════════════════════════════════════════════════════════════
interface EditVehicleModalProps {
  visible:     boolean;
  isLoading:   boolean;
  vehicleId:   string;
  initialData: { plate_number: string; brand: string; model: string; year: string; color: string; type: VehicleType; photo_url: string | null };
  onClose:     () => void;
  onUpdate:    (vehicleId: string, data: any) => Promise<void>;
  onUploadPhoto: (vehicleId: string, formData: FormData) => Promise<Vehicle>;
}

function EditVehicleModal({ visible, isLoading, vehicleId, initialData, onClose, onUpdate, onUploadPhoto }: EditVehicleModalProps) {
  const [plate, setPlate]   = useState(initialData.plate_number);
  const [brand, setBrand]   = useState(initialData.brand);
  const [model, setModel]   = useState(initialData.model);
  const [year,  setYear]    = useState(initialData.year);
  const [color, setColor]   = useState(initialData.color);
  const [type,  setType]    = useState<VehicleType>(initialData.type);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();


  // Sync si initialData change
  useEffect(() => {
    setPlate(initialData.plate_number);
    setBrand(initialData.brand);
    setModel(initialData.model);
    setYear(initialData.year);
    setColor(initialData.color);
    setType(initialData.type);
    setPhotoUri(null);
  }, [initialData]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    try {
      await onUpdate(vehicleId, {
        plate_number: plate.trim() || undefined,
        brand:        brand.trim() || undefined,
        model:        model.trim() || undefined,
        color:        color.trim() || undefined,
        year:         year ? Number(year) : undefined,
        type,
      });

      if (photoUri) {
        setUploading(true);
        const formData = new FormData();
        const filename = photoUri.split('/').pop() || 'vehicle.jpg';
        const mimeType = `image/${filename.split('.').pop() || 'jpg'}`;
        formData.append('photo', { uri: photoUri, name: filename, type: mimeType } as any);
        await onUploadPhoto(vehicleId, formData);
      }
      showToast({ type: 'success', title: 'Succès', message: 'Véhicule mis à jour.' });
      onClose();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Erreur', message: err.message ?? 'Impossible de mettre à jour le véhicule.' });
    } finally {
      setUploading(false);
    }
  };

  const currentPhoto = photoUri ?? initialData.photo_url;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>Modifier le véhicule</Text>

          {/* Photo */}
          <TouchableOpacity style={modalStyles.photoZone} onPress={pickPhoto}>
            {currentPhoto
              ? <Image source={{ uri: currentPhoto }} style={modalStyles.photoPreview} />
              : (
                <View style={modalStyles.photoPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color={Colors.textMuted} />
                  <Text style={modalStyles.photoPlaceholderText}>Ajouter une photo</Text>
                </View>
              )
            }
          </TouchableOpacity>

          <VehicleField label="Immatriculation" value={plate} onChangeText={setPlate} />
          <VehicleField label="Marque"          value={brand} onChangeText={setBrand} />
          <VehicleField label="Modèle"          value={model} onChangeText={setModel} />
          <VehicleField label="Couleur"         value={color} onChangeText={setColor} />
          <VehicleField label="Année"           value={year}  onChangeText={setYear} keyboardType="numeric" />

          <Text style={modalStyles.fieldLabel}>Type</Text>
          <View style={modalStyles.typeRow}>
            {(['standard', 'berline', 'van'] as VehicleType[]).map(t => (
              <TouchableOpacity key={t} style={[modalStyles.typeBtn, type === t && modalStyles.typeBtnActive]}
                onPress={() => setType(t)}>
                <Text style={[modalStyles.typeBtnText, type === t && modalStyles.typeBtnTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={modalStyles.actions}>
            <TouchableOpacity style={[modalStyles.btn, modalStyles.btnCancel]} onPress={onClose} disabled={isLoading || uploading}>
              <Text style={modalStyles.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modalStyles.btn, modalStyles.btnConfirm]} onPress={handleSave} disabled={isLoading || uploading}>
              {(isLoading || uploading)
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={modalStyles.btnConfirmText}>Enregistrer</Text>
              }
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — Suppression véhicule
// ══════════════════════════════════════════════════════════════
interface DeleteVehicleModalProps {
  visible:    boolean;
  isLoading:  boolean;
  vehicleId:  string;
  onClose:    () => void;
  onConfirm:  (vehicleId: string) => Promise<void>;
}

function DeleteVehicleModal({ visible, isLoading, vehicleId, onClose, onConfirm }: DeleteVehicleModalProps) {
  const { showToast } = useToast();

  const handleConfirm = async () => {
    try {
      await onConfirm(vehicleId);
      showToast({ type: 'success', title: 'Succès', message: 'Véhicule supprimé.' })
      onClose();
    } catch (err: any) {
      showToast({type: 'error', title: 'Erreur', message : err.message ?? 'Impossible de supprimer le véhicule.'});
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>Supprimer le véhicule</Text>
          <Text style={{ color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 22 }}>
            Cette action est irréversible. La photo associée sera également supprimée.
          </Text>
          <View style={modalStyles.actions}>
            <TouchableOpacity style={[modalStyles.btn, modalStyles.btnCancel]} onPress={onClose} disabled={isLoading}>
              <Text style={modalStyles.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modalStyles.btn, { backgroundColor: Colors.error }]} onPress={handleConfirm} disabled={isLoading}>
              {isLoading
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={modalStyles.btnConfirmText}>Supprimer</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Champ générique modal véhicule ──────────────────────────────
function VehicleField({ label, value, onChangeText, keyboardType }: {
  label: string; value: string; onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
}) {
  return (
    <View style={{ marginBottom: Spacing.sm }}>
      <Text style={modalStyles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        style={modalStyles.fieldInput}
        selectionColor={Colors.bordeaux}
        underlineColorAndroid="transparent"
      />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function DriverProfileScreen({ navigation }: Props) {
  const {
    user, logout, changePassword, isLoading, error, clearError, login,
    updateDriverProfile, uploadAvatar,
    vehicle, vehicleType, iban, vtcLicense, siret, zone,
    createVehicle, uploadVehiclePhoto, updateVehicle, deleteVehicle,
  } = useDriver();

  const { showToast } = useToast();

  const { showAlert } = useAlert();
  console.log('Petite verifiction de siret',siret,'et de zone', zone );

  // ── Modals ──────────────────────────────────────────────────
  const [showCreateVehicle, setShowCreateVehicle] = useState(false);
  const [showEditVehicle,   setShowEditVehicle]   = useState(false);
  const [showDeleteVehicle, setShowDeleteVehicle] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // ── Avatar ──────────────────────────────────────────────────
  const [pendingImage,   setPendingImage]   = useState<string | null>(null);
  const [confirmedImage, setConfirmedImage] = useState<string | null>(null);
  const [editMode,       setEditMode]       = useState(false);
  const avatarUri = pendingImage ?? confirmedImage ?? user?.profile_photo_url;
  const initials  = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();

  // ── États profil ─────────────────────────────────────────────
  const [firstName,     setFirstName]     = useState(user?.first_name  ?? '');
  const [lastName,      setLastName]      = useState(user?.last_name   ?? '');
  const [phone,         setPhone]         = useState(user?.phone       ?? '');
  const [ibanVal,       setIbanVal]       = useState(iban              ?? '');
  const [vtcLicenseVal, setVtcLicense]    = useState(vtcLicense        ?? '');
  const [siretVal,      setSiretVal]      = useState(siret             ?? '');
  const [zoneVal,       setZoneVal]       = useState<ZoneType>(zone    ?? '');
  const [vehicleTypeVal, setVehicleType]  = useState<VehicleType>(vehicleType ?? 'standard');

  // ── Préférences ──────────────────────────────────────────────
  const [notifCourse, setNotifCourse] = useState(true);
  const [notifAlerte, setNotifAlerte] = useState(true);
  const [notifPromo,  setNotifPromo]  = useState(false);

  // ── Galerie avatar ───────────────────────────────────────────
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) setPendingImage(result.assets[0].uri);
  };

  // ── Sauvegarde profil ────────────────────────────────────────
  const handleEditToggle = useCallback(async () => {
    if (editMode) {
      try {
        await updateDriverProfile(
          { first_name: firstName, last_name: lastName, phone },
          { iban: ibanVal, vtc_license: vtcLicenseVal, siret: siretVal, zone: zoneVal, vehicle_type: vehicleTypeVal },
        );

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
      } catch {
        showToast({ type: 'error', title: 'Erreur', message: 'Impossible de sauvegarder les modifications.' });
        return;
      }
    }
    setEditMode(prev => !prev);
  }, [editMode, firstName, lastName, phone, ibanVal, vtcLicenseVal, siretVal, zoneVal, vehicleTypeVal, pendingImage]);

  const handleEditToggleRef = useRef(handleEditToggle);
  useEffect(() => { handleEditToggleRef.current = handleEditToggle; }, [handleEditToggle]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 20 }}
          onPress={() => handleEditToggleRef.current()} disabled={isLoading}>
          <Ionicons name={editMode ? 'checkmark-outline' : 'pencil-outline'}
            size={22} color={Colors.white} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, editMode, isLoading]);

  // ── Handlers véhicule ─────────────────────────────────────────
  const handleCreateVehicle = async (data: any): Promise<string> => {
    const created = await createVehicle(data);
    return created.id;
  };

  const handleUpdateVehicle = async (vehicleId: string, data: any) => {
    await updateVehicle(vehicleId, data);
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    await deleteVehicle(vehicleId);
  };

  // ── Modal mot de passe ────────────────────────────────────────
  const { control, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });
  const newPasswordValue = useWatch({ control, name: 'new_password', defaultValue: '' });

  const onChangePassword = async (data: PasswordForm) => {
    clearError();
    try {
      await changePassword(data.current_password, data.new_password, data.confirm_password);
      await login({ email: user!.email, password: data.new_password });
      showToast({ type: 'success', title: 'Succès', message: 'Mot de passe changé.' });
      reset(); setShowPasswordModal(false);
    } catch {
      showToast({ type: 'error', title: 'Erreur', message: 'Impossible de changer le mot de passe.' });
    }
  };

  const handleLogout = () => showAlert({
    title: 'Déconnexion', message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
    buttons: [{ text: 'Annuler', style: 'cancel' }, { text: 'Déconnecter', style: 'destructive', onPress: logout }]
  });

  const handleDeleteAccount = () => showAlert({
    title: 'Supprimer mon compte', message: 'Cette action est irréversible.',
    buttons: [{ text: 'Annuler', style: 'cancel' }, { text: 'Supprimer', style: 'destructive', onPress: logout }]
  });

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={{ width: '100%', height: '100%', borderRadius: 50 }} />
              : <Text style={styles.avatarInitials}>{initials}</Text>
            }
          </View>
          {editMode && (
            <TouchableOpacity onPress={pickImage} style={styles.avatarEditBtn}>
              <Text style={styles.avatarEditText}>
                {pendingImage ? 'Changer la photo' : 'Modifier la photo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Infos personnelles */}
        <View style={styles.section}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
            <ProfileField label="Prénom"      value={firstName}     editable={editMode} onChangeText={setFirstName} />
            <ProfileField label="Nom"         value={lastName}      editable={editMode} onChangeText={setLastName} />
            <ProfileField label="E-mail"      value={user?.email ?? ''} editable={false} />
            <ProfileField label="Téléphone"   value={phone}         editable={editMode} onChangeText={setPhone} keyboardType="phone-pad" />
            <ProfileField label="Licence VTC" value={vtcLicenseVal} editable={editMode} onChangeText={setVtcLicense} />
          </View>
        </View>

        {/* Infos chauffeur */}
        <View style={styles.section}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Informations chauffeur</Text>
            <ProfileField label="SIRET"            value={siretVal}      editable={editMode} onChangeText={setSiretVal} />
            <ProfileField label="Zone"             value={zoneVal}       editable={editMode} onChangeText={v => setZoneVal(v as ZoneType)} />
            <ProfileField label="Type de véhicule" value={vehicleTypeVal} editable={editMode}
              onChangeText={v => setVehicleType(v as VehicleType)} />
          </View>
        </View>

        {/* Infos bancaires */}
        <View style={styles.section}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Informations bancaires</Text>
            <ProfileField label="IBAN" value={ibanVal} editable={editMode} onChangeText={setIbanVal} />
          </View>
        </View>

        {/* Véhicule actif */}
        <View style={styles.section}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Véhicule actif</Text>
              {vehicle ? (
                <View style={styles.vehicleActions}>
                  <TouchableOpacity onPress={() => setShowEditVehicle(true)} style={styles.vehicleActionBtn}>
                    <Ionicons name="pencil-outline" size={18} color={Colors.bordeaux} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowDeleteVehicle(true)} style={styles.vehicleActionBtn}>
                    <Ionicons name="trash-outline" size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {vehicle ? (
              <>
                {vehicle.photo_url && (
                  <Image source={{ uri: vehicle.photo_url }}
                    style={styles.vehiclePhoto} resizeMode="cover" />
                )}
                <ProfileField label="Immatriculation" value={vehicle.plate_number} editable={false} />
                <ProfileField label="Marque"          value={vehicle.brand  ?? ''} editable={false} />
                <ProfileField label="Modèle"          value={vehicle.model  ?? ''} editable={false} />
                <ProfileField label="Couleur"         value={vehicle.color  ?? ''} editable={false} />
                <ProfileField label="Type"            value={vehicle.type}         editable={false} />
              </>
            ) : (
              <>
                <Text style={styles.emptyText}>Aucun véhicule enregistré.</Text>
                <TouchableOpacity onPress={() => setShowCreateVehicle(true)}>
                  <Text style={styles.addLink}>+ Ajouter un véhicule</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Préférences */}
        <View style={styles.section}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Préférences</Text>
            <PrefRow label="Mode disponible"          sub="Recevoir de nouvelles courses" value={notifCourse} onChange={setNotifCourse} />
            <View style={styles.divider} />
            <PrefRow label="Notifications"            sub="Alertes de nouvelles courses"  value={notifAlerte} onChange={setNotifAlerte} />
            <View style={styles.divider} />
            <PrefRow label="Notifications promotions" sub="Offres et actualités"           value={notifPromo}  onChange={setNotifPromo} />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <ActionRow icon="document-outline"    label="Mes documents"          color={Colors.bordeaux}     onPress={() => navigation.navigate('DriverDocuments')} />
          <View style={styles.divider} />
          <ActionRow icon="lock-closed-outline" label="Changer le mot de passe" color={Colors.textPrimary} onPress={() => { reset(); clearError(); setShowPasswordModal(true); }} />
          <View style={styles.divider} />
          <ActionRow icon="document-text-outline" label="CGU & Mentions légales" color={Colors.bordeaux}  onPress={() => {navigation.navigate('CGU')}} />
          <View style={styles.divider} />
          <ActionRow icon="log-out-outline"     label="Se déconnecter"         color={Colors.bordeaux}     onPress={handleLogout} />
          <View style={styles.divider} />
          <ActionRow icon="trash-outline"       label="Supprimer mon compte"   color={Colors.error}        onPress={handleDeleteAccount} />
        </View>

      </ScrollView>

      {/* ── Modals véhicule ── */}
      <CreateVehicleModal
        visible={showCreateVehicle}
        isLoading={isLoading}
        onClose={() => setShowCreateVehicle(false)}
        onCreate={handleCreateVehicle}
        onUploadPhoto={uploadVehiclePhoto}
      />

      {vehicle && (
        <>
          <EditVehicleModal
            visible={showEditVehicle}
            isLoading={isLoading}
            vehicleId={vehicle.id}
            initialData={{
              plate_number: vehicle.plate_number,
              brand:        vehicle.brand  ?? '',
              model:        vehicle.model  ?? '',
              year:         vehicle.year   ? String(vehicle.year) : '',
              color:        vehicle.color  ?? '',
              type:         vehicle.type,
              photo_url:    vehicle.photo_url,
            }}
            onClose={() => setShowEditVehicle(false)}
            onUpdate={handleUpdateVehicle}
            onUploadPhoto={uploadVehiclePhoto}
          />

          <DeleteVehicleModal
            visible={showDeleteVehicle}
            isLoading={isLoading}
            vehicleId={vehicle.id}
            onClose={() => setShowDeleteVehicle(false)}
            onConfirm={handleDeleteVehicle}
          />
        </>
      )}

      {/* ── Modal mot de passe ── */}
      <Modal visible={showPasswordModal} transparent animationType="fade"
        onRequestClose={() => { reset(); clearError(); setShowPasswordModal(false); }}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
            <Text style={modalStyles.title}>Changer le mot de passe</Text>
            {error && (
              <View style={modalStyles.errorBanner}>
                <Text style={modalStyles.errorText}>⚠️ {error}</Text>
              </View>
            )}
            <FormField<PasswordForm> name="current_password" control={control} label="Mot de passe actuel *"
              secureTextEntry showToggle icon="lock-closed-outline" editable={!isLoading} error={errors.current_password?.message} />
            <FormField<PasswordForm> name="new_password"     control={control} label="Nouveau mot de passe *"
              secureTextEntry showToggle icon="lock-closed-outline" editable={!isLoading} error={errors.new_password?.message} />
            <PasswordStrength value={newPasswordValue} />
            <FormField<PasswordForm> name="confirm_password" control={control} label="Confirmer le mot de passe *"
              secureTextEntry showToggle icon="lock-closed-outline" editable={!isLoading} error={errors.confirm_password?.message} />
            <View style={modalStyles.actions}>
              <TouchableOpacity style={[modalStyles.btn, modalStyles.btnCancel]}
                onPress={() => { reset(); clearError(); setShowPasswordModal(false); }} disabled={isLoading}>
                <Text style={modalStyles.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modalStyles.btn, modalStyles.btnConfirm]}
                onPress={handleSubmit(onChangePassword)} disabled={isLoading}>
                <Text style={modalStyles.btnConfirmText}>{isLoading ? 'Envoi...' : 'Confirmer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ── Sous-composants ─────────────────────────────────────────────
function ProfileField({ label, value, editable, onChangeText, keyboardType }: {
  label: string; value: string; editable: boolean;
  onChangeText?: (t: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
}) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={[fieldStyles.inputWrapper, !editable && fieldStyles.inputDisabled]}>
        <TextInput value={value} onChangeText={onChangeText} editable={editable}
          keyboardType={keyboardType ?? 'default'}
          style={[fieldStyles.input, !editable && fieldStyles.inputTextDisabled]}
          selectionColor={Colors.bordeaux} underlineColorAndroid="transparent" />
      </View>
    </View>
  );
}

function PrefRow({ label, sub, value, onChange }: {
  label: string; sub: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.prefRow}>
      <View style={styles.prefText}>
        <Text style={styles.prefLabel}>{label}</Text>
        <Text style={styles.prefSub}>{sub}</Text>
      </View>
      <Switch value={value} onValueChange={onChange}
        trackColor={{ false: Colors.border, true: Colors.bordeauxLight }} thumbColor={Colors.white} />
    </View>
  );
}

function ActionRow({ icon, label, color, onPress }: {
  icon: any; label: string; color: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress}>
      <View style={styles.actionLeft}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.actionLabel, { color }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={color} />
    </TouchableOpacity>
  );
}

// ── Styles ──────────────────────────────────────────────────────
const fieldStyles = StyleSheet.create({
  wrapper:           { marginBottom: Spacing.md },
  label:             { fontSize: Fonts.size.sm, color: Colors.textCallToAction, marginBottom: Spacing.xs },
  inputWrapper:      { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'ios' ? Spacing.md : 0, backgroundColor: Colors.surface },
  inputDisabled:     { backgroundColor: Colors.placeHolder ?? '#F9F9F9' },
  input:             { fontSize: Fonts.size.md, color: Colors.textPrimary, minHeight: Platform.OS === 'android' ? 44 : undefined },
  inputTextDisabled: { color: Colors.textPlaceholder },
});

const styles = StyleSheet.create({
  flex:           { flex: 1, backgroundColor: Colors.background },
  scroll:         { paddingBottom: Spacing.xxl },
  avatarSection:  { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarCircle:   { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.beigeLight ?? '#F0EAE8', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.bordeaux },
  avatarEditBtn:  { marginTop: Spacing.sm },
  avatarEditText: { color: Colors.bordeaux, fontSize: Fonts.size.sm, fontWeight: '600' },
  section:          { paddingHorizontal: Spacing.lg, marginTop: Spacing.sm , },
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle:     { fontSize: Fonts.size.md, fontWeight: '800', color: Colors.bordeaux },
  sectionContainer: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }},
  vehiclePhoto:     { width: '100%', height: 160, borderRadius: Radius.md, marginBottom: Spacing.md },
  vehicleActions:   { flexDirection: 'row', gap: Spacing.sm },
  vehicleActionBtn: { padding: Spacing.xs },
  emptyText:        { color: Colors.textMuted, fontSize: Fonts.size.sm, marginBottom: Spacing.sm },
  addLink:          { color: Colors.bordeaux, fontWeight: '600', fontSize: Fonts.size.sm },
  prefRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  prefText:  { flex: 1, paddingRight: Spacing.md },
  prefLabel: { fontSize: Fonts.size.md, color: Colors.textPrimary, fontWeight: '500' },
  prefSub:   { fontSize: Fonts.size.xs, color: Colors.textCallToAction, marginTop: 2 },
  actionsSection: { marginTop: Spacing.md, marginHorizontal: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.md, elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, paddingHorizontal: Spacing.md },
  actionRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md },
  actionLeft:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actionLabel:    { fontSize: Fonts.size.md, fontWeight: '500' },
  divider:        { height: 1, backgroundColor: Colors.border },
});

const modalStyles = StyleSheet.create({
  overlay:              { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  card:                 { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, width: '100%', maxHeight: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 },
  title:                { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xs },
  stepHint:             { fontSize: Fonts.size.xs, color: Colors.textMuted, marginBottom: Spacing.md },
  fieldLabel:           { fontSize: Fonts.size.sm, color: Colors.textCallToAction, marginBottom: Spacing.xs },
  fieldInput:           { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'ios' ? Spacing.md : 8, fontSize: Fonts.size.md, color: Colors.textPrimary, backgroundColor: Colors.background },
  typeRow:              { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  typeBtn:              { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  typeBtnActive:        { borderColor: Colors.bordeaux, backgroundColor: Colors.bordeaux + '15' },
  typeBtnText:          { fontSize: Fonts.size.sm, color: Colors.textMuted },
  typeBtnTextActive:    { color: Colors.bordeaux, fontWeight: '700' },
  photoZone:            { height: 140, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', marginBottom: Spacing.md, overflow: 'hidden' },
  photoPreview:         { width: '100%', height: '100%' },
  photoPlaceholder:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
  photoPlaceholderText: { fontSize: Fonts.size.sm, color: Colors.textMuted },
  errorBanner:          { backgroundColor: Colors.errorLight, borderRadius: Radius.sm, borderLeftWidth: 3, borderLeftColor: Colors.error, padding: Spacing.md, marginBottom: Spacing.md },
  errorText:            { color: Colors.error, fontSize: Fonts.size.sm },
  actions:              { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  btn:                  { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
  btnCancel:            { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  btnCancelText:        { color: Colors.textSecondary, fontWeight: '600' },
  btnConfirm:           { backgroundColor: Colors.bordeaux },
  btnConfirmText:       { color: Colors.white, fontWeight: '700' },
});