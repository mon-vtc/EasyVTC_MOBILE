// ══════════════════════════════════════════════════════════════════════════════
// Formatage de durée relative ("il y a X minutes") — français, sans dépendance
// aux fichiers de locale date-fns (qui peuvent se comporter différemment sur
// Hermes selon les builds, tronquant parfois l'unité). Chaînes explicites,
// garanties complètes quel que soit le runtime.
// ══════════════════════════════════════════════════════════════════════════════

interface RelativeUnit {
  /** Durée max (en secondes) pour laquelle cette unité s'applique. */
  limit: number;
  /** Nombre de secondes que représente une unité (ex: 60 pour "minute"). */
  secondsPerUnit: number;
  singular: string;
  plural: string;
}

const UNITS: RelativeUnit[] = [
  { limit: 60,                secondsPerUnit: 1,             singular: 'seconde', plural: 'secondes' },
  { limit: 60 * 60,           secondsPerUnit: 60,            singular: 'minute',  plural: 'minutes' },
  { limit: 24 * 60 * 60,      secondsPerUnit: 60 * 60,       singular: 'heure',   plural: 'heures' },
  { limit: 30 * 24 * 60 * 60, secondsPerUnit: 24 * 60 * 60,  singular: 'jour',    plural: 'jours' },
  { limit: 365 * 24 * 60 * 60, secondsPerUnit: 30 * 24 * 60 * 60, singular: 'mois', plural: 'mois' },
];

/**
 * Formate une date passée en "il y a X <unité>" (français, unité toujours précisée).
 * Retourne "à l'instant" pour les tous premiers instants, et "il y a X an(s)" au-delà d'un an.
 * Les dates futures (horloge/désync serveur) sont traitées comme "à l'instant".
 */
export function formatRelativeTime(date: string | Date): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  const diffSeconds = Math.floor((Date.now() - target.getTime()) / 1000);

  if (diffSeconds < 5) {
    return "à l'instant";
  }

  for (let i = 0; i < UNITS.length; i++) {
    const unit = UNITS[i];
    if (diffSeconds < unit.limit) {
      const count = Math.max(1, Math.floor(diffSeconds / unit.secondsPerUnit));
      let unitWord = unit.plural;
      if (count === 1) {
        unitWord = unit.singular;
      }
      const countText = count.toString();
      const parts = ['il y a', countText, unitWord];
      return parts.join(' ');
    }
  }

  const years = Math.floor(diffSeconds / (365 * 24 * 60 * 60));
  let yearSuffix = '';
  if (years > 1) {
    yearSuffix = 's';
  }
  const yearsText = years.toString();
  return ['il y a', yearsText, 'an' + yearSuffix].join(' ');
}
