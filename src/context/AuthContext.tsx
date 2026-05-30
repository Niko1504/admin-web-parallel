import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  adminId: string | null;
  username: string | null;
  login: (adminId: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState(() => {
    const stored = localStorage.getItem('admin_auth');
    if (!stored) {
      return { isAuthenticated: false, adminId: null, username: null };
    }

    const data = JSON.parse(stored);
    return {
      isAuthenticated: true,
      adminId: data.adminId,
      username: data.username,
    };
  });

  const login = (adminId: string, username: string) => {
    localStorage.setItem('admin_auth', JSON.stringify({ adminId, username }));
    setAuthState({ isAuthenticated: true, adminId, username });
  };

  const logout = () => {
    localStorage.removeItem('admin_auth');
    setAuthState({ isAuthenticated: false, adminId: null, username: null });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
