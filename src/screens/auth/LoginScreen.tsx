import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm }                     from 'react-hook-form';
import { zodResolver }                 from '@hookform/resolvers/zod';
import { z }                           from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient }              from 'expo-linear-gradient';
import { Ionicons }                    from '@expo/vector-icons';

import { FormField }      from '../../components/forms/FormField';
import { AppButton }      from '../../components/common/AppButton';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAuth }        from '../../hooks/useAuth';
import { useGoogleAuth }  from '../../hooks/useGoogleAuth';
import type { AuthStackParamList } from '../../types/auth.types';
import { Logo } from '../../constants/logo';

const schema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type FormData = z.infer<typeof schema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [rememberMe, setRememberMe] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();
  const { signInWithGoogle, isLoading: googleLoading, error: googleError, clearError: clearGoogleError } = useGoogleAuth();
  
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({ 
    resolver: zodResolver(schema) 
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
    } catch (_) {}
  };

  const handleGooglePress = () => {
    clearError();
    clearGoogleError();
    signInWithGoogle();
  };

  const anyLoading = isLoading || googleLoading;

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
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <View style={styles.logoShadow}>
              <Image source={Logo.LogoEasyVTC} style={styles.logo} />
            </View>
            <Text style={styles.title}>Bienvenue sur EasyVTC</Text>
            {/* FIX: alignSelf stretch pour occuper toute la largeur du header */}
            <Text style={styles.subtitle}>
              Connectez-vous pour accéder à votre espace
            </Text>
          </View>

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

              <FormField<FormData>
                name="email"
                control={control}
                label="Email *"
                placeholder="votre@email.com"
                keyboardType="email-address"
                editable={!anyLoading}
                error={errors.email?.message}
                icon="mail-outline"
                testID="login-email-input"
              />

              <FormField<FormData>
                name="password"
                control={control}
                label="Mot de passe *"
                placeholder="••••••••"
                secureTextEntry
                showToggle
                editable={!anyLoading}
                error={errors.password?.message}
                icon="lock-closed-outline"
                testID="login-password-input"
              />

              {/* FIX: "Se souvenir" — le TouchableOpacity prend flex:1
                  et le Text à l'intérieur aussi, pour ne plus être tronqué */}
              <View style={styles.rowBetween}>
                <TouchableOpacity 
                  style={styles.rememberMe} 
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <Ionicons 
                    name={rememberMe ? "checkbox" : "square-outline"} 
                    size={20} 
                    color={Colors.textSecondary} 
                  />
                  <Text style={styles.rememberText}>Se souvenir de moi</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotLink}>Mot de passe oublié ?</Text>
                </TouchableOpacity>
              </View>
              
              <AppButton
                label={isLoading ? 'Connexion...' : 'Se connecter'}
                onPress={handleSubmit(onSubmit)}
                size="lg"
                disabled={anyLoading}
                style={styles.button}
                testID="login-submit-btn"
              />

              <View style={styles.separatorContainer}>
                <View style={styles.line} />
                <Text style={styles.separatorText}>Ou continuer avec</Text>
                <View style={styles.line} />
              </View>

              <TouchableOpacity
                style={[styles.googleButton, anyLoading && { opacity: 0.6 }]}
                onPress={handleGooglePress}
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

            {/* FIX: section inscription — layout colonne avec width: 100% implicite */}
            <View style={styles.registration}>
              {/* <Text style={styles.registrationLabel}>Pas encore de compte ?</Text> */}
              <View style={styles.registrationRow}>
                <Text style={styles.registrationLabel}>Créer un compte </Text>
                <TouchableOpacity onPress={() => navigation.navigate('RegisterClient')} disabled={anyLoading} testID="login-register-client-link">
                  <Text style={styles.registrationBold}> Client</Text>
                </TouchableOpacity>
                <Text style={styles.registrationLabel}> ou </Text>
                <TouchableOpacity onPress={() => navigation.navigate('RegisterDriver')} disabled={anyLoading} testID="login-register-driver-link">
                  <Text style={styles.registrationBold}> Chauffeur</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* FIX: footer — suppression de flexDirection row, simple View centrée */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 EasyVTC. Tous droits réservés.</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingTop: Spacing.xl },

  /* ── Header ── */
  header: { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.lg },
  title: { fontSize: Fonts.size.lg, fontWeight: '800', color: '#FFF', marginBottom: Spacing.xs },
  /* FIX: alignSelf: 'stretch' empêche alignItems:'center' du parent
     de réduire la largeur du Text à son contenu intrinsèque */
  subtitle: {
    fontSize: Fonts.size.md,
    color: Colors.surface,
    opacity: 0.5,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    alignSelf: 'stretch',
  },
  
  logo: { width: 80, height: 80, marginBottom: Spacing.sm, resizeMode: 'contain' },
  logoShadow: {
    shadowColor:   'white',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius:  20,
    elevation: 40,
    borderRadius: 40, 
    marginBottom: Spacing.sm,
  },

  /* ── Card ── */
  card: { 
    backgroundColor: Colors.surface, 
    marginHorizontal: Spacing.lg, 
    borderRadius: Radius.lg, 
    overflow: 'hidden',
    elevation: 5,
  },
  cardTopLine: { height: 6, width: '100%', marginTop: Spacing.xxs },
  cardContent: { paddingTop: Spacing.lg, paddingBottom: Spacing.sm, paddingHorizontal: Spacing.md },
  
  /* ── Se souvenir / Mot de passe oublié ── */
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  /* FIX: flex: 1 sur le TouchableOpacity pour qu'il prenne sa part d'espace */
  rememberMe: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: Spacing.sm },
  /* FIX: flex: 1 sur le Text pour qu'il wrappe dans l'espace du TouchableOpacity */
  rememberText: {
    marginLeft: Spacing.xs,
    color: Colors.textCallToAction,
    fontSize: Fonts.size.sm,
    flex: 1,
  },
  forgotLink: { color: Colors.textLight, fontSize: Fonts.size.sm, fontWeight: '600' },
  
  button: { marginTop: Spacing.sm },
  
  /* ── Séparateur ── */
  separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
  line: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  separatorText: { marginHorizontal: Spacing.md, color: Colors.textCallToAction, fontSize: Fonts.size.sm },
  
  /* ── Google ── */
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: Colors.borderWith,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFF',
  },
  googleIcon: { width: 20, height: 20, marginRight: Spacing.md },
  googleText: { fontWeight: '600', color: '#333' },

  /* ── Inscription ── */
  /* FIX: layout vertical pur — pas de flexDirection row, 
     les textes prennent naturellement toute la largeur */
  registration: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  registrationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  registrationLabel: { color: Colors.textCallToAction, fontSize: Fonts.size.md },
  registrationBold:  { color: Colors.bordeauxLight, fontWeight: 'bold', fontSize: Fonts.size.md },
  
  /* ── Footer ── */
  /* FIX: suppression de flexDirection row — un simple conteneur centré */
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

  /* ── Erreurs ── */
  errorBanner: { backgroundColor: Colors.errorLight, borderRadius: Radius.sm, borderLeftWidth: 3, borderLeftColor: Colors.error, padding: Spacing.md, marginBottom: Spacing.md },
  errorText:   { color: Colors.error, fontSize: Fonts.size.sm },
});