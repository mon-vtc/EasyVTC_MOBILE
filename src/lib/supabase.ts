/**
 * Client Supabase — usage mobile (OAuth uniquement)
 *
 * NE PAS utiliser ce client pour les requêtes de données métier.
 * Toute la logique API passe par src/lib/api.ts → EXPO_PUBLIC_API_URL.
 *
 * Ce client sert UNIQUEMENT à :
 *  - initier le flux OAuth (signInWithOAuth)
 *  - récupérer la session après redirect OAuth
 */
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const ExpoSecureStoreAdapter = {
  getItem:    (key: string) => SecureStore.getItemAsync(key),
  setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    storage:           ExpoSecureStoreAdapter,
    autoRefreshToken:  false,
    persistSession:    false,  // la session est gérée par auth.store.ts
    detectSessionInUrl: false,
  },
});
