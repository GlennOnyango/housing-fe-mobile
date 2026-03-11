import * as SecureStore from "expo-secure-store";

import type { TokenPair } from "@/src/types/contracts";

const REFRESH_TOKEN_KEY = "auth.refreshToken";

let accessTokenInMemory: string | null = null;

export const tokenStore = {
  getAccessToken() {
    return accessTokenInMemory;
  },

  setAccessToken(token: string | null) {
    accessTokenInMemory = token;
  },

  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async hasRefreshToken() {
    const token = await this.getRefreshToken();
    return Boolean(token);
  },

  async setRefreshToken(token: string) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async setTokens(tokens: TokenPair) {
    accessTokenInMemory = tokens.accessToken;
    await this.setRefreshToken(tokens.refreshToken);
  },

  async clear() {
    accessTokenInMemory = null;
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
