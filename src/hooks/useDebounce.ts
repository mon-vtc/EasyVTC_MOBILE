import { useState, useEffect } from 'react';

/**
 * Hook qui retourne une valeur "débattue" (debounced).
 * La valeur n'est mise à jour qu'après un certain délai sans changement.
 * @param value La valeur à débattre.
 * @param delay Le délai en millisecondes.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}