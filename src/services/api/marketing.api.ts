// ══════════════════════════════════════════════════════════════════════════════
// API — Module Marketing
// ══════════════════════════════════════════════════════════════════════════════

import { api } from '../../lib/api';
import type {
  ApiResponse,
  ClientBaseFilters,
  ClientBaseResult,
  MarketingCampaign,
  CampaignListResult,
  CreateCampaignDto,
  UpdateMarketingConsentsDto,
  UpdateCampaignDto,
  MyMarketingProfile,
} from '../../types';

class MarketingApi {
  listClients(token: string, filters?: ClientBaseFilters): Promise<ApiResponse<ClientBaseResult>> {
    const params = new URLSearchParams(filters as any).toString();
    return api.get(`/admin/marketing/clients?${params}`, token);
  }

  listCampaigns(token: string, page: number, limit: number): Promise<ApiResponse<CampaignListResult>> {
    return api.get(`/admin/marketing/campaigns?page=${page}&limit=${limit}`, token);
  }

  createCampaign(token: string, dto: CreateCampaignDto): Promise<ApiResponse<MarketingCampaign>> {
    return api.post('/admin/marketing/campaigns', dto, token);
  }

  updateCampaign(token: string, id: string, dto: UpdateCampaignDto): Promise<ApiResponse<MarketingCampaign>> {
    return api.patch(`/admin/marketing/campaigns/${id}`, dto, token);
  }

  deleteCampaign(token: string, id: string): Promise<ApiResponse<void>> {
    return api.delete(`/admin/marketing/campaigns/${id}`, token);
  }

  sendCampaign(token: string, id: string): Promise<ApiResponse<{ sent_count: number }>> {
    return api.post(`/admin/marketing/campaigns/${id}/send`, {}, token);
  }

  updateMyConsents(token: string, dto: UpdateMarketingConsentsDto): Promise<ApiResponse<void>> {
    return api.patch('/users/me/marketing-consents', dto, token);
  }

  getMyMarketingProfile(token: string): Promise<ApiResponse<MyMarketingProfile>> {
    return api.get('/users/me/marketing-consents', token);
  }
}

export const marketingApi = new MarketingApi();