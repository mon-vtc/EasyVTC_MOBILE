import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm, useWatch }           from 'react-hook-form';
import { zodResolver }                 from '@hookform/resolvers/zod';
import { z }                           from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient }              from 'expo-linear-gradient';
import { Ionicons }                    from '@expo/vector-icons';

import { FormField }     from '../../components/forms/FormField';
import { AppButton }     from '../../components/common/AppButton';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAuth }       from '../../hooks/useAuth';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import type { AuthStackParamList } from '../../types/auth.types';
import { Logo } from '../../constants/logo';

const schema = z.object({
  first_name: z.string().min(2, 'Prénom trop court'),
  last_name:  z.string().min(2, 'Nom trop court'),
  email:      z.string().email('Email invalide'),
  phone:      z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Numéro invalide'),
  password:   z.string()
                .min(8,      'Min. 8 caractères')
                .regex(/[A-Z]/, 'Une lettre majuscule requise')
                .regex(/[0-9]/, 'Un chiffre requis'),
});
type FormData = z.infer<typeof schema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterClient'>;

// ── Règles checklist mot de passe ──────────────────────────────
const PASSWORD_RULES = [
  { label: 'Au moins 8 caractères',  test: (v: string) => v.length >= 8 },
  { label: 'Une lettre majuscule',   test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Un chiffre',             test: (v: string) => /[0-9]/.test(v) },
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
  /* FIX: flex: 1 pour que le texte prenne tout l'espace restant après l'icône
     et puisse passer à la ligne si nécessaire au lieu d'être tronqué */
  text:    { marginLeft: Spacing.xs, fontSize: Fonts.size.sm, color: Colors.textCallToAction, opacity: 0.8, flex: 1 },
  textOk:  { color: Colors.bordeauxLight },
});

