import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { RiskTolerance } from '../types/user';

export interface UserProfile {
  id: string;
  email: string;
  riskTolerance: RiskTolerance;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchUserProfile(token);
    }
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      console.log("Fetching user profile with token:", token.substring(0, 20) + "...");
      const response = await axios.get<UserProfile>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("User profile response:", response.data);
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUser(null);
      setIsAuthenticated(false); // Also set authentication to false on error
    }
  };

  const login = (token: string) => {
    console.log("Login function called with token:", token.substring(0, 20) + "...");
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    console.log("Set isAuthenticated to true, now fetching user profile...");
    fetchUserProfile(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 