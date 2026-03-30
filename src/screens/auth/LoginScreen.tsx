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
  email:    z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type FormData = z.infer<typeof schema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login, isLoading, error, clearError } = useAuth();
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await login({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
    } catch (_) {}
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.logo}>🚗</Text>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre compte EasyVTC</Text>
        </View>

        <View style={styles.card}>
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
            editable={!isLoading}
          />

          <FormField<FormData>
            name="password"
            control={control}
            label="Mot de passe"
            placeholder="Entrez votre mot de passe"
            secureTextEntry
            editable={!isLoading}
          />

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} disabled={isLoading}>
            <Text style={styles.forgotLink}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <AppButton
            label={isLoading ? 'Connexion...' : 'Se connecter'}
            onPress={handleSubmit(onSubmit)}
            size="lg"
            disabled={isLoading}
            style={styles.button}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ?{' '}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('RegisterClient')} disabled={isLoading}>
            <Text style={styles.signupLink}>Créer un compte Client</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}> ou </Text>
          <TouchableOpacity onPress={() => navigation.navigate('RegisterDriver')} disabled={isLoading}>
            <Text style={styles.signupLink}>s'inscrire en tant que chauffeur</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:            { flex: 1, backgroundColor: Colors.background },
  scroll:          { flexGrow: 1, paddingVertical: Spacing.xl },
  header:          { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.lg },
  logo:            { fontSize: 56, marginBottom: Spacing.sm },
  title:           { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.bordeaux, marginBottom: Spacing.xs },
  subtitle:        { fontSize: Fonts.size.md, color: Colors.textSecondary, textAlign: 'center' },
  card:            { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, padding: Spacing.lg, borderRadius: Radius.lg, marginBottom: Spacing.xl },
  errorBanner:     { backgroundColor: Colors.errorLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderLeftWidth: 4, borderLeftColor: Colors.error },
  errorText:       { color: Colors.error, fontSize: Fonts.size.sm, fontWeight: '600' },
  forgotLink:      { color: Colors.bordeaux, fontSize: Fonts.size.sm, fontWeight: '600', textAlign: 'right', marginBottom: Spacing.lg },
  button:          { marginTop: Spacing.lg },
  footer:          { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  footerText:      { color: Colors.textSecondary, fontSize: Fonts.size.sm },
  signupLink:      { color: Colors.bordeaux, fontWeight: '600', fontSize: Fonts.size.sm },
});