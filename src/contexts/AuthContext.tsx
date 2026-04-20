import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, BusinessProfile } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  businessProfile: BusinessProfile | null;
  isLoading: boolean;
  login: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  updateBusinessProfile: (profile: Omit<BusinessProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
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
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            createdAt: session.user.created_at || new Date().toISOString()
          };
          setUser(userData);

          // Load business profile from database
          const { data: profile } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (profile) {
            setBusinessProfile({
              id: profile.id,
              userId: profile.user_id,
              businessName: profile.business_name,
              ownerName: profile.owner_name,
              email: profile.email,
              phone: profile.phone,
              address: profile.address,
              city: profile.city,
              gstNumber: profile.gst_number,
              createdAt: profile.created_at,
              updatedAt: profile.updated_at
            });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      let session;

      if (name) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });
        if (error) throw error;
        session = data.session;
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        session = data.session;
      }

      if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || email.split('@')[0],
          createdAt: session.user.created_at || new Date().toISOString()
        };
        setUser(userData);

        // Load existing business profile
        const { data: profile } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profile) {
          setBusinessProfile({
            id: profile.id,
            userId: profile.user_id,
            businessName: profile.business_name,
            ownerName: profile.owner_name,
            email: profile.email,
            phone: profile.phone,
            address: profile.address,
            city: profile.city,
            gstNumber: profile.gst_number,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at
          });
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setBusinessProfile(null);
  };

  const updateBusinessProfile = async (profileData: Omit<BusinessProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .upsert({
          user_id: user.id,
          business_name: profileData.businessName,
          owner_name: profileData.ownerName,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          gst_number: profileData.gstNumber,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const profile: BusinessProfile = {
          id: data.id,
          userId: data.user_id,
          businessName: data.business_name,
          ownerName: data.owner_name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          gstNumber: data.gst_number,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        setBusinessProfile(profile);
      }
    } catch (error) {
      console.error('Update business profile error:', error);
      throw error;
    }
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