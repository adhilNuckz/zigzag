import { create } from "zustand";
import CryptoJS from "crypto-js";

const STORAGE_KEY = "zz_session";
const ENCRYPTION_KEY = "zigzag_anon_k3y_2024";

interface AuthState {
  token: string | null;
  anonId: string | null;
  alias: string | null;
  isAuthenticated: boolean;
  login: (data: { token: string; anonId: string; alias: string }) => void;
  updateToken: (token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

function encrypt(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

function decrypt(cipher: string): string | null {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, ENCRYPTION_KEY);
    const text = bytes.toString(CryptoJS.enc.Utf8);
    return text || null;
  } catch {
    return null;
  }
}

function saveSession(token: string, anonId: string, alias: string) {
  const payload = JSON.stringify({ token, anonId, alias });
  localStorage.setItem(STORAGE_KEY, encrypt(payload));
}

function loadSession(): { token: string; anonId: string; alias: string } | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const decrypted = decrypt(raw);
  if (!decrypted) return null;
  try {
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  anonId: null,
  alias: null,
  isAuthenticated: false,

  login: ({ token, anonId, alias }) => {
    saveSession(token, anonId, alias);
    set({ token, anonId, alias, isAuthenticated: true });
  },

  updateToken: (token) => {
    set((state) => {
      if (state.anonId && state.alias) {
        saveSession(token, state.anonId, state.alias);
      }
      return { token };
    });
  },

  logout: () => {
    clearSession();
    set({ token: null, anonId: null, alias: null, isAuthenticated: false });
  },

  hydrate: () => {
    const session = loadSession();
    if (session) {
      set({
        token: session.token,
        anonId: session.anonId,
        alias: session.alias,
        isAuthenticated: true,
      });
    }
  },
}));
