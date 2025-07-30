import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, BusinessProfile } from '../types';

interface AuthContextType {
  user: User | null;
  businessProfile: BusinessProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string, otp: string) => Promise<void>;
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
    const savedProfile = localStorage.getItem('businessProfile');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedProfile) {
      setBusinessProfile(JSON.parse(savedProfile));
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with actual authentication
      const mockUser: User = {
        id: Date.now().toString(),
        email,
        name: email.split('@')[0],
        createdAt: new Date().toISOString()
      };
      
      setUser(mockUser);
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      
      // Check for existing business profile
      const existingProfile = localStorage.getItem(`businessProfile_${mockUser.id}`);
      if (existingProfile) {
        const profile = JSON.parse(existingProfile);
        setBusinessProfile(profile);
        localStorage.setItem('businessProfile', JSON.stringify(profile));
      }
    } catch (error) {
      throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPhone = async (phone: string, otp: string) => {
    setIsLoading(true);
    try {
      // Simulate OTP verification - replace with actual authentication
      const mockUser: User = {
        id: Date.now().toString(),
        email: `${phone}@phone.local`,
        phone,
        name: `User ${phone.slice(-4)}`,
        createdAt: new Date().toISOString()
      };
      
      setUser(mockUser);
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      
      // Check for existing business profile
      const existingProfile = localStorage.getItem(`businessProfile_${mockUser.id}`);
      if (existingProfile) {
        const profile = JSON.parse(existingProfile);
        setBusinessProfile(profile);
        localStorage.setItem('businessProfile', JSON.stringify(profile));
      }
    } catch (error) {
      throw new Error('Phone login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setBusinessProfile(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('businessProfile');
    // Clear all user-specific data
    localStorage.clear();
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
    localStorage.setItem('businessProfile', JSON.stringify(profile));
    localStorage.setItem(`businessProfile_${user.id}`, JSON.stringify(profile));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        businessProfile,
        isLoading,
        login,
        loginWithPhone,
        logout,
        updateBusinessProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};