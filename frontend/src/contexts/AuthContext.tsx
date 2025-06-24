import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RiskTolerance } from '../types/user';
import { toast } from 'react-hot-toast';

export interface UserProfile {
  id: string;
  email: string;
  riskTolerance: RiskTolerance;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: () => {},
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
        await fetchUserProfile(token);
      } else {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      console.log("Fetching user profile with token:", token.substring(0, 20) + "...");
      const response = await axios.get<UserProfile>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("User profile response:", response.data);
      console.log("🔍 AuthContext - Setting user data:", response.data);
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      
      // Only clear token if it's a 401 (unauthorized) error
      if (error.response?.status === 401) {
        console.log("Token is invalid, clearing authentication");
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
      } else {
        // For other errors (network, server errors), keep the token but show error
        console.log("Network or server error, keeping token for retry");
        toast.error('Unable to verify authentication. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = (token: string) => {
    console.log("Login function called with token:", token.substring(0, 20) + "...");
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    setIsLoading(true);
    console.log("Set isAuthenticated to true, now fetching user profile...");
    fetchUserProfile(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    toast.success('You have been logged out.');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 