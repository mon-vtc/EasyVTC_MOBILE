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
import { Ionicons }                    from '@expo/vector-icons'; // Pour la checkbox et Google

import { FormField }   from '../../components/forms/FormField';
import { AppButton }   from '../../components/common/AppButton';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAuth }     from '../../hooks/useAuth';
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
  
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({ 
    resolver: zodResolver(schema) 
  });

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
            <Text style={styles.subtitle}>Connectez-vous pour accéder à votre espace</Text>
          </View>

          <View style={styles.card}>
            <LinearGradient
              colors={[Colors.bordeauxLight, '#FF6B6B', Colors.bordeauxLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardTopLine}
            />

            <View style={styles.cardContent}>
              {error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              )}

              <FormField<FormData>
                name="email"
                control={control}
                label="Email *"
                placeholder="votre@email.com"
                keyboardType="email-address"
                editable={!isLoading}
                error={errors.email?.message}
                icon="mail-outline"
              />

              <FormField<FormData>
                name="password"
                control={control}
                label="Mot de passe *"
                placeholder="••••••••"
                secureTextEntry
                showToggle
                editable={!isLoading}
                error={errors.password?.message}
                icon="lock-closed-outline"
              />

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
                  <Text style={styles.rememberText}>Se souvenir</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotLink}>Mot de passe oublié ?</Text>
                </TouchableOpacity>
              </View>
              
              <AppButton
                label={isLoading ? 'Connexion...' : 'Se connecter'}
                onPress={handleSubmit(onSubmit)}
                size="lg"
                disabled={isLoading}
                style={styles.button}
              />

              <View style={styles.separatorContainer}>
                <View style={styles.line} />
                <Text style={styles.separatorText}>Ou continuer avec</Text>
                <View style={styles.line} />
              </View>

              <TouchableOpacity style={styles.googleButton} >
                <Image 
                  source={Logo.LogoGoogle} 
                  style={styles.googleIcon} 
                />
                <Text style={styles.googleText}>Continuer avec Google</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.registration}>
              <Text style={styles.loginText}>Pas encore de compte ?</Text>

              <View style={styles.registrationRow}>
                <Text style={styles.loginText}> Créer un compte  </Text>
                <TouchableOpacity onPress={() => navigation.navigate('RegisterClient')} disabled={isLoading}>
                  <Text style={styles.loginBold}>Client</Text>
                </TouchableOpacity>
                <Text style={styles.registrationText}> ou </Text>
                <TouchableOpacity onPress={() => navigation.navigate('RegisterDriver')} disabled={isLoading}>
                  <Text style={styles.loginBold}>Chauffeur</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>©2026 EazyVTC. Tous droits réservés.</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingVertical: Spacing.xl },
  header: { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.lg },
  title: { fontSize: Fonts.size.xl, fontWeight: '800', color: '#FFF', marginBottom: Spacing.xs },
  subtitle: { fontSize: Fonts.size.md, color: Colors.surface, opacity: 0.5, textAlign: 'center', paddingHorizontal: Spacing.xl },
  
  logo: { width: 80, height: 80, marginBottom: Spacing.sm, resizeMode: 'contain' },
  logoShadow: {
    // iOS
    shadowColor:   'white',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius:  20,
    // Android
    elevation: 40,
    
    borderRadius: 40, 
    marginBottom: Spacing.sm,
  },

  card: { 
    backgroundColor: Colors.surface, 
    marginHorizontal: Spacing.lg, 
    borderRadius: Radius.lg, 
    overflow: 'hidden',
    elevation: 5,
  },
  cardTopLine: { 
    height: 6, 
    width: '100%',
    marginTop: Spacing.xxs,
  },
  cardContent: { padding: Spacing.lg },
  
  rowBetween: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: Spacing.lg 
  },
  rememberMe: { flexDirection: 'row', alignItems: 'center' },
  rememberText: { marginLeft: Spacing.xs, color: Colors.textCallToAction, fontSize: Fonts.size.sm },
  forgotLink: { color: Colors.textLight, fontSize: Fonts.size.sm, fontWeight: '600' },
  
  button: { marginTop: Spacing.sm },
  
  separatorContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: Spacing.xl 
  },
  line: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  separatorText: { marginHorizontal: Spacing.md, color: Colors.textCallToAction, fontSize: Fonts.size.sm },
  
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: Colors.borderWith,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFF'
  },
  googleIcon: { width: 20, height: 20, marginRight: Spacing.md },
  googleText: { fontWeight: '600', color: '#333' },

  registration: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  registrationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  
  },
  registrationText: { 
    color: Colors.textCallToAction, 
    fontSize: Fonts.size.sm 
  },
  signupLink: { 
    color: Colors.bordeauxLight,   // contraste > textSecondary sur fond clair
    fontWeight: 'bold', 
    fontSize: Fonts.size.sm,
  },
  
  loginText:   { color: Colors.textCallToAction, fontSize: Fonts.size.md },
  loginBold:   { color: Colors.bordeauxLight, fontWeight: 'bold' },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg, marginBottom: Spacing.xl },
  footerText: { color: Colors.surface, opacity: 0.5 },
  errorBanner: { backgroundColor: Colors.errorLight, borderRadius: Radius.sm, borderLeftWidth: 3, borderLeftColor: Colors.error, padding: Spacing.md, marginBottom: Spacing.md },
  errorText:   { color: Colors.error, fontSize: Fonts.size.sm },
});
