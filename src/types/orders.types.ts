// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module Bons de commande (Orders)
// Sprint 4 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

// ── Snapshots (données figées au moment de la génération) ─────────────────────

export interface DriverSnapshot {
  first_name: string;
  last_name:  string;
  phone:      string | null;
  siret:      string | null;
}

export interface PassengerSnapshot {
  first_name: string;
  last_name:  string;
  phone:      string | null;
}

export interface TripSnapshot {
  pickup_address: string;
  dest_address:   string;
  vehicle_type:   string;
  country:        string;
  scheduled_at:   string;
  comment:        string | null;
  via:            string;
  pricing_type:   'formula' | 'flat_rate';
  final_price:    number | null;
  currency:       'EUR' | 'XOF';
}

// ── Entité principale ─────────────────────────────────────────────────────────

export interface Order {
  id:                 string;
  reservation_id:     string;
  order_number:       string;
  pdf_url:            string | null;
  driver_snapshot:    DriverSnapshot;
  passenger_snapshot: PassengerSnapshot;
  trip_snapshot:      TripSnapshot;
  issued_at:          string;
  created_at:         string;
  updated_at:         string;
}

// ── Liste paginée ─────────────────────────────────────────────────────────────

export interface OrderListResult {
  orders:      Order[];
  total:       number;
  page:        number;
  limit:       number;
  total_pages: number;
}

export interface OrderListFilters {
  page?:           number;
  limit?:          number;
  reservation_id?: string;
}
