import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm }                     from 'react-hook-form';
import { zodResolver }                 from '@hookform/resolvers/zod';
import { z }                           from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { FormField } from '../../components/forms/FormField';
import { AppButton } from '../../components/common/AppButton';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAuth }   from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../types/auth.types';

const schema = z.object({
  email: z.string().email('Email invalide'),
});
type FormData = z.infer<typeof schema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { forgotPassword, isLoading, error, clearError } = useAuth();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { control, handleSubmit } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await forgotPassword(data.email.trim().toLowerCase());
      setSentEmail(data.email.trim().toLowerCase());
      setSent(true);
    } catch (_) {}
  };

  // ── Écran de confirmation ────────────────────────────────────────────────
  if (sent) {
    return (
      <View style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backBtn}>
            <Text style={styles.backText}>← Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>📬</Text>
          <Text style={styles.successTitle}>Email envoyé !</Text>
          <Text style={styles.successText}>
            Si l'adresse{' '}
            <Text style={styles.emailHighlight}>{sentEmail}</Text>{' '}
            est associée à un compte, vous recevrez un lien de réinitialisation dans quelques minutes.
          </Text>
          <Text style={styles.successHint}>Vérifiez aussi vos spams.</Text>
          <AppButton
            label="Retour à la connexion"
            onPress={() => navigation.navigate('Login')}
            size="lg"
            style={styles.backBtn2}
          />
        </View>
      </View>
    );
  }

  // ── Formulaire ────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mot de passe oublié</Text>
          <Text style={styles.headerSub}>Réinitialisez votre mot de passe</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.lockIcon}>🔐</Text>
          <Text style={styles.title}>Réinitialisation</Text>
          <Text style={styles.description}>
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </Text>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          <FormField<FormData>
            name="email"
            control={control}
            label="Adresse email"
            placeholder="votre@email.com"
            keyboardType="email-address"
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ⏱️ Le lien de réinitialisation est valide <Text style={{ fontWeight: '700' }}>1 heure</Text>.
            </Text>
          </View>

          <AppButton label="Envoyer le lien" onPress={handleSubmit(onSubmit)} loading={isLoading} size="lg" />

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Vous souvenez du mot de passe ?{' '}
              <Text style={styles.loginBold}>Se connecter</Text>
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
  headerSub:   { color: Colors.beigeLight, fontSize: Fonts.size.sm, marginTop: Spacing.xs },

  card: {
    backgroundColor: Colors.surface, marginHorizontal: Spacing.md, marginTop: -Spacing.lg,
    borderRadius: Radius.lg, padding: Spacing.lg,
    shadowColor: Colors.bordeaux, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
    alignItems: 'center',
  },
  lockIcon:    { fontSize: 52, marginBottom: Spacing.md, marginTop: Spacing.sm },
  title:       { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.bordeaux, marginBottom: Spacing.sm },
  description: { color: Colors.textSecondary, fontSize: Fonts.size.md, lineHeight: 22, textAlign: 'center', marginBottom: Spacing.lg, alignSelf: 'stretch' },

  errorBanner: {
    backgroundColor: Colors.errorLight, borderRadius: Radius.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.error,
    padding: Spacing.md, marginBottom: Spacing.md, alignSelf: 'stretch',
  },
  errorText: { color: Colors.error, fontSize: Fonts.size.sm },

  infoBox: {
    backgroundColor: Colors.warningLight, borderRadius: Radius.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.warning,
    padding: Spacing.md, marginBottom: Spacing.lg, alignSelf: 'stretch',
  },
  infoText:  { color: Colors.warning, fontSize: Fonts.size.sm },

  loginLink: { alignItems: 'center', marginTop: Spacing.md },
  loginText: { color: Colors.textSecondary, fontSize: Fonts.size.md },
  loginBold: { color: Colors.bordeaux, fontWeight: '700' },

  // ── Confirmation ──────────────────────────────────────────────────────────
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl,
  },
  successEmoji:    { fontSize: 72, marginBottom: Spacing.lg },
  successTitle:    { fontSize: Fonts.size.xxl, fontWeight: '800', color: Colors.bordeaux, marginBottom: Spacing.md },
  successText:     { color: Colors.textSecondary, fontSize: Fonts.size.md, lineHeight: 22, textAlign: 'center', marginBottom: Spacing.sm },
  emailHighlight:  { color: Colors.bordeaux, fontWeight: '700' },
  successHint:     { color: Colors.textMuted, fontSize: Fonts.size.sm, marginBottom: Spacing.xl },
  backBtn2:        { width: '100%' },
});