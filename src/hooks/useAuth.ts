import { useState, useEffect, useCallback } from 'react';

const AUTH_STORAGE_KEY = 'livnow_community_user';
const AUTH_CHANGED_EVENT = 'livnow-auth-changed';

function readUserFromStorage(): User | null {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarDataUrl?: string | null;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: { name?: string; avatarDataUrl?: string | null }) => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(() => readUserFromStorage());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(readUserFromStorage());
    setLoading(false);
  }, []);

  useEffect(() => {
    const onAuthChanged = () => setUser(readUserFromStorage());
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, []);

  const login = useCallback(async (email: string, _password: string): Promise<{ success: boolean; error?: string }> => {
    // TODO: Replace with actual API call
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockUser: User = {
        id: '1',
        email: email.trim(),
        name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      };

      setUser(mockUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      notifyAuthChanged();
      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    notifyAuthChanged();
  }, []);

  const updateProfile = useCallback((updates: { name?: string; avatarDataUrl?: string | null }) => {
    const current = readUserFromStorage();
    if (!current) return;
    const next: User = {
      ...current,
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.avatarDataUrl !== undefined ? { avatarDataUrl: updates.avatarDataUrl } : {}),
    };
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      setUser(next);
      notifyAuthChanged();
    } catch {
      // QuotaExceededError or other — caller should handle UX if needed
      throw new Error('Could not save profile (storage may be full). Try a smaller image.');
    }
  }, []);

  return { user, loading, login, logout, updateProfile };
}
