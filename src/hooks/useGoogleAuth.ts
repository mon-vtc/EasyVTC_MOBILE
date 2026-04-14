/**
 * Hook — Connexion Google OAuth via Supabase + expo-web-browser
 *
 * Flux :
 *  1. supabase.auth.signInWithOAuth() → URL Google
 *  2. WebBrowser.openBrowserAsync() → ouvre Chrome Custom Tab
 *  3. Supabase redirige vers easyvtc://#access_token=...
 *  4. Linking.addEventListener intercepte le deep link
 *  5. WebBrowser.dismissBrowser() ferme le tab
 *  6. On extrait les tokens et on appelle loginWithGoogle()
 *     → POST /auth/google/token → profil + tokens métier
 *
 * Pourquoi openBrowserAsync plutôt que openAuthSessionAsync ?
 * Sur Android, Chrome Custom Tab ne ferme pas automatiquement sur
 * un custom scheme (easyvtc://) → page noire. On gère la fermeture
 * manuellement via Linking + dismissBrowser.
 */
import { useState, useEffect, useRef } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// Génère le scheme correct selon l'environnement :
//   - Expo Go    → exp+EazyVTC_Mobile_App://
//   - Dev build  → easyvtc://
//   - Prod build → easyvtc://
const REDIRECT_URI = Linking.createURL('');

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

  // Indique qu'une session OAuth est en cours : seul le listener doit
  // finaliser le flux (évite les doubles appels si le browser se ferme
  // manuellement ET que le deep link arrive quasi-simultanément)
  const pendingRef = useRef(false);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      if (!pendingRef.current) return;
      if (!url.startsWith(REDIRECT_URI)) return;

      pendingRef.current = false;

      // Fermer le browser immédiatement
      WebBrowser.dismissBrowser();

      try {
        // Extraire access_token + refresh_token depuis le fragment
        // Supabase retourne : easyvtc://#access_token=eyJ...&refresh_token=...
        const fragmentIndex = url.indexOf('#');
        if (fragmentIndex === -1) {
          throw new Error('Réponse Google invalide : aucun token dans l\'URL');
        }

        const fragment     = url.substring(fragmentIndex + 1);
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
    });

    return () => subscription.remove();
  }, [loginWithGoogle]);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      setError('Configuration Supabase manquante. Vérifiez EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans .env');
      return;
    }

    setIsLoading(true);
    setError(null);
    pendingRef.current = true;

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
        pendingRef.current = false;
        throw new Error(oauthError?.message ?? 'Impossible d\'obtenir l\'URL Google');
      }

      // Ouvrir le browser — résout quand le browser se ferme
      await WebBrowser.openBrowserAsync(data.url);

      // Si pendingRef est encore true ici, l'utilisateur a fermé le browser
      // manuellement sans s'authentifier (le Linking listener n'a pas été déclenché)
      if (pendingRef.current) {
        pendingRef.current = false;
        setIsLoading(false);
      }

    } catch (err: unknown) {
      pendingRef.current = false;
      setError(err instanceof Error ? err.message : 'Erreur de connexion Google');
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { signInWithGoogle, isLoading, error, clearError };
}
