import { renderHook, act } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../services/api/auth.api';
import { authStorage as secureStorage } from '../../services/auth/auth-storage';

jest.mock('../../services/api/auth.api');
jest.mock('../../services/auth/auth-storage');

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockStorage = secureStorage as jest.Mocked<typeof secureStorage>;

const FIVE_MIN_MS = 5 * 60 * 1000;

describe('useInactivityLogout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockAuthApi.logout.mockResolvedValue({ ok: true } as any);
    mockStorage.clearTokens.mockResolvedValue(undefined);
    useAuthStore.setState({ accessToken: 'token-123', refreshToken: 'refresh-123', user: { id: 'u1' } as any });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("ne déconnecte pas avant 5 minutes d'inactivité", async () => {
    renderHook(() => useInactivityLogout());

    await act(async () => {
      jest.advanceTimersByTime(FIVE_MIN_MS - 1000);
    });

    expect(useAuthStore.getState().accessToken).toBe('token-123');
  });

  it("déconnecte après 5 minutes d'inactivité", async () => {
    renderHook(() => useInactivityLogout());

    await act(async () => {
      jest.advanceTimersByTime(FIVE_MIN_MS + 1000);
    });

    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('recordActivity() réinitialise le minuteur', async () => {
    const { result } = renderHook(() => useInactivityLogout());

    await act(async () => {
      jest.advanceTimersByTime(FIVE_MIN_MS - 1000);
    });
    expect(useAuthStore.getState().accessToken).toBe('token-123');

    act(() => {
      result.current.recordActivity();
    });

    await act(async () => {
      jest.advanceTimersByTime(FIVE_MIN_MS - 1000);
    });
    expect(useAuthStore.getState().accessToken).toBe('token-123');

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('ne fait rien si aucun utilisateur n\'est connecté', async () => {
    useAuthStore.setState({ accessToken: null, refreshToken: null, user: null });
    renderHook(() => useInactivityLogout());

    await act(async () => {
      jest.advanceTimersByTime(FIVE_MIN_MS + 1000);
    });

    expect(mockAuthApi.logout).not.toHaveBeenCalled();
  });

  it('déconnecte si le délai est dépassé pendant que l\'app est en arrière-plan', async () => {
    let listener: ((state: string) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, cb: (state: string) => void) => {
      listener = cb;
      return { remove: () => {} } as any;
    }) as any);

    renderHook(() => useInactivityLogout());

    await act(async () => {
      listener?.('background');
      jest.advanceTimersByTime(FIVE_MIN_MS + 1000);
      listener?.('active');
    });

    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
