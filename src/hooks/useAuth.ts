import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('livnow_community_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('livnow_community_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
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
      localStorage.setItem('livnow_community_user', JSON.stringify(mockUser));
      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('livnow_community_user');
  }, []);

  return { user, loading, login, logout };
}
