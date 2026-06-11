// ══════════════════════════════════════════════════════════════════════════════
// API — Module Marketing
// ══════════════════════════════════════════════════════════════════════════════

import { api } from '../../lib/api';
import type { ApiResponse } from '../../types';
import type {
  ClientBaseFilters,
  ClientBaseResult,
  CreateCampaignDto,
  MarketingCampaign,
  CampaignListResult
} from '../../types/marketing.types';

class MarketingApi {
  listClients(
    token: string,
    filters?: ClientBaseFilters,
  ): Promise<ApiResponse<ClientBaseResult>> {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString();
    return api.get(`/admin/marketing/clients${qs ? `?${qs}` : ''}`, token);
  }

  listCampaigns(token: string, page: number, limit: number): Promise<ApiResponse<CampaignListResult>> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    return api.get(`/admin/marketing/campaigns?${params.toString()}`, token);
  }

  createCampaign(token: string, dto: CreateCampaignDto): Promise<ApiResponse<MarketingCampaign>> {
    return api.post('/admin/marketing/campaigns', dto, token);
  }
}

export const marketingApi = new MarketingApi();