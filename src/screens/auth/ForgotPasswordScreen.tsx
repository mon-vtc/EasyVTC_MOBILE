import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm }                     from 'react-hook-form';
import { zodResolver }                 from '@hookform/resolvers/zod';
import { z }                           from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons }                    from '@expo/vector-icons';

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
  const [sent, setSent]           = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await forgotPassword(data.email.trim().toLowerCase());
      setSentEmail(data.email.trim().toLowerCase());
      setSent(true);
    } catch (_) {
      if (__DEV__) console.error('ForgotPassword error:', _);
    }
  };

  // ── Écran confirmation ────────────────────────────────────────
  if (sent) {
    return (
      <View style={styles.flex}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.bordeaux} />
          </TouchableOpacity>
        </View>

        <View style={styles.successContainer}>
          <Ionicons name="mail-open-outline" size={72} color={Colors.bordeaux} style={{ marginBottom: Spacing.lg }} />
          <Text style={styles.successTitle}>Email envoyé !</Text>
          <Text style={styles.successText}>
            Si l'adresse{' '}
            <Text style={styles.emailHighlight}>{sentEmail}</Text>{' '}
            est associée à un compte, vous recevrez un lien de réinitialisation dans quelques minutes.
          </Text>
          <Text style={styles.successHint}>Vérifiez aussi vos spams.</Text>

          <AppButton
            label="Saisir mon nouveau mot de passe"
            onPress={() => navigation.navigate('ResetPassword', { email: sentEmail })}
            size="lg"
            style={{ marginTop: Spacing.xl }}
          />
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={{ marginTop: Spacing.lg, alignItems: 'center' }}
          >
            <Text style={styles.loginText}>
              Retour à la <Text style={styles.loginBold}>connexion</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Formulaire ────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Flèche retour */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.bordeaux} />
          </TouchableOpacity>
        </View>

        {/* Titre */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Mot de passe oublié ?</Text>
          <Text style={styles.description}>
            Entrez votre email pour recevoir un lien de réinitialisation.
          </Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formBlock}>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          <FormField<FormData>
            name="email"
            control={control}
            label="E-mail"
            placeholder="votre@email.com"
            icon="mail-outline"
            keyboardType="email-address"
            editable={!isLoading}
            error={errors.email?.message}
          />

          <AppButton
            label={isLoading ? 'Envoi...' : 'Envoyer le lien'}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            size="lg"
            style={styles.button}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}
            disabled={isLoading}
          >
            <Text style={styles.loginText}>
              Vous souvenez-vous du mot de passe ?{' \t\t'}
              <Text style={styles.loginBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.surface },
  scroll: { flexGrow: 1, paddingBottom: Spacing.xl },

  // Barre du haut avec flèche
  topBar: {
    paddingTop:        Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
    marginBottom:      Spacing.lg,
  },
  backBtn: {
    width:         40,
    height:        40,
    borderRadius:  20,
    alignItems:    'center',
    justifyContent:'center',
    backgroundColor: Colors.beigeLight ?? '#F5F0EE',
  },

  // Bloc titre
  titleBlock: {
    paddingHorizontal: Spacing.lg,
    marginBottom:      Spacing.xl,
  },
  title: {
    fontSize:     Fonts.size.xxl,
    fontFamily: Fonts.bold, fontWeight:   '800',
    color:        Colors.bordeaux,
    lineHeight:   Fonts.size.xxl * 1.2,
    marginBottom: Spacing.md,
  },
  description: {
    color:      Colors.textCallToAction,
    fontSize:   Fonts.size.md,
    lineHeight: 22,
  },

  // Bloc formulaire
  formBlock: {
    paddingHorizontal: Spacing.lg,
  },

  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius:    Radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
    padding:         Spacing.md,
    marginBottom:    Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: Fonts.size.sm },

  button: { marginTop: Spacing.sm },

  loginLink: { alignItems: 'center', marginTop: Spacing.xl },
  loginText: { color: Colors.textCallToAction, fontSize: Fonts.size.md },
  loginBold: { color: Colors.bordeaux, fontFamily: Fonts.bold, fontWeight: '700' },

  // ── Confirmation ──────────────────────────────────────────────
  successContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Spacing.xl,
  },
  successTitle:   { fontSize: Fonts.size.xxl, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.bordeaux, marginBottom: Spacing.md },
  successText:    { color: Colors.textCallToAction, fontSize: Fonts.size.md, lineHeight: 22, textAlign: 'center', marginBottom: Spacing.sm },
  emailHighlight: { color: Colors.bordeaux, fontFamily: Fonts.bold, fontWeight: '700' },
  successHint:    { color: Colors.textMuted, fontSize: Fonts.size.sm, marginTop: Spacing.xs },
});