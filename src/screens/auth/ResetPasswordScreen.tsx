import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm, useWatch }           from 'react-hook-form';
import { zodResolver }                 from '@hookform/resolvers/zod';
import { z }                           from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons }                    from '@expo/vector-icons';

import { FormField }   from '../../components/forms/FormField';
import { AppButton }   from '../../components/common/AppButton';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAuth }     from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../types/auth.types';

// ── Schéma de validation ────────────────────────────────────────
const schema = z.object({
  token: z.string().min(10, 'Token invalide (copiez le depuis votre email)'),
  new_password: z
    .string()
    .min(8, 'Min. 8 caractères')
    .regex(/[A-Z]/, 'Une lettre majuscule requise')
    .regex(/[0-9]/, 'Un chiffre requis'),
  confirm_password: z.string().min(1, 'Confirmation requise'),
}).refine(
  (data) => data.new_password === data.confirm_password,
  { message: 'Les mots de passe ne correspondent pas', path: ['confirm_password'] }
);
type FormData = z.infer<typeof schema>;

// ── Checklist mot de passe ──────────────────────────────────────
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

// ── Screen ─────────────────────────────────────────────────────
type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const [done, setDone] = React.useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const passwordValue = useWatch({ control, name: 'new_password', defaultValue: '' });

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await resetPassword(data.token.trim(), data.new_password);
      setDone(true);
    } catch (_) {
      if (__DEV__) console.error('ResetPassword error:', _);
    }
  };

  // ── Écran succès ─────────────────────────────────────────────
  if (done) {
    return (
      <View style={styles.flex}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.bordeaux} />
          </TouchableOpacity>
        </View>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle-outline" size={72} color={Colors.bordeaux} style={{ marginBottom: Spacing.lg }} />
          <Text style={styles.successTitle}>Mot de passe mis à jour !</Text>
          <Text style={styles.successText}>
            Votre mot de passe a été modifié avec succès.
          </Text>
          <AppButton
            label="Se connecter"
            onPress={() => navigation.navigate('Login')}
            size="lg"
            style={{ marginTop: Spacing.xl }}
          />
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
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.bordeaux} />
          </TouchableOpacity>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Nouveau mot de passe</Text>
          <Text style={styles.description}>
            Copiez le token depuis le lien reçu par email, puis choisissez un nouveau mot de passe.
          </Text>
        </View>

        <View style={styles.formBlock}>
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.bordeaux} />
            <Text style={styles.infoText}>
              Le token se trouve dans l'URL du lien reçu par email, après{' '}
              <Text style={styles.infoCode}>#access_token=</Text>
            </Text>
          </View>

          <FormField<FormData>
            name="token"
            control={control}
            label="Token (depuis l'email) *"
            placeholder="eyJhbGciOiJIUzI1Ni..."
            icon="key-outline"
            editable={!isLoading}
            error={errors.token?.message}
            autoCapitalize="none"
          />

          <FormField<FormData>
            name="new_password"
            control={control}
            label="Nouveau mot de passe *"
            placeholder="••••••••"
            icon="lock-closed-outline"
            secureTextEntry
            showToggle
            editable={!isLoading}
            error={errors.new_password?.message}
          />

          <PasswordStrength value={passwordValue} />

          <FormField<FormData>
            name="confirm_password"
            control={control}
            label="Confirmer le mot de passe *"
            placeholder="••••••••"
            icon="lock-closed-outline"
            secureTextEntry
            showToggle
            editable={!isLoading}
            error={errors.confirm_password?.message}
          />

          <AppButton
            label={isLoading ? 'Mise à jour...' : 'Réinitialiser le mot de passe'}
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
              Retour à la{' '}
              <Text style={styles.loginBold}>connexion</Text>
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

  topBar: {
    paddingTop:        Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
    marginBottom:      Spacing.lg,
  },
  backBtn: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: Colors.beigeLight ?? '#F5F0EE',
  },

  titleBlock: {
    paddingHorizontal: Spacing.lg,
    marginBottom:      Spacing.xl,
  },
  title: {
    fontSize:     Fonts.size.xxl,
    fontWeight:   '800',
    color:        Colors.bordeaux,
    lineHeight:   Fonts.size.xxl * 1.2,
    marginBottom: Spacing.md,
  },
  description: {
    color:      Colors.textCallToAction,
    fontSize:   Fonts.size.md,
    lineHeight: 22,
  },

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

  infoBox: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    backgroundColor: '#FFF8F0',
    borderRadius:    Radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.bordeaux,
    padding:         Spacing.md,
    marginBottom:    Spacing.lg,
    gap:             Spacing.xs,
  },
  infoText: {
    flex:       1,
    fontSize:   Fonts.size.sm,
    color:      Colors.textCallToAction,
    lineHeight: 18,
  },
  infoCode: {
    fontFamily:  Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color:       Colors.bordeaux,
    fontWeight:  '600',
  },

  button: { marginTop: Spacing.sm },

  loginLink: { alignItems: 'center', marginTop: Spacing.xl },
  loginText: { color: Colors.textCallToAction, fontSize: Fonts.size.md },
  loginBold: { color: Colors.bordeaux, fontWeight: '700' },

  successContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Spacing.xl,
  },
  successTitle: {
    fontSize:     Fonts.size.xxl,
    fontWeight:   '800',
    color:        Colors.bordeaux,
    marginBottom: Spacing.md,
  },
  successText: {
    color:      Colors.textCallToAction,
    fontSize:   Fonts.size.md,
    lineHeight: 22,
    textAlign:  'center',
  },
});
