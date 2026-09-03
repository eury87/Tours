import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  Compass, 
  Crown, 
  Briefcase, 
  ArrowRight,
  Sparkles,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { User } from '../types';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, switchUser, currentUser } = useAuth();
  const { t } = useLanguage();
  const [usersList, setUsersList] = useState<User[]>([]);

  useEffect(() => {
    fetch('/api/auth/users')
      .then(res => res.json())
      .then(data => setUsersList(data.data || []))
      .catch(console.error);
  }, []);

  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#E8E1D1]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xl text-white">
                Control de Acceso & Roles SaaS
              </h3>
              <p className="text-xs text-slate-400">
                Selecciona un perfil para probar la plataforma con diferentes niveles de autorización.
              </p>
            </div>
          </div>

          <button
            onClick={closeLoginModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles List */}
        <div className="space-y-3">
          {usersList.map((user) => {
            const isCurrent = currentUser.id === user.id;

            return (
              <div
                key={user.id}
                onClick={() => switchUser(user)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isCurrent
                    ? 'bg-[#E8E1D1]/10 border-[#E8E1D1] ring-2 ring-[#E8E1D1]/30 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-11 h-11 rounded-xl object-cover border border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-sm text-white">{user.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-[#E8E1D1] text-[#152230] px-2 py-0.5 rounded-full">
                          ACTIVO
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-[11px]">{user.email}</span>
                      <span>•</span>
                      <span className="text-[#E8E1D1] font-semibold text-[11px] capitalize">
                        {user.role === 'superadmin' && '🌐 SuperAdmin SaaS'}
                        {user.role === 'company_admin' && '👑 Dueño de Empresa'}
                        {user.role === 'operator' && '🧭 Guía / Operario'}
                        {user.role === 'customer' && '👤 Cliente'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-[#E8E1D1]">
                  <span>{isCurrent ? 'Sesión Actual' : 'Cambiar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-center text-xs text-slate-500">
          En producción, este modal se sustituye por login seguro con contraseña y autenticación JWT / OAuth.
        </div>

      </div>
    </div>
  );
};
