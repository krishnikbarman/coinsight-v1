import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Admin credentials configuration
const ADMIN_CREDENTIALS = {
  email: 'admin@coinsight.app',
  password: 'coinsight123',
};

const STORAGE_KEY = 'coinsight_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY);
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.loggedIn) {
            setUser(userData);
            setIsLoggedIn(true);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
      setIsLoading(false);
    };

    // Small delay to show loading state
    setTimeout(checkAuth, 300);
  }, []);

  const login = (email, password) => {
    // Validate credentials
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      const userData = {
        email: email,
        role: 'admin',
        loggedIn: true,
        loginTime: new Date().toISOString(),
      };

      // Store in localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      setIsLoggedIn(true);
      
      return { success: true };
    }

    return { success: false, error: 'Invalid Credentials' };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setIsLoggedIn(false);
  };

  const value = {
    user,
    isLoggedIn,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
