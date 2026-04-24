// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Admin / Créer un Gestionnaire
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Platform, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAdmin } from '../../../hooks/useAdmin';
import { AppInput } from '../../../components/common/AppInput';
import { AppButton } from '../../../components/common/AppButton';
import { Colors, Spacing, Radius } from '../../../theme/colors';
import { Ionicons } from '@expo/vector-icons';

export default function CreateManagerScreen() {
  const navigation = useNavigation();
  const { createManager } = useAdmin();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "L'email est invalide";
    }
     if (!phone.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis';
    } else if (!/^\+?[1-9]\d{7,14}$/.test(phone)) {
      newErrors.phone = 'Numéro invalide — format international attendu (ex : +33612345678)';
    }
    if (password && password.length < 8) {
      newErrors.password = 'Le mot de passe doit faire au moins 8 caractères';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    try {
      const newManager = await createManager({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        ...(password && { password }),
      });

      if (newManager) {
        Alert.alert(
          'Succès',
          `Le gestionnaire ${newManager.first_name} a été créé. Un email avec ses identifiants lui a été envoyé.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    }
  };
  const { user } = useAdmin();
  return (
    <View style={styles.container}>
      {/* <AppHeader title="Nouveau Gestionnaire" back /> */}
      <View style={styles.header}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={22} color={Colors.white} />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Gestionnaires</Text>
              </View>
              {user?.role && (
                <View style={styles.RoleContent} >
                  <Ionicons style={styles.IconRole} name="person" size={16} color={Colors.white} />
                  <Text style={styles.RoleText}>{user?.role === 'admin' ? 'Administrateur' : ''}</Text>
                </View> 
              )}
            </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AppInput
          label="Prénom *"
          placeholder='Marie'
          value={firstName}
          onChangeText={setFirstName}
          error={errors.firstName}
          autoCapitalize="words"
        />
        <AppInput
          label="Nom"
          placeholder='Dubois'
          value={lastName}
          onChangeText={setLastName}
          error={errors.lastName}
          autoCapitalize="words"
        />
        <AppInput
          label="Email *"
          placeholder='marie.dubois@easyvtc.fr'
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AppInput
          label="Téléphone *"
          placeholder='+33123456789'
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          error={errors.phone}
        />

        <AppButton
          label="Créer le gestionnaire"
          onPress={handleCreate}
          loading={isSaving}
          style={styles.button}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors.white,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: Colors.bordeaux,
        
        paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
        paddingBottom: Spacing.md, paddingHorizontal: Spacing.md,
    },
    headerBtn:    { padding: Spacing.sm, width: 40 },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    RoleContent: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: Radius.full,
      padding: Spacing.sm,
    },
    RoleText: { fontSize: 11, color: Colors.white, marginLeft: 4, paddingHorizontal: Spacing.xs, paddingVertical: 2, borderRadius: Radius.sm },
    scroll: {
      flex: 1,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      backgroundColor: Colors.white,
      borderRadius: Radius.lg,
      margin: Spacing.md,
    },
    IconRole: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: Radius.full,
      padding: Spacing.sm,
      shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 
    },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  button: {
    marginTop: Spacing.lg,
  },
});