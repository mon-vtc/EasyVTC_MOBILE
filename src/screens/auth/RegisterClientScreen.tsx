import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm }                     from 'react-hook-form';
import { zodResolver }                 from '@hookform/resolvers/zod';
import { z }                           from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { FormField }   from '../../components/forms/FormField';
import { AppButton }   from '../../components/common/AppButton';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAuth }     from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../types/auth.types';

const schema = z.object({
  first_name:   z.string().min(2, 'Prénom trop court'),
  last_name:    z.string().min(2, 'Nom trop court'),
  email:        z.string().email('Email invalide'),
  phone:        z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Numéro invalide (ex: +33612345678)'),
  password:     z.string().min(8, 'Min. 8 caractères')
                  .regex(/[A-Z]/, 'Une majuscule requise')
                  .regex(/[0-9]/, 'Un chiffre requis'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
});
type FormData = z.infer<typeof schema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterClient'>;

export default function RegisterClientScreen({ navigation }: Props) {
  const { register, isLoading, error, clearError } = useAuth();
  const { control, handleSubmit } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await register({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        phone: data.phone.trim(),
        role: 'client',
        accept_terms: true,
        rgpd_consent: true,
      });
    } catch (_) {}
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Créer un compte</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>🧳 Client</Text>
          </View>
        </View>

        <View style={styles.card}>
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          <View style={styles.row}>
            <View style={styles.half}>
              <FormField<FormData> name="first_name" control={control} label="Prénom" placeholder="Jean" autoCapitalize="words" />
            </View>
            <View style={[styles.half, { marginLeft: Spacing.sm }]}>
              <FormField<FormData> name="last_name" control={control} label="Nom" placeholder="Dupont" autoCapitalize="words" />
            </View>
          </View>

          <FormField<FormData> name="email"    control={control} label="Email"      placeholder="votre@email.com" keyboardType="email-address" />
          <FormField<FormData> name="phone"    control={control} label="Téléphone"  placeholder="+33 6 12 34 56 78" keyboardType="phone-pad" />
          <FormField<FormData> name="password" control={control} label="Mot de passe" placeholder="Min. 8 car., 1 maj., 1 chiffre" secureTextEntry showToggle />
          <FormField<FormData> name="confirm_password" control={control} label="Confirmer le mot de passe" placeholder="••••••••" secureTextEntry showToggle />

          <View style={styles.termsBox}>
            <Text style={styles.termsText}>
              En créant votre compte, vous acceptez nos{' '}
              <Text style={styles.termsLink}>CGU</Text> et notre{' '}
              <Text style={styles.termsLink}>Politique de confidentialité (RGPD)</Text>.
            </Text>
          </View>

          <AppButton label="Créer mon compte client" onPress={handleSubmit(onSubmit)} loading={isLoading} size="lg" />

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Déjà un compte ? <Text style={styles.loginBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingBottom: Spacing.xl },
  header: {
    backgroundColor: Colors.bordeaux,
    paddingTop: 56, paddingBottom: Spacing.xl, paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  backBtn:     { marginBottom: Spacing.md },
  backText:    { color: Colors.beigeLight, fontSize: Fonts.size.md },
  headerTitle: { color: Colors.white, fontSize: Fonts.size.xxl, fontWeight: '800' },
  roleBadge:   { backgroundColor: Colors.beige, borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: Spacing.sm, alignSelf: 'flex-start', marginTop: Spacing.sm },
  roleText:    { color: Colors.bordeauxDark, fontSize: Fonts.size.sm, fontWeight: '700' },
  card: {
    backgroundColor: Colors.surface, marginHorizontal: Spacing.md, marginTop: -Spacing.lg,
    borderRadius: Radius.lg, padding: Spacing.lg,
    shadowColor: Colors.bordeaux, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
  },
  errorBanner: { backgroundColor: Colors.errorLight, borderRadius: Radius.sm, borderLeftWidth: 3, borderLeftColor: Colors.error, padding: Spacing.md, marginBottom: Spacing.md },
  errorText:   { color: Colors.error, fontSize: Fonts.size.sm },
  row:         { flexDirection: 'row' },
  half:        { flex: 1 },
  termsBox:    { backgroundColor: Colors.beigeLight, borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.lg },
  termsText:   { color: Colors.textSecondary, fontSize: Fonts.size.sm, lineHeight: 20 },
  termsLink:   { color: Colors.bordeaux, fontWeight: '600' },
  loginLink:   { alignItems: 'center', marginTop: Spacing.md },
  loginText:   { color: Colors.textSecondary, fontSize: Fonts.size.md },
  loginBold:   { color: Colors.bordeaux, fontWeight: '700' },
});