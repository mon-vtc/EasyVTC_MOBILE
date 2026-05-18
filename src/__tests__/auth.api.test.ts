/**
 * Tests unitaires — authApi (src/services/api/auth.api.ts)
 *
 * Vérifie que chaque fonction appelle le bon endpoint avec
 * les bons paramètres. fetch est mocké globalement.
 */

import { authApi } from '../services/api/auth.api';

// ── Mock global fetch ────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// ── Helpers ──────────────────────────────────────────────────────
function mockOkResponse(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    json: async () => ({ ok: true, data }),
  } as Response);
}

function mockErrorResponse(message: string, status = 400) {
  mockFetch.mockResolvedValueOnce({
    json: async () => ({ ok: false, message }),
  } as Response);
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_API_URL = 'http://10.0.2.2:4000';
});

// ══════════════════════════════════════════════════════════════════
// login
// ══════════════════════════════════════════════════════════════════
describe('authApi.login', () => {
  it(' POST /auth/login avec les credentials', async () => {
    mockOkResponse({ user: { id: 'u1' }, access_token: 'tok', refresh_token: 'ref' });

    await authApi.login({ email: 'a@b.com', password: 'Pass1234' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'Pass1234' }),
      })
    );
  });

  it(' retourne ok:false si credentials invalides', async () => {
    mockErrorResponse('Email ou mot de passe incorrect');
    const res = await authApi.login({ email: 'x@x.com', password: 'wrong' });
    expect(res.ok).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════
// google — REGRESSION bug endpoint incorrect
// ══════════════════════════════════════════════════════════════════
describe('authApi.google — REGRESSION endpoint', () => {
  it(' POST /auth/google/token (pas /auth/google)', async () => {
    mockOkResponse({ user: { id: 'u1' }, access_token: 'tok', refresh_token: null });

    await authApi.google('google-access-token');

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/google/token');
    expect(url).not.toContain('/auth/google\n'); // pas le endpoint GET
    const body = JSON.parse(options.body as string);
    expect(body).toMatchObject({ access_token: 'google-access-token' });
  });

  it(' transmet refresh_token si fourni', async () => {
    mockOkResponse({ user: { id: 'u1' }, access_token: 'tok', refresh_token: 'ref' });

    await authApi.google('g-access', 'g-refresh');

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.refresh_token).toBe('g-refresh');
  });
});

// ══════════════════════════════════════════════════════════════════
// register
// ══════════════════════════════════════════════════════════════════
describe('authApi.register', () => {
  it(' POST /auth/register avec le bon payload', async () => {
    mockOkResponse({ user: { id: 'u2' }, access_token: 'tok', refresh_token: 'ref' });

    const payload = {
      email: 'new@test.com',
      password: 'Test1234',
      first_name: 'Jean',
      last_name: 'Dupont',
      phone: '+33612345678',
      role: 'client' as const,
      accept_terms: true,
      rgpd_consent: true,
    };

    await authApi.register(payload);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/register'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it(' retourne ok:false si email déjà existant', async () => {
    mockErrorResponse('Un compte existe déjà avec cet email');
    const res = await authApi.register({
      email: 'dup@test.com', password: 'Test1234', first_name: 'A',
      last_name: 'B', phone: '+33611111111', role: 'client', accept_terms: true, rgpd_consent: true,
    });
    expect(res.ok).toBe(false);
    expect(res.message).toContain('existe déjà');
  });
});

// ══════════════════════════════════════════════════════════════════
// me
// ══════════════════════════════════════════════════════════════════
describe('authApi.me', () => {
  it(' GET /auth/me avec Bearer token', async () => {
    mockOkResponse({ id: 'u1', email: 'a@b.com', role: 'client' });

    await authApi.me('my-token');

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/me');
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
  });
});

// ══════════════════════════════════════════════════════════════════
// logout
// ══════════════════════════════════════════════════════════════════
describe('authApi.logout', () => {
  it(' POST /auth/logout avec Bearer token', async () => {
    mockOkResponse(null);

    await authApi.logout('my-token');

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/logout');
    expect(options.method).toBe('POST');
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
  });
});

// ══════════════════════════════════════════════════════════════════
// refresh
// ══════════════════════════════════════════════════════════════════
describe('authApi.refresh', () => {
  it(' POST /auth/refresh avec refresh_token', async () => {
    mockOkResponse({ access_token: 'new-tok', refresh_token: 'new-ref' });

    await authApi.refresh('old-refresh');

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/refresh');
    const body = JSON.parse(options.body as string);
    expect(body.refresh_token).toBe('old-refresh');
  });
});

// ══════════════════════════════════════════════════════════════════
// forgotPassword
// ══════════════════════════════════════════════════════════════════
describe('authApi.forgotPassword', () => {
  it(' POST /auth/forgot-password avec email', async () => {
    mockOkResponse(null);

    await authApi.forgotPassword('user@test.com');

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/forgot-password');
    const body = JSON.parse(options.body as string);
    expect(body.email).toBe('user@test.com');
  });
});

// ══════════════════════════════════════════════════════════════════
// resetPassword — nouveau endpoint
// ══════════════════════════════════════════════════════════════════
describe('authApi.resetPassword', () => {
  it(' POST /auth/reset-password avec token Bearer + new_password', async () => {
    mockOkResponse(null);

    await authApi.resetPassword('eyJhbGci...jwt', 'NewPass123');

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/reset-password');
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer eyJhbGci...jwt');
    const body = JSON.parse(options.body as string);
    expect(body.new_password).toBe('NewPass123');
  });

  it(' retourne ok:false si token invalide', async () => {
    mockErrorResponse('Token invalide ou expiré');
    const res = await authApi.resetPassword('bad-token', 'NewPass123');
    expect(res.ok).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════
// changePassword
// ══════════════════════════════════════════════════════════════════
describe('authApi.changePassword', () => {
  it(' POST /auth/change-password avec les 3 champs + token', async () => {
    mockOkResponse(null);

    await authApi.changePassword('OldPass1', 'NewPass2', 'NewPass2', 'my-token');

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/change-password');
    const body = JSON.parse(options.body as string);
    expect(body).toMatchObject({
      current_password:  'OldPass1',
      new_password:      'NewPass2',
      confirm_password:  'NewPass2',
    });
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
  });
});

// ══════════════════════════════════════════════════════════════════
// uploadAvatar
// ══════════════════════════════════════════════════════════════════
describe('authApi.uploadAvatar', () => {
  it(' POST /users/me/avatar avec FormData + token', async () => {
    mockOkResponse({ profile_photo_url: 'https://cdn.example.com/photo.jpg' });

    const formData = new FormData();
    await authApi.uploadAvatar(formData, 'my-token');

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/users/me/avatar');
    expect(options.body).toBeInstanceOf(FormData);
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
  });

  it(' réponse contient profile_photo_url', async () => {
    mockOkResponse({ profile_photo_url: 'https://cdn.example.com/photo.jpg' });
    const res = await authApi.uploadAvatar(new FormData(), 'tok');
    expect(res.data?.profile_photo_url).toBe('https://cdn.example.com/photo.jpg');
  });
});
