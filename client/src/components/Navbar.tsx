import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Mountain,
  ArrowRight,
  LayoutDashboard, 
  ClipboardList, 
  QrCode, 
  Settings as SettingsIcon, 
  Bell, 
  Sparkles, 
  Mail, 
  MessageSquare, 
  Layers, 
  X,
  ChevronDown,
  ShieldCheck,
  Menu
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

export type AppView = 'catalog' | 'admin' | 'manifest' | 'scanner' | 'settings' | 'saas';

interface NavbarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onOpenNotificationsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange, onOpenNotificationsModal }) => {
  const { notifications, unreadCount, markNotificationsAsRead } = useSocket();
  const { currentUser, activeRole, openLoginModal, logout, activeCompany } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleBell = () => {
    if (!showBellDropdown) {
      markNotificationsAsRead();
    }
    setShowBellDropdown(!showBellDropdown);
  };

  return (
    <header className={`w-full z-50 transition-all duration-300 py-2 ${
      currentView === 'catalog'
        ? 'absolute top-0 left-0 right-0 bg-transparent border-none'
        : 'relative bg-transparent border-none'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-6">
        
        {/* Left: Brand / Tenant Logo completamente limpio sin caja oscura */}
        <div 
          onClick={() => onViewChange('catalog')}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0 group min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 border border-white/20 p-1 flex items-center justify-center text-[#E8E1D1] group-hover:border-[#E8E1D1] shadow transition-all duration-300 group-hover:scale-105 shrink-0">
            <Mountain className="w-4 h-4 sm:w-5 sm:h-5 text-[#E8E1D1]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-sm sm:text-base md:text-lg tracking-[0.12em] sm:tracking-[0.18em] text-white uppercase drop-shadow truncate">
                {activeCompany?.name ? activeCompany.name.split(' ')[0].toUpperCase() : 'TERRAAVENTURA'}
              </span>
              <span className="text-[7px] sm:text-[8px] uppercase font-extrabold tracking-widest bg-[#E8E1D1]/15 text-[#E8E1D1] border border-[#E8E1D1]/30 px-1 py-0.5 rounded-full shrink-0">
                LUXE
              </span>
            </div>
            <p className="hidden md:block text-[8px] uppercase tracking-[0.25em] text-stone-300 font-bold leading-none mt-0.5 drop-shadow-sm">
              EXPLORE. DREAM. DISCOVER.
            </p>
          </div>
        </div>

        {/* Center: View Navigation (Responsive Tabs para pantallas grandes) */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-white/5 backdrop-blur-md p-1.5 rounded-full border border-white/15 shadow-lg">
          
          <button
            onClick={() => onViewChange('catalog')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
              currentView === 'catalog'
                ? 'bg-[#E8E1D1] text-[#152230] shadow-md shadow-black/40 font-black'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{t('navTours')}</span>
          </button>

          {(activeRole === 'superadmin' || activeRole === 'company_admin' || activeRole === 'agent') && (
            <button
              onClick={() => onViewChange('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                currentView === 'admin'
                  ? 'bg-[#E8E1D1] text-[#152230] shadow-md shadow-black/40 font-black'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{t('navOwner')}</span>
            </button>
          )}

          {(activeRole === 'superadmin' || activeRole === 'company_admin' || activeRole === 'agent' || activeRole === 'operator') && (
            <button
              onClick={() => onViewChange('manifest')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                currentView === 'manifest'
                  ? 'bg-[#E8E1D1] text-[#152230] shadow-md shadow-black/40 font-black'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>{t('navGuide')}</span>
            </button>
          )}

          {(activeRole === 'superadmin' || activeRole === 'company_admin' || activeRole === 'agent' || activeRole === 'operator') && (
            <button
              onClick={() => onViewChange('scanner')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                currentView === 'scanner'
                  ? 'bg-[#E8E1D1] text-[#152230] shadow-md shadow-black/40 font-black'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{t('navScanner')}</span>
            </button>
          )}

          {activeRole === 'superadmin' && (
            <button
              onClick={() => onViewChange('saas')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                currentView === 'saas'
                  ? 'bg-[#E8E1D1] text-[#152230] shadow-md shadow-black/40 font-black'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t('navSaas')}</span>
            </button>
          )}

          {(activeRole === 'superadmin' || activeRole === 'company_admin' || activeRole === 'agent') && (
            <button
              onClick={() => onViewChange('settings')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                currentView === 'settings'
                  ? 'bg-[#E8E1D1] text-[#152230] shadow-md shadow-black/40 font-black'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>{t('navSettings')}</span>
            </button>
          )}
        </nav>

        {/* Right Actions: Language Switcher, User Role Switcher, Bell */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Language Switcher Pill */}
          <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-0.5 shadow-sm">
            <button
              onClick={() => setLanguage('es')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                language === 'es' ? 'bg-[#E8E1D1] text-[#152230] shadow' : 'text-stone-300 hover:text-white'
              }`}
              title="Cambiar a Español"
            >
              ES
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                language === 'en' ? 'bg-[#E8E1D1] text-[#152230] shadow' : 'text-stone-300 hover:text-white'
              }`}
              title="Switch to English"
            >
              EN
            </button>
          </div>

          {/* Botón Estratégico de Acceso para Agentes / Perfil Activo */}
          <div className="relative">
            <button
              onClick={() => {
                if (currentUser.role === 'customer') {
                  openLoginModal();
                } else {
                  setShowUserDropdown(!showUserDropdown);
                }
              }}
              className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-left transition-all shadow-sm group"
              title={currentUser.role === 'customer' ? 'Acceso exclusivo para Agentes y Dueños de Agencia' : 'Menú de Perfil'}
            >
              {currentUser.role === 'customer' ? (
                <>
                  <div className="w-6 h-6 rounded-lg bg-[#E8E1D1]/20 border border-[#E8E1D1]/30 flex items-center justify-center text-[#E8E1D1] group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-xs font-bold text-white tracking-wide">Portal Agentes</span>
                  </div>
                </>
              ) : (
                <>
                  <img
                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt=""
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/30"
                  />
                  <div className="hidden sm:block">
                    <div className="text-[11px] font-bold text-white leading-none truncate max-w-[90px] md:max-w-[120px]">
                      {currentUser?.name ? currentUser.name.split(' ')[0] : 'Agente'}
                    </div>
                    <div className="text-[9px] text-[#E8E1D1] font-bold uppercase leading-tight mt-0.5">
                      {currentUser?.role === 'superadmin' ? 'SuperAdmin' : currentUser?.role === 'company_admin' ? 'Dueño' : currentUser?.role === 'operator' ? 'Guía' : 'Agente'}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-stone-300 hidden sm:block" />
                </>
              )}
            </button>

            {/* Dropdown de Usuario Autenticado */}
            {showUserDropdown && currentUser?.role !== 'customer' && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#171916]/95 border border-white/15 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <img
                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover border border-white/20"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-white truncate">{currentUser?.name || 'Agente'}</div>
                    <div className="text-[10px] text-slate-400 truncate">{currentUser?.email || ''}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#E8E1D1]/10 text-[#E8E1D1] border border-[#E8E1D1]/20">
                      {currentUser?.role || 'agente'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  {(currentUser.role === 'company_admin' || currentUser.role === 'superadmin' || currentUser.role === 'agent') && (
                    <button
                      onClick={() => { onViewChange('admin'); setShowUserDropdown(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-stone-200 hover:text-white hover:bg-white/10 font-semibold transition-colors flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-[#E8E1D1]" />
                      <span>Panel de Administración</span>
                    </button>
                  )}

                  <button
                    onClick={() => { logout(); setShowUserDropdown(false); onViewChange('catalog'); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-300 hover:text-rose-100 hover:bg-rose-500/10 font-semibold transition-colors flex items-center gap-2"
                  >
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={handleToggleBell}
              className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white border border-white/20 backdrop-blur-md transition-colors shadow-sm"
              title="Notificaciones de reservas"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-md">
                  {unreadCount > 9 ? '+9' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showBellDropdown && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl glass-panel bg-[#171916]/95 border border-white/15 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#E8E1D1]" />
                    <h4 className="font-heading font-bold text-sm text-white">{t('notificationsTitle')}</h4>
                  </div>
                  <button onClick={() => setShowBellDropdown(false)} className="text-slate-400 hover:text-white p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No hay notificaciones recientes aún.
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <div key={n.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                            {n.channel === 'email' && <Mail className="w-3.5 h-3.5 text-[#E8E1D1]" />}
                            {n.channel === 'whatsapp' && <MessageSquare className="w-3.5 h-3.5 text-[#E8E1D1]" />}
                            {n.channel === 'in_app' && <Bell className="w-3.5 h-3.5 text-amber-400" />}
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-400 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setShowBellDropdown(false);
                      onOpenNotificationsModal();
                    }}
                    className="text-xs text-[#E8E1D1] hover:underline font-semibold py-1 px-3"
                  >
                    {t('viewAllNotifs')} &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile navigation bottom bar (Fija y flotante tipo App nativa) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#141513]/95 border-t border-white/10 py-2 px-3 backdrop-blur-2xl shadow-2xl flex items-center justify-around">
        <button
          onClick={() => onViewChange('catalog')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-all ${
            currentView === 'catalog' ? 'text-[#E8E1D1]' : 'text-stone-400 hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Tours</span>
        </button>

        {(activeRole === 'superadmin' || activeRole === 'company_admin' || activeRole === 'agent') && (
          <button
            onClick={() => onViewChange('admin')}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-all ${
              currentView === 'admin' ? 'text-[#E8E1D1]' : 'text-stone-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dueño</span>
          </button>
        )}

        {(activeRole === 'superadmin' || activeRole === 'company_admin' || activeRole === 'agent' || activeRole === 'operator') && (
          <button
            onClick={() => onViewChange('manifest')}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-all ${
              currentView === 'manifest' ? 'text-[#E8E1D1]' : 'text-stone-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Guía</span>
          </button>
        )}

        {(activeRole === 'superadmin' || activeRole === 'company_admin' || activeRole === 'agent' || activeRole === 'operator') && (
          <button
            onClick={() => onViewChange('scanner')}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-all ${
              currentView === 'scanner' ? 'text-[#E8E1D1]' : 'text-stone-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR</span>
          </button>
        )}

        {(activeRole === 'superadmin' || activeRole === 'company_admin' || activeRole === 'agent') && (
          <button
            onClick={() => onViewChange('settings')}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-all ${
              currentView === 'settings' ? 'text-[#E8E1D1]' : 'text-stone-400 hover:text-white'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Ajustes</span>
          </button>
        )}
      </div>
    </header>
  );
};
