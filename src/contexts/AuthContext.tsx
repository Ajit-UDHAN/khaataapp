import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, BusinessProfile } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  businessProfile: BusinessProfile | null;
  isLoading: boolean;
  login: (email: string, password: string, name?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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

const mapProfile = (p: any): BusinessProfile => ({
  id: p.id,
  userId: p.user_id,
  shopName: p.shop_name,
  gstNumber: p.gst_number || '',
  businessAddress: p.business_address,
  contactNumber: p.contact_number,
  shopLogo: p.shop_logo || '',
  createdAt: p.created_at,
  updatedAt: p.updated_at
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: (session.user.user_metadata as any)?.name || session.user.email?.split('@')[0] || 'User',
            createdAt: session.user.created_at || new Date().toISOString()
          };
          if (mounted) setUser(userData);

          const { data: profile } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (mounted) {
            if (profile) {
              setBusinessProfile(mapProfile(profile));
            }
            setIsLoading(false);
          }
        } else {
          if (mounted) setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: (session.user.user_metadata as any)?.name || session.user.email?.split('@')[0] || 'User',
            createdAt: session.user.created_at || new Date().toISOString()
          };
          if (mounted) {
            setUser(userData);
            setIsLoading(true);
          }

          const { data: profile } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (mounted) {
            if (profile) {
              setBusinessProfile(mapProfile(profile));
            } else {
              setBusinessProfile(null);
            }
            setIsLoading(false);
          }
        } else {
          if (mounted) {
            setUser(null);
            setBusinessProfile(null);
            setIsLoading(false);
          }
        }
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      if (name) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });
        if (error) throw error;

        // If no session returned, the email likely already exists.
        // Fall back to sign-in with the provided credentials.
        if (!data.session?.user) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (signInError) {
            throw new Error('This email is already registered but the password doesn\'t match. If you forgot your password, use the "Forgot Password" link.');
          }
        }
        // onAuthStateChange will set the user and load the business profile
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        // onAuthStateChange will set the user and load the business profile
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
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
          shop_name: profileData.shopName,
          gst_number: profileData.gstNumber,
          business_address: profileData.businessAddress,
          contact_number: profileData.contactNumber,
          shop_logo: profileData.shopLogo,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBusinessProfile(mapProfile(data));
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
        resetPassword,
        logout,
        updateBusinessProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
