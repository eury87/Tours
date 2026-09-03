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
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const DEFAULT_USER: User = {
  id: 'usr-owner',
  name: 'Lucía Benítez (Dueño Agencia)',
  email: 'owner@terraaventura.com',
  role: 'company_admin',
  companyId: 'comp-1',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/companies')
      .then(res => res.json())
      .then(data => setCompanies(data.data || []))
      .catch(console.error);
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
      }
    } catch (err) {
      console.error('Error switching role:', err);
    }
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);
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