// ── Screen ─────────────────────────────────────────────────────
export default function RegisterClientScreen({ navigation }: Props) {
  const [cguAccepted, setCguAccepted] = useState(false);
  const { register, isLoading, error, clearError } = useAuth();
  const { signInWithGoogle, isLoading: googleLoading, error: googleError, clearError: clearGoogleError } = useGoogleAuth();
  const anyLoading = isLoading || googleLoading;

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '' },
  });

  const passwordValue = useWatch({ control, name: 'password', defaultValue: '' });

  const onSubmit = async (data: FormData) => {
    if (!cguAccepted) return;
    clearError();
    clearGoogleError();
    try {
      await register({
        email:        data.email.trim().toLowerCase(),
        password:     data.password,
        first_name:   data.first_name.trim(),
        last_name:    data.last_name.trim(),
        phone:        data.phone.trim(),
        role:         'client',
        accept_terms: true,
        rgpd_consent: true,
      });
    } catch (_) {
      if (__DEV__) console.error('Register error:', _);
    }
  };

  return (
    <LinearGradient
      colors={['#1A0505', '#3D1515', '#602C2D']}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={styles.flex}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.logoShadow}>
              <Image source={Logo.LogoEasyVTC} style={styles.logo} />
            </View>
            <Text style={styles.title}>Créer un compte</Text>
            {/* FIX: alignSelf stretch */}
            <Text style={styles.subtitle}>Rejoignez notre communauté premium</Text>
          </View>

          {/* ── Card ── */}
          <View style={styles.card}>
            <LinearGradient
              colors={[Colors.bordeauxLight, '#FF6B6B', Colors.bordeauxLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardTopLine}
            />

            <View style={styles.cardContent}>

              {(error || googleError) && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {error ?? googleError}</Text>
                </View>
              )}

              {/* Prénom / Nom */}
              <View style={styles.row}>
                <View style={styles.half}>
                  <FormField<FormData>
                    name="first_name"
                    control={control}
                    label="Prénom *"
                    placeholder="Jean"
                    icon="person-outline"
                    autoCapitalize="words"
                    editable={!isLoading}
                    error={errors.first_name?.message}
                  />
                </View>
                <View style={[styles.half, { marginLeft: Spacing.sm }]}>
                  <FormField<FormData>
                    name="last_name"
                    control={control}
                    label="Nom *"
                    placeholder="Dupont"
                    icon="person-outline"
                    autoCapitalize="words"
                    editable={!isLoading}
                    error={errors.last_name?.message}
                  />
                </View>
              </View>

              <FormField<FormData>
                name="phone"
                control={control}
                label="Téléphone *"
                placeholder="+33 6 12 34 56 78"
                icon="call-outline"
                keyboardType="phone-pad"
                editable={!isLoading}
                error={errors.phone?.message}
              />

              <FormField<FormData>
                name="email"
                control={control}
                label="E-mail *"
                placeholder="jean.dupont@email.com"
                icon="mail-outline"
                keyboardType="email-address"
                editable={!isLoading}
                error={errors.email?.message}
              />

              <FormField<FormData>
                name="password"
                control={control}
                label="Mot de passe *"
                placeholder="••••••••"
                icon="lock-closed-outline"
                secureTextEntry
                showToggle
                editable={!isLoading}
                error={errors.password?.message}
              />

              {/* Checklist live — textes désormais non tronqués grâce à flex:1 */}
              <PasswordStrength value={passwordValue} />

              {/* CGU checkbox */}
              <TouchableOpacity
                style={styles.cguRow}
                onPress={() => setCguAccepted(!cguAccepted)}
                disabled={isLoading}
              >
                <Ionicons
                  name={cguAccepted ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={cguAccepted ? Colors.bordeaux : Colors.textMuted}
                />
                <Text style={styles.cguText}>
                  J'accepte les{' '}
                  <Text style={styles.cguLink}>conditions d'utilisation</Text>
                  {' '}et la{' '}
                  <Text style={styles.cguLink}>politique de confidentialité</Text>
                </Text>
              </TouchableOpacity>

              <AppButton
                label={isLoading ? 'Création...' : 'Créer mon compte'}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading || !cguAccepted}
                size="lg"
                style={styles.button}
              />

              {/* Séparateur Google */}
              <View style={styles.separatorContainer}>
                <View style={styles.line} />
                <Text style={styles.separatorText}>Ou continuer avec</Text>
                <View style={styles.line} />
              </View>

              <TouchableOpacity
                style={[styles.googleButton, anyLoading && { opacity: 0.6 }]}
                onPress={() => { clearError(); clearGoogleError(); signInWithGoogle(); }}
                disabled={anyLoading}
              >
                {googleLoading ? (
                  <Text style={styles.googleText}>Connexion Google...</Text>
                ) : (
                  <>
                    <Image source={Logo.LogoGoogle} style={styles.googleIcon} />
                    <Text style={styles.googleText}>Continuer avec Google</Text>
                  </>
                )}
              </TouchableOpacity>

            </View>

            {/* FIX: lien login en colonne pour ne plus tronquer */}
           
            <View style={styles.registration}>
              <Text style={styles.registrationLabel}>Déjà un compte ?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
                <Text style={styles.registrationBold}> Se connecter</Text>
              </TouchableOpacity>
            </View>

          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 EazyVTC. Tous droits réservés.</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1 },
  scroll: { flexGrow: 1, paddingVertical: Spacing.xl },

  /* ── Header ── */
  header:   { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.lg },
  logo:     { width: 80, height: 80, marginBottom: Spacing.sm, resizeMode: 'contain' },
  logoShadow: {
    shadowColor: 'white', 
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, 
    shadowRadius: 20,
    elevation: 40,        
    borderRadius: 40,
    marginBottom: Spacing.md,
  },
  title:    { fontSize: Fonts.size.xl, fontWeight: '800', color: '#FFF', marginBottom: Spacing.xs },
  /* FIX: alignSelf stretch pour éviter la troncature par alignItems center du parent */
  subtitle: {
    fontSize: Fonts.size.md,
    color: Colors.surface,
    opacity: 0.5,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    alignSelf: 'stretch',
  },

  /* ── Card ── */
  card: {
    backgroundColor: Colors.surface, marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg, overflow: 'hidden', elevation: 5,
  },
  cardTopLine: { height: 6, width: '100%', marginTop: Spacing.xxs },
  cardContent: { padding: Spacing.lg },

  /* ── Erreur ── */
  errorBanner: { backgroundColor: Colors.errorLight, borderRadius: Radius.sm, borderLeftWidth: 3, borderLeftColor: Colors.error, padding: Spacing.md, marginBottom: Spacing.md },
  errorText:   { color: Colors.error, fontSize: Fonts.size.sm },

  /* ── Champs ── */
  row:  { flexDirection: 'row' },
  half: { flex: 1 },

  /* ── CGU ── */
  cguRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.lg, gap: Spacing.sm },
  cguText: { flex: 1, fontSize: Fonts.size.sm, color: Colors.textSecondary, lineHeight: 20 },
  cguLink: { color: Colors.bordeaux, fontWeight: '600' },

  button: { marginBottom: Spacing.sm },

  /* ── Séparateur ── */
  separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
  line:               { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  separatorText:      { marginHorizontal: Spacing.md, color: Colors.textCallToAction, fontSize: Fonts.size.sm },

  /* ── Google ── */
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: Colors.borderWith, borderColor: Colors.border,
    borderRadius: Radius.lg, paddingVertical: Spacing.md, backgroundColor: '#FFF',
  },
  googleIcon: { width: 20, height: 20, marginRight: Spacing.md },
  googleText: { fontWeight: '600', color: '#333' },

  /* ── Inscription / Login link ── */
  /* FIX: layout vertical pur, pas de flexDirection row */

  registration: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  registrationLabel: { color: Colors.textCallToAction, fontSize: Fonts.size.sm,flex: 1 },
  registrationBold:  { color: Colors.bordeauxLight, fontWeight: 'bold', fontSize: Fonts.size.md },

  /* ── Footer ── */
  /* FIX: layout vertical centré, plus de flexDirection row */
  footer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  footerText: {
    color: Colors.surface,
    opacity: 0.5,
    fontSize: Fonts.size.sm,
    textAlign: 'center',
  },
});