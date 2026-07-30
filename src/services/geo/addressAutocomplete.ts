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

// Boîte englobante Europe + France (lon min, lat min, lon max, lat max) — envoyée à
// Photon pour écarter dès le serveur les résultats hors zone (Asie, Amériques…).
const EUROPE_BBOX = '-25,34,45,72';

// Biais de localisation : centre approximatif de la France, pour faire remonter
// les adresses françaises en tête des suggestions (pertinence demandée par le client).
const FRANCE_BIAS = { lat: 46.6, lon: 2.4, zoom: 6 };

// Pays autorisés en sortie (France + Europe au sens usuel du service) — exclut
// explicitement la Russie, la Biélorussie, l'Ukraine, le Kazakhstan, la Turquie, la Chine…
// qui remontaient à tort sur des requêtes comme "Orly" (retour client).
const ALLOWED_COUNTRY_CODES = new Set([
  'FR', 'BE', 'DE', 'ES', 'IT', 'LU', 'NL', 'PT', 'GB', 'IE',
  'CH', 'AT', 'DK', 'SE', 'NO', 'FI', 'IS',
  'PL', 'CZ', 'SK', 'HU', 'SI', 'HR', 'RO', 'BG', 'GR',
  'EE', 'LV', 'LT', 'MT', 'CY',
  'MC', 'AD', 'SM', 'VA', 'LI',
]);

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
 * Restreint aux pays de ALLOWED_COUNTRY_CODES (France + Europe) et biaise les
 * résultats vers la France, pour éviter les adresses hors zone (Russie, Chine…).
 * Retourne un tableau vide en cas d'erreur réseau ou de requête annulée —
 * l'autocomplétion ne doit jamais faire planter le formulaire de réservation.
 */
export async function searchAddress(
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    q: trimmed,
    limit: '5',
    lang: 'fr',
    bbox: EUROPE_BBOX,
    lat: String(FRANCE_BIAS.lat),
    lon: String(FRANCE_BIAS.lon),
    zoom: String(FRANCE_BIAS.zoom),
  });
  const url = `${PHOTON_URL}?${params.toString()}`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const json = await res.json();
    const features: any[] = json?.features ?? [];

    return features
      .filter((f) => ALLOWED_COUNTRY_CODES.has(f.properties?.countrycode))
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
