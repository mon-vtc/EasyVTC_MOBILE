/**
 * Hook : connexion Sign in with Apple, via expo-apple-authentication + Supabase
 *
 * Flux :
 *  1. AppleAuthentication.signInAsync({ requestedScopes }) → récupère un identityToken
 *     (JWT signé par Apple), ainsi que fullName/email UNIQUEMENT lors de la toute
 *     première connexion (Apple ne les renvoie plus ensuite, on les transmet donc
 *     immédiatement à l'API pour les stocker).
 *  2. supabase.auth.signInWithIdToken({ provider: 'apple', token }) → Supabase
 *     vérifie la signature Apple et ouvre une session.
 *  3. On envoie l'access_token Supabase à l'API → POST /auth/apple/token
 *     → profil + tokens métier (même pattern que useGoogleAuth.ts).
 *
 * Pas de paramètre nonce : volontaire, pour suivre exactement l'exemple officiel
 * Supabase pour Expo (supabase.com/docs/guides/auth/social-login/auth-apple).
 * Un essai avec nonce haché en SHA-256 (pattern Firebase/Flutter) est tombé sur un
 * bug GoTrue non résolu ("Nonces mismatch", comparaison hex vs base64url —
 * supabase/auth#2378) ; l'exemple Expo officiel n'utilise pas de nonce du tout.
 *
 * Guideline 4.8 : Sign in with Apple est l'alternative exigée par Apple dès lors
 * qu'un login tiers (ici Google) est proposé.
 */
import { useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useAlert } from './useAlert';
import type { GoogleAuthOptions } from '../types';

export function useAppleAuth() {
  const { loginWithApple } = useAuth();
  const { showAlert } = useAlert();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const signInWithApple = async (options?: GoogleAuthOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Token Apple manquant dans la réponse');
      }

      // Fourni par Apple uniquement à la toute première connexion sur cet appareil.
      // signInWithIdToken() n'accepte pas de métadonnées custom (contrairement à
      // signInWithOAuth) : on transmet donc ce nom directement à l'API ci-dessous,
      // qui le reporte sur le profil (cf. _resolveOAuthSignIn côté serveur).
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ')
        .trim();

      const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (supabaseError || !data.session) {
        throw new Error(supabaseError?.message ?? 'Connexion Apple refusée');
      }

      const tempPassword = await loginWithApple(
        data.session.access_token,
        data.session.refresh_token,
        fullName || undefined,
        options,
      );

      // Comme pour Google : mot de passe temporaire affiché une seule fois
      // (Apple ne fournit aucun mot de passe applicatif).
      if (tempPassword) {
        showAlert({
          title: 'Votre mot de passe temporaire',
          message: `Un mot de passe temporaire a été créé pour votre compte : ${tempPassword}\n\nIl vous a aussi été envoyé par email. Nous vous recommandons de le modifier dès maintenant depuis Mon compte → Modifier le mot de passe.`,
          buttons: [{ text: 'Compris' }],
        });
      }

    } catch (err: unknown) {
      // L'utilisateur a annulé la fenêtre Apple, ce n'est pas une erreur à afficher.
      const code = (err as { code?: string } | undefined)?.code;
      if (code === 'ERR_REQUEST_CANCELED') {
        setIsLoading(false);
        return;
      }
      const message = err instanceof Error ? err.message : 'Erreur de connexion Apple';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { signInWithApple, isLoading, error, clearError };
}
