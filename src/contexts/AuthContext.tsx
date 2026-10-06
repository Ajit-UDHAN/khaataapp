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
          setUser(userData);

          const { data: profile } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (profile) {
            setBusinessProfile(mapProfile(profile));
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
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
          setUser(userData);

          const { data: profile } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (profile) {
            setBusinessProfile(mapProfile(profile));
          } else {
            setBusinessProfile(null);
          }
        } else {
          setUser(null);
          setBusinessProfile(null);
        }
        setIsLoading(false);
      })();
    });

    return () => {
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

        if (data.session?.user) {
          const userData: User = {
            id: data.session.user.id,
            email: data.session.user.email || '',
            name: (data.session.user.user_metadata as any)?.name || email.split('@')[0],
            createdAt: data.session.user.created_at || new Date().toISOString()
          };
          setUser(userData);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;

        if (data.session?.user) {
          const userData: User = {
            id: data.session.user.id,
            email: data.session.user.email || '',
            name: (data.session.user.user_metadata as any)?.name || email.split('@')[0],
            createdAt: data.session.user.created_at || new Date().toISOString()
          };
          setUser(userData);

          const { data: profile } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('user_id', data.session.user.id)
            .maybeSingle();

          if (profile) {
            setBusinessProfile(mapProfile(profile));
          }
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
        logout,
        updateBusinessProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
