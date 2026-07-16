import { useEffect, useRef, useState } from 'react';
import { searchAddress, AddressSuggestion } from '../services/geo/addressAutocomplete';

const DEBOUNCE_MS = 400;

/**
 * Suggestions d'adresses en temps réel pendant la saisie (debounce 400ms).
 * `active` permet de désactiver la recherche quand le champ n'a pas le focus.
 */
export function useAddressSearch(query: string, active: boolean) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!active || query.trim().length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const results = await searchAddress(query, controller.signal);
      setSuggestions(results);
      setIsSearching(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, active]);

  return { suggestions, isSearching };
}
