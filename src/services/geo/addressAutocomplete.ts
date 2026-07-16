// ══════════════════════════════════════════════════════════════════════════════
// Autocomplétion d'adresses — Photon (Komoot), service public gratuit basé sur
// OpenStreetMap, sans clé API. https://photon.komoot.io
// ══════════════════════════════════════════════════════════════════════════════

export interface AddressSuggestion {
  label:     string;
  latitude:  number;
  longitude: number;
}

const PHOTON_URL = 'https://photon.komoot.io/api/';

function formatLabel(props: Record<string, any>): string {
  const line = [
    props.housenumber && props.street ? `${props.housenumber} ${props.street}` : (props.street ?? props.name),
    props.city ?? props.county,
    props.country,
  ].filter(Boolean);

  return line.join(', ');
}

/**
 * Recherche des suggestions d'adresses via Photon.
 * Retourne un tableau vide en cas d'erreur réseau ou de requête annulée —
 * l'autocomplétion ne doit jamais faire planter le formulaire de réservation.
 */
export async function searchAddress(
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const url = `${PHOTON_URL}?q=${encodeURIComponent(trimmed)}&limit=5&lang=fr`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const json = await res.json();
    const features: any[] = json?.features ?? [];

    return features
      .map((f) => ({
        label:     formatLabel(f.properties ?? {}),
        longitude: f.geometry?.coordinates?.[0],
        latitude:  f.geometry?.coordinates?.[1],
      }))
      .filter((s) => s.label && typeof s.latitude === 'number' && typeof s.longitude === 'number');
  } catch {
    return [];
  }
}
