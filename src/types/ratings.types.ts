// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module Évaluations (Ratings)
// Sprint 6 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

export interface Rating {
  id:             string;
  reservation_id: string;
  client_id:      string;
  driver_id:      string;
  note:           number;
  comment:        string | null;
  created_at:     string;
}

export interface RatingWithClient extends Rating {
  client_first_name:        string | null;
  client_last_name:         string | null;
  reservation_scheduled_at: string | null;
}

export interface RatingAdmin extends RatingWithClient {
  driver_first_name: string | null;
  driver_last_name:  string | null;
}

export interface DriverRatingsResult {
  ratings:     RatingWithClient[];
  avg_note:    number | null;
  total:       number;
  page:        number;
  limit:       number;
  total_pages: number;
}

export interface AdminRatingsResult {
  ratings:     RatingAdmin[];
  total:       number;
  page:        number;
  limit:       number;
  total_pages: number;
}
