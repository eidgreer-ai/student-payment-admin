import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const authToken = localStorage.getItem("student-admin-auth");
    if (authToken) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (password: string): Promise<boolean> => {
    try {
      // Store the authentication state in localStorage
      localStorage.setItem("student-admin-auth", "true");
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("student-admin-auth");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useLocalAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useLocalAuth must be used within AuthProvider");
  }
  return context;
}
