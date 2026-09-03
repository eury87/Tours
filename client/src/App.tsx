import React, { useState, useEffect } from 'react';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { Navbar, AppView } from './components/Navbar';
import { LiveToast } from './components/LiveToast';
import { LoginModal } from './components/LoginModal';
import { NotificationModal } from './components/NotificationModal';
import { TourDetailModal } from './components/TourDetailModal';
import { BookingModal } from './components/BookingModal/BookingModal';
import { TourCatalog } from './pages/TourCatalog';
import { AdminDashboard } from './pages/AdminDashboard';
import { OperatorManifest } from './pages/OperatorManifest';
import { QrScannerModal } from './pages/QrScannerModal';
import { SettingsPage } from './pages/SettingsPage';
import { SaasSuperAdmin } from './pages/SaasSuperAdmin';
import { PalettePreviewModal } from './components/PalettePreviewModal';
import { Tour, Booking } from './types';
import { Compass, ShieldCheck, Mail, MessageSquare, Palette } from 'lucide-react';

export function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>('catalog');
  const [selectedTourForDetails, setSelectedTourForDetails] = useState<Tour | null>(null);
  const [selectedTourForBooking, setSelectedTourForBooking] = useState<Tour | null>(null);
  const [existingBookingForCheckout, setExistingBookingForCheckout] = useState<Booking | null>(null);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isPaletteModalOpen, setIsPaletteModalOpen] = useState(false);
  const { activeRole, currentUser } = useAuth();
  const { t } = useLanguage();

  // Redirigir al panel de administración cuando se inicia sesión como agente o administrador
  useEffect(() => {
    if (currentUser && (currentUser.role === 'company_admin' || currentUser.role === 'agent' || currentUser.role === 'superadmin')) {
      setCurrentView('admin');
    }
  }, [currentUser?.id, currentUser?.role]);

  // Escuchar enlaces de pago por WhatsApp/Email (?bookingId=bkg-xxx&step=checkout)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('bookingId');
    const step = params.get('step');

    if (bookingId && step === 'checkout') {
      fetch(`/api/bookings/${bookingId}`)
        .then(res => res.json())
        .then(bData => {
          if (bData.success && bData.data) {
            const booking: Booking = bData.data;
            setExistingBookingForCheckout(booking);
            fetch(`/api/tours/${booking.tourId}`)
              .then(res => res.json())
              .then(tData => {
                if (tData.success && tData.data) {
                  setSelectedTourForBooking(tData.data);
                }
              });
          }
        })
        .catch(err => console.error('Error cargando reserva de pago:', err));
    }
  }, []);

  return (
    <div className={`min-h-screen text-slate-100 flex flex-col selection:bg-[#E8E1D1] selection:text-[#152230] relative ${
      currentView === 'catalog'
        ? 'bg-[#141513] luxury-bg-mesh'
        : 'bg-gradient-to-b from-[#2E2B23] via-[#1B1D19] to-[#141513]'
    }`}>
      
      {/* Halo de Luz Ambiental Magnolia en Páginas Secundarias */}
      {currentView !== 'catalog' && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[130%] sm:w-[1000px] h-[520px] bg-gradient-to-b from-[#E8E1D1]/25 via-[#E8E1D1]/08 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-0 inset-x-0 h-72 bg-gradient-to-b from-[#E8E1D1]/12 to-transparent" />
        </div>
      )}
      
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenNotificationsModal={() => setIsNotificationsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className={`flex-1 w-full relative z-10 ${currentView === 'catalog' ? 'pb-16' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16'}`}>
        {currentView === 'catalog' && (
          <TourCatalog
            onBookTour={(tour) => setSelectedTourForBooking(tour)}
            onViewTourDetails={(tour) => setSelectedTourForDetails(tour)}
          />
        )}

        {currentView === 'admin' && <AdminDashboard />}
        {currentView === 'manifest' && <OperatorManifest />}
        {currentView === 'scanner' && <QrScannerModal />}
        {currentView === 'settings' && <SettingsPage />}
        {currentView === 'saas' && <SaasSuperAdmin />}
      </main>

      {/* Floating Realtime Alerts */}
      <LiveToast
        onViewBooking={(bookingId) => {
          setCurrentView('admin');
        }}
      />

      {/* Modals */}
      <LoginModal />

      <TourDetailModal
        tour={selectedTourForDetails}
        onClose={() => setSelectedTourForDetails(null)}
        onBookNow={(tour) => setSelectedTourForBooking(tour)}
      />

      <BookingModal
        tour={selectedTourForBooking}
        isOpen={!!selectedTourForBooking}
        initialBooking={existingBookingForCheckout}
        initialStep={existingBookingForCheckout ? 4 : 1}
        onClose={() => {
          setSelectedTourForBooking(null);
          setExistingBookingForCheckout(null);
          if (window.location.search) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }}
        onBookingCompleted={(booking: Booking) => {
          // Keep modal open on step 5 for voucher printing & sharing
        }}
      />

      <NotificationModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />


      {/* Modern Footer */}
      {/* Footer de Alta Gama con Sellos de Seguridad y Confianza */}
      <footer className="border-t border-white/10 bg-[#141513] py-16 text-slate-400 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Trust Highlights Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl glass-panel border border-white/10 bg-[#171916]/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#E8E1D1] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-white text-xs">Cifrado Bancario 256-bit</h5>
                <p className="text-[11px] text-slate-400">Pagos 100% seguros y auditados</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#E8E1D1] shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-white text-xs">Guías Locales Certificados</h5>
                <p className="text-[11px] text-slate-400">Personal oficial capacitado</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#E8E1D1] shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-white text-xs">Atención WhatsApp 24/7</h5>
                <p className="text-[11px] text-slate-400">Coordinación en tiempo real</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#E8E1D1] shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-white text-xs">Vouchers con Código QR</h5>
                <p className="text-[11px] text-slate-400">Acceso digital sin imprimir</p>
              </div>
            </div>
          </div>

          {/* Main Footer Columns */}
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 font-heading font-black text-white text-lg">
                <div className="w-8 h-8 rounded-lg bg-[#E8E1D1] flex items-center justify-center text-[#152230] font-black">
                  <Compass className="w-5 h-5" />
                </div>
                <span>TerraAventura Tours</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-xs">
                Plataforma SaaS de experiencias turísticas y excursiones de lujo: reservas inteligentes, coordinación directa con operarios y facturación electrónica.
              </p>
            </div>

            <div>
              <h4 className="font-heading font-bold text-white uppercase tracking-wider text-[11px] mb-3">
                Módulos de la Plataforma
              </h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => setCurrentView('catalog')} className="hover:text-[#E8E1D1] transition-colors">
                    Explorar Tours & Experiencias
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentView('admin')} className="hover:text-[#E8E1D1] transition-colors">
                    Panel de Administración & Reservas
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentView('manifest')} className="hover:text-[#E8E1D1] transition-colors">
                    Hoja de Ruta del Operario
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentView('scanner')} className="hover:text-[#E8E1D1] transition-colors">
                    Validador QR de Abordaje
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-bold text-white uppercase tracking-wider text-[11px] mb-3">
                Canales Transaccionales
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-[#E8E1D1] animate-pulse" />
                  <span>Resend SMTP • Dominio Verificado</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-[#E8E1D1] animate-pulse" />
                  <span>WhatsApp Web Socket • En Vivo</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-[#E8E1D1] animate-pulse" />
                  <span>WebSockets en Tiempo Real</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-heading font-bold text-white uppercase tracking-wider text-[11px] mb-3">
                Contacto Oficial
              </h4>
              <p className="text-slate-300 font-semibold">Mesa de Ayuda & Reservas</p>
              <p className="text-slate-400 mt-1 font-mono text-[11px]">reservas@test.rodeotest.shop</p>
              <p className="text-slate-400 text-[11px]">+507 6527-4580 / +507 6754-6550</p>
              <div className="pt-3 flex items-center gap-2">
                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300">VISA</span>
                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300">MASTERCARD</span>
                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300">AMEX</span>
                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300">APPLE PAY</span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} TerraAventura Platform. Todos los derechos reservados.</p>
            <p className="text-slate-400">Desarrollado para Agencias de Turismo & Operadores Oficiales</p>
          </div>

        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
