import { create } from 'zustand';
import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'zigzag_session';
const ENCRYPT_KEY = 'zz_local_key'; // Client-side only

function encryptStore(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPT_KEY).toString();
}

function decryptStore(cipher) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, ENCRYPT_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch {
    return null;
  }
}

function loadSession() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return decryptStore(stored);
  } catch {
    return null;
  }
}

function saveSession(data) {
  try {
    localStorage.setItem(STORAGE_KEY, encryptStore(data));
  } catch {}
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

const existing = loadSession();

const useAuthStore = create((set, get) => ({
  token: existing?.token || null,
  anonId: existing?.anonId || null,
  alias: existing?.alias || null,
  isAuthenticated: !!existing?.token,

  login: (data) => {
    saveSession(data);
    set({
      token: data.token,
      anonId: data.anonId,
      alias: data.alias,
      isAuthenticated: true,
    });
  },

  updateToken: (token) => {
    const state = get();
    const newData = { token, anonId: state.anonId, alias: state.alias };
    saveSession(newData);
    set({ token });
  },

  logout: () => {
    clearSession();
    set({
      token: null,
      anonId: null,
      alias: null,
      isAuthenticated: false,
    });
  },
}));

export default useAuthStore;
