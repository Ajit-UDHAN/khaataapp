import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, BusinessProfile } from '../types';

interface AuthContextType {
  user: User | null;
  businessProfile: BusinessProfile | null;
  isLoading: boolean;
  login: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  updateBusinessProfile: (profile: Omit<BusinessProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('currentUser');

    if (savedUser) {
      const user = JSON.parse(savedUser);
      setUser(user);

      // Load business profile for this user
      const savedProfile = localStorage.getItem(`${user.id}_businessProfile`);
      if (savedProfile) {
        setBusinessProfile(JSON.parse(savedProfile));
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      // Create consistent user ID from email
      const userId = btoa(email).replace(/[^a-zA-Z0-9]/g, '');
      
      // Check if user exists for signin
      const existingUserData = localStorage.getItem(`user_${userId}`);
      
      if (!name && !existingUserData) {
        throw new Error('User not found. Please sign up first.');
      }
      
      if (name && existingUserData) {
        throw new Error('User already exists. Please sign in instead.');
      }
      
      let userData: User;
      
      if (existingUserData) {
        // Existing user - verify password
        const storedData = JSON.parse(existingUserData);
        if (storedData.password !== btoa(password)) {
          throw new Error('Invalid password');
        }
        userData = storedData.user;
      } else {
        // New user - create account
        userData = {
          id: userId,
          email,
          name: name || email.split('@')[0],
          createdAt: new Date().toISOString()
        };
        
        // Store user data with password
        localStorage.setItem(`user_${userId}`, JSON.stringify({
          user: userData,
          password: btoa(password)
        }));
      }
      
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      // Check for existing business profile
      const existingProfile = localStorage.getItem(`${userData.id}_businessProfile`);
      if (existingProfile) {
        const profile = JSON.parse(existingProfile);
        setBusinessProfile(profile);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login_old = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const mockUser: User = {
        id: btoa(email).replace(/[^a-zA-Z0-9]/g, ''), // Create consistent ID from email
        email,
        name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        createdAt: new Date().toISOString()
      };
      
      setUser(mockUser);
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      
      // Check for existing business profile
      const existingProfile = localStorage.getItem(`${mockUser.id}_businessProfile`);
      if (existingProfile) {
        const profile = JSON.parse(existingProfile);
        setBusinessProfile(profile);
      }
    } catch (error) {
      throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setBusinessProfile(null);
    localStorage.removeItem('currentUser');
    // Note: User-specific data remains in localStorage with user ID prefix
    // This allows users to log back in and see their data
  };

  const updateBusinessProfile = (profileData: Omit<BusinessProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    const profile: BusinessProfile = {
      id: businessProfile?.id || Date.now().toString(),
      userId: user.id,
      ...profileData,
      createdAt: businessProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setBusinessProfile(profile);
    localStorage.setItem(`${user.id}_businessProfile`, JSON.stringify(profile));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        businessProfile,
        isLoading,
        login,
        logout,
        updateBusinessProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};