// hooks/useReservationFilters.ts
// Applique les filtres (date exacte / période) et le tri (date ou prix, asc/desc)
// sur une liste de Reservation déjà chargée.
// Retourne aussi les paramètres API (date_from/date_to) à envoyer à fetchMine/fetchAll/…
import { useMemo } from 'react';
import type { Reservation, ReservationListFilters } from '../types/reservations.types';
import type { ReservationFilters } from '../components/common/ReservationFilterModal';

// Construit les filtres à passer à l'API selon le mode de date choisi
export function filtersToApiParams(
  f: ReservationFilters,
): Pick<ReservationListFilters, 'date_from' | 'date_to'> {
  if (f.dateMode === 'specific' && f.dateExact) {
    // Même jour : date_from = début du jour, date_to = fin du jour
    return {
      date_from: `${f.dateExact}T00:00:00.000Z`,
      date_to:   `${f.dateExact}T23:59:59.999Z`,
    };
  }
  if (f.dateMode === 'period') {
    return {
      date_from: f.dateFrom ? `${f.dateFrom}T00:00:00.000Z` : undefined,
      date_to:   f.dateTo   ? `${f.dateTo}T23:59:59.999Z`   : undefined,
    };
  }
  return {};
}

// Applique le tri côté client sur la liste déjà filtrée par le backend
export function useSortedReservations(
  reservations: Reservation[],
  filters: ReservationFilters,
): Reservation[] {
  return useMemo(() => {
    const list = [...reservations];
    list.sort((a, b) => {
      let diff = 0;
      if (filters.sortField === 'date') {
        diff = new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      } else {
        const pa = a.price_final ?? a.price_estimated ?? 0;
        const pb = b.price_final ?? b.price_estimated ?? 0;
        diff = pa - pb;
      }
      return filters.sortOrder === 'asc' ? diff : -diff;
    });
    return list;
  }, [reservations, filters.sortField, filters.sortOrder]);
}

// Indique si des filtres non-défaut sont actifs (pour afficher un badge)
export function isFiltersActive(f: ReservationFilters): boolean {
  return (
    f.dateMode  !== 'none' ||
    f.sortField !== 'date' ||
    f.sortOrder !== 'desc'
  );
}