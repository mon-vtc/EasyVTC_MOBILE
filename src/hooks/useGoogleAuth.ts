/**
 * Hook — Connexion Google OAuth via Supabase + expo-web-browser
 *
 * Flux :
 *  1. supabase.auth.signInWithOAuth() → URL Google
 *  2. WebBrowser.openAuthSessionAsync() → ouvre une session d'auth (Custom Tab
 *     sur Android / ASWebAuthenticationSession sur iOS) et résout directement
 *     avec l'URL de redirection finale, sans écouteur Linking séparé.
 *  3. Supabase redirige vers easyvtc://auth/callback#access_token=...
 *  4. On extrait les tokens depuis result.url et on appelle loginWithGoogle()
 *     → POST /auth/google/token → profil + tokens métier
 *
 * Pourquoi openAuthSessionAsync plutôt que openBrowserAsync + Linking ?
 * openBrowserAsync ouvre un Chrome Custom Tab classique : sur Android, Chrome
 * bloque la navigation automatique vers un scheme externe (easyvtc://) quand
 * elle arrive après plusieurs redirections serveur enchaînées sans geste
 * utilisateur direct (ici Google → Supabase → easyvtc://, 2 sauts) — la
 * session reste bloquée sur une page blanche côté supabase.co et le deep
 * link n'est jamais émis. openAuthSessionAsync est l'API dédiée à ce pattern
 * OAuth : elle gère nativement la remontée vers l'app sur Android et iOS.
 *
 * Pourquoi hardcoder easyvtc://auth/callback plutôt que Linking.createURL() ?
 * En Expo Go, Linking.createURL() génère exp+EasyVTC_Mobile_App:// (underscore
 * et + invalides dans un scheme URL) que Supabase refuse d'ajouter en allowlist.
 * Le scheme easyvtc:// est enregistré dans app.config.js et fonctionne sur
 * dev build et prod build.
 */
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// URL de redirection OAuth — scheme déclaré dans app.config.js
// Valide pour dev build et prod build. Expo Go n'est pas supporté pour OAuth Google.
const REDIRECT_URI = 'easyvtc://auth/callback';

const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

function isSupabaseConfigured(): boolean {
  return (
    SUPABASE_URL.length > 0 &&
    !SUPABASE_URL.includes('<') &&
    SUPABASE_ANON.length > 0 &&
    !SUPABASE_ANON.includes('<')
  );
}

export function useGoogleAuth() {
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      setError('Configuration Supabase manquante. Vérifiez EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans .env');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Obtenir l'URL OAuth Google depuis Supabase
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:          REDIRECT_URI,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError || !data.url) {
        throw new Error(oauthError?.message ?? 'Impossible d\'obtenir l\'URL Google');
      }

      // Ouvre la session d'auth et attend soit le retour sur REDIRECT_URI,
      // soit l'annulation/fermeture manuelle par l'utilisateur.
      const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URI);

      if (result.type !== 'success' || !('url' in result) || !result.url) {
        // Utilisateur a annulé ou fermé le navigateur manuellement
        setIsLoading(false);
        return;
      }

      // Extraire access_token + refresh_token depuis le fragment
      // Supabase retourne : easyvtc://auth/callback#access_token=eyJ...&refresh_token=...
      const fragmentIndex = result.url.indexOf('#');
      if (fragmentIndex === -1) {
        throw new Error('Réponse Google invalide : aucun token dans l\'URL');
      }

      const fragment     = result.url.substring(fragmentIndex + 1);
      const params       = new URLSearchParams(fragment);
      const accessToken  = params.get('access_token');
      const refreshToken = params.get('refresh_token') ?? undefined;

      if (!accessToken) {
        throw new Error('Token Google manquant dans la réponse');
      }

      // Envoyer le token Supabase à l'API → POST /auth/google/token
      await loginWithGoogle(accessToken, refreshToken);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion Google';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { signInWithGoogle, isLoading, error, clearError };
}
