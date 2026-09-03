import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Company } from '../types';

interface AuthContextValue {
  currentUser: User;
  activeRole: UserRole;
  companies: Company[];
  activeCompany: Company | null;
  switchRole: (role: UserRole) => void;
  switchUser: (user: User) => void;
  switchCompany: (companyId: string) => void;
  logout: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const GUEST_USER: User = {
  id: 'usr-guest',
  name: 'Visitante',
  email: '',
  role: 'customer',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('terra_auth_user');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return GUEST_USER;
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/companies')
      .then(res => res.json())
      .then(data => setCompanies(data.data || []))
      .catch(console.error);

    // Escuchar retorno de Google OAuth desde Supabase (#access_token=...)
    if (window.location.hash && window.location.hash.includes('access_token')) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        fetch('https://nhaaxhwbfcgtgnursyya.supabase.co/auth/v1/user', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
          .then(res => res.json())
          .then(supabaseUser => {
            if (supabaseUser && supabaseUser.email) {
              fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: supabaseUser.email,
                  name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email.split('@')[0],
                  picture: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
                  sub: supabaseUser.id
                })
              })
                .then(r => r.json())
                .then(d => {
                  if (d.data?.user) {
                    setCurrentUser(d.data.user);
                    localStorage.setItem('terra_auth_user', JSON.stringify(d.data.user));
                    window.history.replaceState(null, '', window.location.pathname);
                  }
                });
            }
          })
          .catch(console.error);
      }
    }
  }, []);

  const switchRole = async (role: UserRole) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.data?.user) {
        setCurrentUser(data.data.user);
        localStorage.setItem('terra_auth_user', JSON.stringify(data.data.user));
      }
    } catch (err) {
      console.error('Error switching role:', err);
    }
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('terra_auth_user', JSON.stringify(user));
    setIsLoginModalOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('terra_auth_user');
    setCurrentUser(GUEST_USER);
  };

  const switchCompany = (companyId: string) => {
    const comp = companies.find(c => c.id === companyId);
    if (comp) {
      setCurrentUser(prev => ({ ...prev, companyId: comp.id }));
    }
  };

  const activeCompany = companies.find(c => c.id === currentUser.companyId) || companies[0] || null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole: currentUser.role,
        companies,
        activeCompany,
        switchRole,
        switchUser,
        switchCompany,
        logout,
        isLoginModalOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
