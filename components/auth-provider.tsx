'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type AuthContextType = {
  authenticated: boolean;
  loading: boolean;
  checkAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  loading: true,
  checkAuth: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAuthenticated(!data.setupRequired);
      } else {
        setAuthenticated(false);
      }
    } catch {
      setAuthenticated(false);
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ authenticated, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
