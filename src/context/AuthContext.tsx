import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  adminId: string | null;
  username: string | null;
  login: (adminId: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('admin_auth');
    if (stored) {
      const data = JSON.parse(stored);
      setIsAuthenticated(true);
      setAdminId(data.adminId);
      setUsername(data.username);
    }
  }, []);

  const login = (adminId: string, username: string) => {
    localStorage.setItem('admin_auth', JSON.stringify({ adminId, username }));
    setIsAuthenticated(true);
    setAdminId(adminId);
    setUsername(username);
  };

  const logout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setAdminId(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, adminId, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
