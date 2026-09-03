import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Mail, 
  User, 
  Key, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { User as UserType } from '../types';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, switchUser, currentUser } = useAuth();
  const { t } = useLanguage();
  
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Manual Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register Agent Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<'agent' | 'company_admin'>('agent');
  const [regInviteCode, setRegInviteCode] = useState('');

  useEffect(() => {
    fetch('/api/auth/users')
      .then(res => res.json())
      .then(data => setUsersList(data.data || []))
      .catch(console.error);
  }, []);

  if (!isLoginModalOpen) return null;

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success && data.data?.user) {
        switchUser(data.data.user);
        closeLoginModal();
      } else {
        setErrorMessage(data.error || 'Credenciales inválidas');
      }
    } catch (err: any) {
      setErrorMessage(`Error de conexión: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const defaultOwner = usersList.find(u => u.role === 'company_admin');
      const googleProfile = {
        email: defaultOwner?.email || 'owner@terraaventura.com',
        name: defaultOwner?.name || 'Administrador Google',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        sub: 'google-oauth2-default'
      };

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleProfile),
      });
      const data = await res.json();

      if (data.success && data.data?.user) {
        switchUser(data.data.user);
        closeLoginModal();
      } else {
        setErrorMessage(data.error || 'No se pudo autenticar con Google');
      }
    } catch (err: any) {
      setErrorMessage(`Error con Google: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          role: regRole,
          inviteCode: regInviteCode,
        }),
      });
      const data = await res.json();

      if (data.success && data.data?.user) {
        setSuccessMessage(`¡Cuenta creada con éxito para ${regName}!`);
        switchUser(data.data.user);
        setTimeout(() => {
          closeLoginModal();
        }, 1200);
      } else {
        setErrorMessage(data.error || 'No se pudo crear la cuenta de agente');
      }
    } catch (err: any) {
      setErrorMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#181A17] border border-white/10 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8E1D1]/10 border border-[#E8E1D1]/20 flex items-center justify-center text-[#E8E1D1]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">
                Portal de Acceso para Agentes
              </h3>
              <p className="text-[11px] text-slate-400">
                Acceso exclusivo para administradores, dueños y agentes autorizados.
              </p>
            </div>
          </div>

          <button
            onClick={closeLoginModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (2 Columnas) */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/40 border border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMessage(''); }}
            className={`py-2.5 rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-[#E8E1D1] text-[#141513] shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMessage(''); }}
            className={`py-2.5 rounded-xl transition-all ${
              tab === 'register'
                ? 'bg-[#E8E1D1] text-[#141513] shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Crear Agente
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: LOGIN (GOOGLE + MANUAL) */}
        {(tab === 'manual' || tab === 'google') && (
          <div className="space-y-4">
            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 shadow-md transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continuar con Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 w-full"></div>
              <span className="bg-[#181A17] px-3 text-[11px] text-slate-500 uppercase font-semibold">o con correo</span>
            </div>

            {/* Manual Form */}
            <form onSubmit={handleManualLogin} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="agente@terraaventura.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-[#E8E1D1] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-[#E8E1D1] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-[#E8E1D1] hover:bg-[#d8d1c1] text-[#141513] font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Ingresando...' : 'Iniciar Sesión'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: REGISTER AGENT (RESTRICTED) */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterAgent} className="space-y-3">
            <div className="p-3 rounded-2xl bg-[#E8E1D1]/5 border border-[#E8E1D1]/15 text-xs text-slate-300">
              🛡️ <strong>Registro exclusivo para colaboradores:</strong> Requiere el código de autorización asignado por la gerencia de la agencia.
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Nombre Completo *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ej: Sofía Ramírez"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-[#E8E1D1] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Correo Corporativo *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="sofia@terraaventura.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-[#E8E1D1] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Rol</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-[#E8E1D1] focus:outline-none"
                >
                  <option value="agent">Agente de Ventas</option>
                  <option value="company_admin">Co-Administrador</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Código de Agencia *</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="AGENTE2026"
                    value={regInviteCode}
                    onChange={(e) => setRegInviteCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-[#E8E1D1] focus:outline-none uppercase font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#E8E1D1] hover:bg-[#d8d1c1] text-[#141513] font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#141513]" />
              <span>{isLoading ? 'Registrando...' : 'Crear Cuenta de Agente'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
