// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module Factures (Invoices)
// Sprint 4 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

// ── Snapshots (données figées au moment de la génération) ─────────────────────

export interface DriverBillingSnapshot {
  first_name: string;
  last_name:  string;
  phone:      string | null;
  email:      string | null;
  siret:      string | null;
  tva_rate:   number;
  zone:       string;
}

export interface ClientInvoiceSnapshot {
  first_name: string;
  last_name:  string;
  phone:      string | null;
  email:      string | null;
}

export interface TripInvoiceSnapshot {
  pickup_address:      string;
  dest_address:        string;
  vehicle_type:        string;
  country:             string;
  scheduled_at:        string;
  started_at:          string | null;
  ended_at:            string | null;
  actual_distance_km:  number | null;
  actual_duration_min: number | null;
}

// ── Traçabilité des ajustements de prix ───────────────────────────────────────

export interface InvoiceAdjustment {
  adjusted_at:      string;
  adjusted_by:      string;
  adjusted_by_name: string;
  old_amount_ttc:   number;
  new_amount_ttc:   number;
  reason:           string;
}

// ── Entité principale ─────────────────────────────────────────────────────────

export interface Invoice {
  id:              string;
  trip_id:         string;
  invoice_number:  string;
  pdf_url:         string | null;
  driver_billing:  DriverBillingSnapshot;
  client_snapshot: ClientInvoiceSnapshot;
  trip_snapshot:   TripInvoiceSnapshot;
  amount_ht:       number;
  tva_rate:        number;
  /** Montant TTC de la remise appliquée via code promo — null si aucune remise */
  discount_amount: number | null;
  amount_ttc:      number;
  adjustments:     InvoiceAdjustment[];
  issued_at:       string;
  created_at:      string;
  updated_at:      string;
  // Relation avec le trip et la réservation
  trip?: {
    id: string;
    reservation_id: string;
  };
}


// ── Liste paginée ─────────────────────────────────────────────────────────────

export interface InvoiceListResult {
  invoices:    Invoice[];
  total:       number;
  page:        number;
  limit:       number;
  total_pages: number;
}

export interface InvoiceListFilters {
  page?:  number;
  limit?: number;
}

// ── DTO ajustement de prix ────────────────────────────────────────────────────

export interface AdjustInvoicePriceDto {
  new_amount_ttc: number;
  reason:         string;
}
