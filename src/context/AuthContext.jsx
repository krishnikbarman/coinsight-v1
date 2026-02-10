import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { isAdminEmail } from '../config/admin';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount and set up auth state listener
  useEffect(() => {
    let mounted = true;
    let authSubscription = null;

    const initAuth = async () => {
      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), 3000)
        );

        const sessionPromise = supabase.auth.getSession();

        const result = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]);

        const session = result?.data?.session || null;

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoggedIn(!!session);
          setIsLoading(false);
        }
      } catch (error) {
        console.warn('⚠️  Supabase connection failed:', error.message);
        
        // Clear all auth state on error
        if (mounted) {
          setSession(null);
          setUser(null);
          setIsLoggedIn(false);
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoggedIn(!!session);
        }
      });
      authSubscription = subscription;
    } catch (error) {
      console.warn('Could not set up auth listener:', error);
    }

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Register new user
  const register = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Registration successful! Please check your email to confirm your account.',
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    }
  };

  // Login existing user
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user email is the admin email
      if (data.user && !isAdminEmail(data.user.email)) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Access denied. Only admin can access this dashboard.',
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error during logout:', error.message);
    } finally {
      // Always clear local state on logout
      setSession(null);
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  const value = {
    user,
    session,
    isLoggedIn,
    isLoading,
    isAdmin: user ? isAdminEmail(user.email) : false,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
