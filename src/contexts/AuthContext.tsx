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
      // TODO: Replace with actual authentication service
      // For now, create user based on email
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

  const loginWithPhone = async (phone: string, otp: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with real OTP verification service
      // Example implementations:
      
      // Firebase Auth:
      // const confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
      // const result = await confirmationResult.confirm(otp);
      
      // Twilio/MSG91 API:
      // const response = await fetch('/api/verify-otp', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phone, otp })
      // });
      
      throw new Error('OTP verification not implemented. Please integrate with Firebase Auth, Twilio, MSG91, or AWS SNS for production use.');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Phone login failed');
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
        loginWithPhone,
        logout,
        updateBusinessProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};