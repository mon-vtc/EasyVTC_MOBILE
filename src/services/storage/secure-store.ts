import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN:  'easyvtc_access_token',
  REFRESH_TOKEN: 'easyvtc_refresh_token',
} as const;

export const secureStorage = {
  getAccessToken:  () => SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
  getRefreshToken: () => SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),

  setTokens: async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN,  accessToken);
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
  },

  clearTokens: async () => {
    await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN).catch(() => {});
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN).catch(() => {});
  },
};