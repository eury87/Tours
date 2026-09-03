import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Mail, 
  MessageSquare, 
  RotateCw, 
  Filter, 
  Search, 
  ChevronDown, 
  Tag,
  Plus,
  Trash2,
  Percent,
  Sparkles,
  Receipt,
  Compass,
  Edit3,
  ExternalLink,
  MapPin,
  Phone
} from 'lucide-react';
import { Tour, Booking, Operator, BookingStatus, PaymentStatus, Coupon } from '../types';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../i18n/LanguageContext';
import { InvoiceModal } from '../components/InvoiceModal';
import { TourFormModal } from '../components/TourFormModal';
import { OperatorFormModal } from '../components/OperatorFormModal';

export const AdminDashboard: React.FC = () => {
  const { liveBookings, refreshBookings } = useSocket();
  const { t } = useLanguage();
  const [tours, setTours] = useState<Tour[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'tours' | 'operators' | 'coupons'>('bookings');
  
  // Modales de Tours y Operadores
  const [showTourModal, setShowTourModal] = useState(false);
  const [tourToEdit, setTourToEdit] = useState<Tour | null>(null);
  const [showOperatorModal, setShowOperatorModal] = useState(false);
  const [operatorToEdit, setOperatorToEdit] = useState<Operator | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookingForOp, setSelectedBookingForOp] = useState<Booking | null>(null);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<Booking | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // New Coupon Form state
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponVal, setNewCouponVal] = useState(15);
  const [newCouponMin, setNewCouponMin] = useState(50);

  const fetchTours = () => {
    fetch('/api/tours')
      .then(res => res.json())
      .then(data => setTours(data.data || []))
      .catch(console.error);
  };

  const fetchOperators = () => {
    fetch('/api/operators')
      .then(res => res.json())
      .then(data => setOperators(data.data || []))
      .catch(console.error);
  };

  const fetchCoupons = () => {
    fetch('/api/coupons')
      .then(res => res.json())
      .then(data => setCoupons(data.data || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchOperators();
    fetchCoupons();
    fetchTours();
  }, []);

  const handleDeleteTour = async (tourId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este tour del catálogo?')) return;
    try {
      const res = await fetch(`/api/tours/${tourId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTours(prev => prev.filter(t => t.id !== tourId));
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteOperator = async (opId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este operario?')) return;
    try {
      const res = await fetch(`/api/operators/${opId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setOperators(prev => prev.filter(o => o.id !== opId));
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const filteredBookings = liveBookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.code.toLowerCase().includes(q) ||
        b.leadCustomer.fullName.toLowerCase().includes(q) ||
        b.tourTitle.toLowerCase().includes(q) ||
        b.leadCustomer.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalRevenue = liveBookings.reduce((acc, b) => acc + (b.paymentStatus === 'completed' ? b.totalAmount : 0), 0);
  const totalPassengers = liveBookings.reduce((acc, b) => acc + b.totalPassengers, 0);
  const boardedCount = liveBookings.filter(b => b.status === 'boarded').length;

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus, newPayment?: PaymentStatus) => {
    try {
      setIsUpdating(true);
      await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, paymentStatus: newPayment }),
      });
      await refreshBookings();
    } catch (err) {
      console.error('Error changing status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignOperator = async (bookingId: string, operatorId: string) => {
    try {
      setIsUpdating(true);
      await fetch(`/api/bookings/${bookingId}/assign-operator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorId }),
      });
      setSelectedBookingForOp(null);
      await refreshBookings();
    } catch (err) {
      console.error('Error assigning operator:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCouponCode.trim().toUpperCase(),
          description: newCouponDesc || 'Descuento especial',
          discountType: newCouponType,
          discountValue: Number(newCouponVal),
          minSpend: Number(newCouponMin) || 0,
        }),
      });
      if (res.ok) {
        setShowCreateCouponModal(false);
        setNewCouponCode('');
        setNewCouponDesc('');
        fetchCoupons();
      }
    } catch (err) {
      console.error('Error creating coupon:', err);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('¿Seguro de eliminar este cupón?')) return;
    try {
      await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      fetchCoupons();
    } catch (err) {
      console.error('Error deleting coupon:', err);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
            {t('adminTitle')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('adminSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTourToEdit(null);
              setShowTourModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E8E1D1] hover:bg-[#ded6c4] text-[#141513] text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Nuevo Tour</span>
          </button>

          <button
            onClick={() => refreshBookings()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1C1E1B] border border-white/10 text-stone-300 hover:text-white hover:bg-[#232521] text-xs font-semibold transition-colors shadow"
          >
            <RotateCw className="w-4 h-4" />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-3xl glass-card border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E8E1D1]">{t('totalRevenue')}</span>
            <div className="w-10 h-10 rounded-xl bg-white/5 text-[#E8E1D1] border border-white/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-white mt-3">
            ${totalRevenue.toFixed(2)} <span className="text-xs text-slate-400 font-normal">USD</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Facturado en línea</p>
        </div>

        <div className="p-6 rounded-3xl glass-card border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{t('totalBookings')}</span>
            <div className="w-10 h-10 rounded-xl bg-white/5 text-slate-300 border border-white/10 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-white mt-3">
            {liveBookings.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Salidas registradas</p>
        </div>

        <div className="p-6 rounded-3xl glass-card border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">{t('totalPax')}</span>
            <div className="w-10 h-10 rounded-xl bg-white/5 text-amber-400 border border-white/10 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-white mt-3">
            {totalPassengers}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Adultos y niños</p>
        </div>

        <div className="p-6 rounded-3xl glass-card border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E8E1D1]">{t('couponsTab')}</span>
            <div className="w-10 h-10 rounded-xl bg-white/5 text-[#E8E1D1] border border-white/10 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-white mt-3">
            {coupons.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cupones activos</p>
        </div>
      </div>

      {/* Tabs Switcher: Bookings vs Tours vs Operators vs Coupons */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'bookings'
              ? 'bg-[#E8E1D1] text-[#152230] font-black shadow-lg'
              : 'bg-[#1C1E1B] text-stone-400 hover:text-white border border-white/10'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Gestión de Reservas ({liveBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tours')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'tours'
              ? 'bg-[#E8E1D1] text-[#152230] font-black shadow-lg'
              : 'bg-[#1C1E1B] text-stone-400 hover:text-white border border-white/10'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Tours del Catálogo ({tours.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('operators')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'operators'
              ? 'bg-[#E8E1D1] text-[#152230] font-black shadow-lg'
              : 'bg-[#1C1E1B] text-stone-400 hover:text-white border border-white/10'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Operarios & Guías ({operators.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'coupons'
              ? 'bg-[#E8E1D1] text-[#152230] font-black shadow-lg'
              : 'bg-[#1C1E1B] text-stone-400 hover:text-white border border-white/10'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Cupones Promocionales ({coupons.length})</span>
        </button>
      </div>

      {/* TAB 1: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="glass-panel rounded-3xl border border-white/10 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por código, cliente, tour..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1C1E1B] border border-white/15 text-white text-xs focus:border-[#E8E1D1] focus:outline-none placeholder-stone-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <Filter className="w-4 h-4 text-stone-400 shrink-0" />
              {['all', 'confirmed', 'paid', 'boarded', 'pending'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    statusFilter === st
                      ? 'bg-[#E8E1D1] text-[#152230]'
                      : 'bg-[#1C1E1B] text-stone-400 hover:text-white border border-white/10 hover:bg-[#232521]'
                  }`}
                >
                  {st === 'all' ? 'Todos' : st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const isPaid = booking.paymentStatus === 'completed';
              const isBoarded = booking.status === 'boarded';

              return (
                <div key={booking.id} className="p-5 rounded-2xl bg-[#181A17]/90 border border-white/10 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-start gap-4">
                      <img src={booking.tourImage} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading font-black text-white text-base">{booking.tourTitle}</span>
                          <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-white/10 text-[#E8E1D1] border border-white/20">
                            {booking.code}
                          </span>
                          {booking.couponCode && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              🎟️ {booking.couponCode} (-${booking.discountAmount || 0})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                          <span>📅 {booking.date} ({booking.timeSlot})</span>
                          <span>👥 {booking.totalPassengers} Pasajeros</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total</span>
                        <div className="font-heading font-black text-[#E8E1D1] text-lg">
                          ${booking.totalAmount.toFixed(2)} USD
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        isBoarded ? 'bg-[#E8E1D1]/25 text-[#E8E1D1]' : isPaid ? 'bg-[#E8E1D1]/15 text-[#E8E1D1]' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {isBoarded ? 'ABORDADO / QR' : isPaid ? 'CONFIRMADO' : 'PENDIENTE'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Titular: </span>
                      <strong className="text-white">{booking.leadCustomer.fullName}</strong>
                      <span className="text-slate-500"> ({booking.leadCustomer.phone})</span>
                    </div>

                      <div className="flex items-center gap-2">
                        {booking.operatorConfirmed ? (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white/10 text-[#E8E1D1] border border-white/20">
                            🟢 Guía Confirmó Turno
                          </span>
                        ) : booking.assignedOperatorName ? (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            ⏳ Esperando Confir. Guía
                          </span>
                        ) : null}

                        <button
                          onClick={() => setSelectedBookingForInvoice(booking)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1E1B] hover:bg-[#252824] text-stone-200 text-xs font-semibold border border-white/10 transition-colors shadow-sm"
                          title="Ver Factura Comercial Oficial"
                        >
                          <Receipt className="w-3.5 h-3.5 text-[#E8E1D1]" />
                          <span>Factura</span>
                        </button>

                        <button
                          onClick={() => setSelectedBookingForOp(booking)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1E1B] text-stone-300 border border-white/10 font-medium hover:border-[#E8E1D1]/40 shadow-sm"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-[#E8E1D1]" />
                          <span>{booking.assignedOperatorName ? `Guía: ${booking.assignedOperatorName}` : t('assignGuide')}</span>
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        </button>

                        <a
                          href={`https://wa.me/${booking.leadCustomer.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="glass-panel rounded-3xl border border-white/10 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg text-white">Cupones y Códigos de Descuento Activos</h3>
              <p className="text-xs text-slate-400">Los clientes pueden canjear estos códigos en el paso 4 del checkout.</p>
            </div>
            <button
              onClick={() => setShowCreateCouponModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] font-black text-xs shadow-lg shadow-black/40 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>{t('createCouponBtn')}</span>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="p-5 rounded-2xl bg-[#181A17]/90 border border-white/10 space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-black text-[#E8E1D1] tracking-wider bg-white/10 px-3 py-1 rounded-xl border border-white/20">
                    {coupon.code}
                  </span>
                  <button
                    onClick={() => handleDeleteCoupon(coupon.id)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                    title="Eliminar cupón"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 font-medium">{coupon.description}</p>

                <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>
                    <span className="block text-[10px] uppercase">Descuento</span>
                    <strong className="text-white text-sm">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `$${coupon.discountValue} USD`}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase">Compra Mínima</span>
                    <strong className="text-white text-sm">${coupon.minSpend} USD</strong>
                  </div>
                </div>

                <div className="text-[10px] text-[#E8E1D1]/80 font-mono">
                  Usado {coupon.usedCount} veces en reservas
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TOURS DEL CATÁLOGO */}
      {activeTab === 'tours' && (
        <div className="glass-panel rounded-3xl border border-white/10 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-black text-xl text-white">Tours del Catálogo & Asignación</h3>
              <p className="text-xs text-slate-400 mt-1">
                Personaliza precios, cupos, fotos y activa qué operarios están disponibles para cada tour.
              </p>
            </div>

            <button
              onClick={() => { setTourToEdit(null); setShowTourModal(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] text-xs font-black shadow-lg transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Tour</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour) => {
              const assignedOps = operators.filter(o => tour.availableOperatorIds?.includes(o.id));

              return (
                <div key={tour.id} className="rounded-3xl bg-[#181A17]/90 border border-white/10 overflow-hidden flex flex-col hover:border-white/20 transition-all shadow-xl">
                  {/* Tour Image Header */}
                  <div className="relative h-44 w-full">
                    <img
                      src={tour.images?.[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80'}
                      alt={tour.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181A17] via-transparent to-black/40" />

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20">
                        {tour.category}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-[#E8E1D1] text-[#141513] shadow">
                        ${tour.price} USD
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-stone-200">
                      <span className="flex items-center gap-1 font-semibold truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#E8E1D1] shrink-0" />
                        <span className="truncate">{tour.destination}</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-stone-300 font-bold">⏱️ {tour.duration}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="font-heading font-black text-base text-white line-clamp-1">{tour.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{tour.tagline || tour.description}</p>
                    </div>

                    {/* Modalidad de Aprobación */}
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                        tour.requiresOperatorApproval !== false
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      }`}>
                        {tour.requiresOperatorApproval !== false ? '⏳ Requiere Aprobación de Guía' : '⚡ Pago Instantáneo'}
                      </span>
                    </div>

                    {/* Operarios Asignados */}
                    <div className="pt-3 border-t border-white/10">
                      <div className="text-[11px] font-bold text-[#E8E1D1] mb-2 flex items-center justify-between">
                        <span>Operarios Habilitados ({assignedOps.length}):</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
                        {assignedOps.length > 0 ? (
                          assignedOps.map(op => (
                            <span
                              key={op.id}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300"
                              title={`${op.name} (${op.phone})`}
                            >
                              <img src={op.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                              <span className="truncate max-w-[100px]">{op.name.split(' ')[0]}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            Todos los operarios activos por defecto
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleDeleteTour(tour.id)}
                        className="p-2 rounded-xl text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Eliminar tour"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => { setTourToEdit(tour); setShowTourModal(true); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#E8E1D1]" />
                        <span>Editar Tour & Guías</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: OPERARIOS & GUÍAS */}
      {activeTab === 'operators' && (
        <div className="glass-panel rounded-3xl border border-white/10 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-black text-xl text-white">Directorio de Operarios & Guías</h3>
              <p className="text-xs text-slate-400 mt-1">
                Registra a tu equipo, configura sus números de WhatsApp y gestiona su disponibilidad para salidas.
              </p>
            </div>

            <button
              onClick={() => { setOperatorToEdit(null); setShowOperatorModal(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] text-xs font-black shadow-lg transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Operario</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {operators.map((op) => (
              <div key={op.id} className="p-5 rounded-3xl bg-[#181A17]/90 border border-white/10 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all shadow-xl">
                
                <div className="flex items-start gap-4">
                  <img
                    src={op.avatar}
                    alt={op.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-white/15 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-heading font-bold text-base text-white truncate">{op.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        op.active
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : 'bg-slate-700 text-slate-400 border-slate-600'
                      }`}>
                        {op.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <div className="text-xs text-[#E8E1D1] font-semibold mt-0.5">{op.role}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-1">{op.email}</div>
                  </div>
                </div>

                {/* WhatsApp Direct Link */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-mono text-xs text-slate-200 truncate">{op.phone}</span>
                  </div>

                  <a
                    href={`https://wa.me/${op.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0"
                  >
                    <span>Chat</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Idiomas */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Idiomas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {op.languages?.map(lang => (
                      <span key={lang} className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-300">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDeleteOperator(op.id)}
                    className="p-2 rounded-xl text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Eliminar operario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => { setOperatorToEdit(op); setShowOperatorModal(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#E8E1D1]" />
                    <span>Editar Información</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showCreateCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10110E]/85 backdrop-blur-md">
          <form onSubmit={handleCreateCoupon} className="bg-[#171916] border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-white text-lg">Crear Nuevo Cupón de Descuento</h3>
            
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Código del Cupón (Sin espacios)</label>
              <input
                type="text"
                placeholder="Ej: VERANO2026"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                required
                className="w-full p-2.5 rounded-xl bg-[#10110E] border border-white/15 text-white font-mono text-xs focus:border-[#E8E1D1] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Descripción</label>
              <input
                type="text"
                placeholder="Ej: 15% de descuento en expediciones"
                value={newCouponDesc}
                onChange={(e) => setNewCouponDesc(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#10110E] border border-white/15 text-white text-xs focus:border-[#E8E1D1] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tipo de Descuento</label>
                <select
                  value={newCouponType}
                  onChange={(e) => setNewCouponType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#10110E] border border-white/15 text-white text-xs"
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto Fijo ($ USD)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Valor</label>
                <input
                  type="number"
                  value={newCouponVal}
                  onChange={(e) => setNewCouponVal(Number(e.target.value))}
                  required
                  className="w-full p-2.5 rounded-xl bg-[#10110E] border border-white/15 text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Monto Mínimo de Compra ($ USD)</label>
              <input
                type="number"
                value={newCouponMin}
                onChange={(e) => setNewCouponMin(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[#10110E] border border-white/15 text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowCreateCouponModal(false)}
                className="px-4 py-2 rounded-xl bg-[#222420] text-stone-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] text-xs font-bold shadow"
              >
                Guardar Cupón
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Operator Assignment Modal */}
      {selectedBookingForOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10110E]/85 backdrop-blur-md">
          <div className="bg-[#171916] border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-white text-lg">
              Asignar Guía a #{selectedBookingForOp.code}
            </h3>
            <div className="space-y-2 pt-2">
              {operators.map((op) => (
                <div
                  key={op.id}
                  onClick={() => handleAssignOperator(selectedBookingForOp.id, op.id)}
                  className="p-3.5 rounded-2xl bg-[#10110E] hover:bg-[#222420] border border-white/10 hover:border-[#E8E1D1] transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img src={op.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <div className="font-bold text-white text-xs">{op.name}</div>
                      <div className="text-[10px] text-slate-400">{op.role}</div>
                    </div>
                  </div>
                  <span className="text-xs text-[#E8E1D1] font-bold">Asignar &rarr;</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelectedBookingForOp(null)}
              className="w-full py-2.5 rounded-xl bg-[#222420] text-white text-xs font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      <InvoiceModal
        booking={selectedBookingForInvoice}
        isOpen={!!selectedBookingForInvoice}
        onClose={() => setSelectedBookingForInvoice(null)}
      />

      {/* Modal de Creación / Edición de Tour Personalizado */}
      <TourFormModal
        isOpen={showTourModal}
        onClose={() => setShowTourModal(false)}
        onSaved={() => {
          fetchTours();
        }}
        tourToEdit={tourToEdit}
        operators={operators}
      />

      {/* Modal de Creación / Edición de Operarios */}
      <OperatorFormModal
        isOpen={showOperatorModal}
        onClose={() => setShowOperatorModal(false)}
        onSaved={() => {
          fetchOperators();
        }}
        operatorToEdit={operatorToEdit}
      />

    </div>
  );
};
