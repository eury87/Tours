import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  CreditCard, 
  CheckCircle, 
  Sparkles, 
  QrCode, 
  Printer, 
  MessageSquare, 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  FileText,
  Lock,
  User,
  Tag,
  AlertCircle,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { Tour, AddOn, Passenger, Booking, PaymentMethod, PaymentStatus, Coupon } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface BookingModalProps {
  tour: Tour | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingCompleted?: (booking: Booking) => void;
  initialBooking?: Booking | null;
  initialStep?: 1 | 2 | 3 | 4 | 5;
}

const AVAILABLE_ADDONS: AddOn[] = [
  {
    id: 'addon-photo',
    name: '📸 Paquete de Fotografía 4K & Drone',
    description: 'Sesión de fotos y video en alta definición durante las mejores paradas del tour.',
    price: 30,
  },
  {
    id: 'addon-pickup',
    name: '🚐 Recogida Privada en Hotel (Ida y Vuelta)',
    description: 'Transporte exclusivo puerta a puerta sin paradas intermedias.',
    price: 25,
  },
  {
    id: 'addon-lunch',
    name: '🍷 Menú Degustación Premium & Maridaje',
    description: 'Upgrade a almuerzo de 4 tiempos con copa de vino y postre artesanal.',
    price: 20,
  }
];

export const BookingModal: React.FC<BookingModalProps> = ({ tour, isOpen, onClose, onBookingCompleted, initialBooking, initialStep }) => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(initialStep || 1);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  
  // Lead customer info
  const [leadCustomer, setLeadCustomer] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: 'Perú',
    notes: '',
  });

  // Individual passengers
  const [passengers, setPassengers] = useState<Passenger[]>([
    { fullName: '', documentType: 'DNI', documentNumber: '', ageType: 'adult', specialRequirements: '' },
    { fullName: '', documentType: 'DNI', documentNumber: '', ageType: 'adult', specialRequirements: '' },
  ]);

  // Coupons
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8829');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('892');
  const [transferProofUploaded, setTransferProofUploaded] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [connectedWhatsAppPhone, setConnectedWhatsAppPhone] = useState<string>('50767546550');

  useEffect(() => {
    fetch('/api/whatsapp/status')
      .then(res => res.json())
      .then(data => {
        if (data.data?.connected && data.data?.phone) {
          setConnectedWhatsAppPhone(data.data.phone);
        }
      })
      .catch(() => {});
  }, []);

  // Prellenar datos si viene de un enlace de pago aprobado por el operador
  useEffect(() => {
    if (initialBooking) {
      setSelectedDate(initialBooking.date);
      setSelectedTime(initialBooking.timeSlot);
      setAdultsCount(initialBooking.adultsCount);
      setChildrenCount(initialBooking.childrenCount);
      setLeadCustomer({
        fullName: initialBooking.leadCustomer.fullName,
        email: initialBooking.leadCustomer.email,
        phone: initialBooking.leadCustomer.phone,
        country: initialBooking.leadCustomer.country,
        notes: initialBooking.leadCustomer.notes || '',
      });
      setPassengers(initialBooking.passengers);
      setStep(initialStep || 4);
    }
  }, [initialBooking, initialStep]);

  if (!isOpen || !tour) return null;

  if (!selectedTime && tour.timeSlots.length > 0) {
    setSelectedTime(tour.timeSlots[0]);
  }

  const handlePassengerCountChange = (adults: number, children: number) => {
    setAdultsCount(adults);
    setChildrenCount(children);
    const total = adults + children;
    
    setPassengers((prev) => {
      const next: Passenger[] = [];
      for (let i = 0; i < total; i++) {
        const isChild = i >= adults;
        if (prev[i]) {
          next.push({ ...prev[i], ageType: isChild ? 'child' : 'adult' });
        } else {
          next.push({
            fullName: '',
            documentType: 'DNI',
            documentNumber: '',
            ageType: isChild ? 'child' : 'adult',
            specialRequirements: '',
          });
        }
      }
      return next;
    });
  };

  // Determinar si esta reserva está en fase de solicitar aprobación o de pago
  const isAwaitingApproval = !!(tour.requiresOperatorApproval && !initialBooking);

  // Calculations
  const tourBaseTotal = (adultsCount * tour.price) + (childrenCount * tour.childPrice);
  const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
  const subtotalRaw = tourBaseTotal + addOnsTotal;
  const subtotal = Math.max(0, subtotalRaw - couponDiscount);
  const tax = subtotal * 0.10;
  const totalAmount = subtotal + tax;

  const toggleAddOn = (addon: AddOn) => {
    setSelectedAddOns(prev => 
      prev.some(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    try {
      setIsValidatingCoupon(true);
      setCouponError('');
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), subtotal: subtotalRaw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || 'Cupón inválido');
        setAppliedCoupon(null);
        setCouponDiscount(0);
      } else {
        setAppliedCoupon(data.data.coupon);
        setCouponDiscount(data.data.discountAmount);
      }
    } catch (err: any) {
      setCouponError('Error validando cupón');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleAutofillTestData = () => {
    const activePhone = connectedWhatsAppPhone 
      ? (connectedWhatsAppPhone.startsWith('+') ? connectedWhatsAppPhone : `+${connectedWhatsAppPhone}`)
      : '+507 6754 6550';

    const testLead = {
      fullName: 'Carlos Mendoza (Cliente)',
      email: 'euryhealer@gmail.com',
      phone: activePhone,
      country: 'Panamá',
      notes: 'Sin restricciones. Salida de prueba en modo test/sandbox.',
    };
    setLeadCustomer(testLead);
    setPassengers(prev => prev.map((p, idx) => ({
      ...p,
      fullName: idx === 0 ? 'Carlos Mendoza' : `Acompañante #${idx + 1}`,
      documentType: 'DNI',
      documentNumber: `4591829${idx}`,
      specialRequirements: 'Ninguna',
    })));
    return testLead;
  };

  // Submit and finalize booking
  const handleFinalizeBooking = async (overrides?: {
    leadCustomer?: typeof leadCustomer;
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
    cardLast4?: string;
    cardBrand?: string;
  }) => {
    try {
      setIsProcessing(true);

      const activeLead = overrides?.leadCustomer || leadCustomer;
      const activeMethod = overrides?.paymentMethod || paymentMethod;
      const finalPaymentStatus: PaymentStatus = overrides?.paymentStatus || (tour.requiresOperatorApproval ? 'pending' : (activeMethod === 'bank_transfer' ? 'pending' : 'completed'));

      const payload = {
        tourId: tour.id,
        date: selectedDate,
        timeSlot: selectedTime,
        adultsCount,
        childrenCount,
        paymentStatus: finalPaymentStatus,
        leadCustomer: {
          fullName: activeLead.fullName || passengers[0]?.fullName || 'Cliente de Prueba',
          email: activeLead.email || 'cliente.test@tours.com',
          phone: activeLead.phone || '+1 (555) 349-2810',
          country: activeLead.country || 'Perú',
          notes: activeLead.notes || 'Modo Sandbox Activo',
        },
        passengers: passengers.map((p, idx) => ({
          ...p,
          fullName: p.fullName || (idx === 0 ? (activeLead.fullName || 'Pasajero Principal') : `Acompañante #${idx + 1}`),
          documentNumber: p.documentNumber || `DOC-982${idx}`,
        })),
        selectedAddOns,
        paymentMethod: activeMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        language,
        paymentDetails: {
          cardLast4: overrides?.cardLast4 || (activeMethod === 'credit_card' ? cardNumber.slice(-4) : '4242'),
          cardBrand: overrides?.cardBrand || (activeMethod === 'credit_card' ? 'Visa' : 'Test Gateway'),
          transferReceiptUrl: transferProofUploaded ? 'https://example.com/receipt-sample.png' : undefined,
        },
      };

      let booking: Booking;
      if (initialBooking) {
        const res = await fetch(`/api/bookings/${initialBooking.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentStatus: 'completed',
            status: 'paid',
            cardLast4: overrides?.cardLast4 || (activeMethod === 'credit_card' ? cardNumber.slice(-4) : '4242'),
            cardBrand: overrides?.cardBrand || (activeMethod === 'credit_card' ? 'Visa' : 'Test Gateway'),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al procesar pago');
        booking = data.data;
      } else {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al procesar reserva');
        booking = data.data;
      }
      setCreatedBooking(booking);

      const qrUri = await QRCode.toDataURL(`TOUR_BOARDING_PASS:${booking.code}:${booking.id}`, {
        margin: 1,
        width: 250,
        color: { dark: '#022c22', light: '#ffffff' }
      });
      setQrCodeDataUrl(qrUri);

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b', '#ffffff']
      });

      if (onBookingCompleted) onBookingCompleted(booking);
      setStep(5);
    } catch (err: any) {
      alert(`Ocurrió un error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayInTestMode = async () => {
    let activeLead = leadCustomer;
    if (!activeLead.fullName || !activeLead.email) {
      activeLead = handleAutofillTestData();
    }
    setPaymentMethod('credit_card');
    setCardNumber('4242 •••• •••• 4242');
    setCardHolder(activeLead.fullName || 'Carlos Mendoza');
    setCardExpiry('12/28');
    await handleFinalizeBooking({
      leadCustomer: activeLead,
      paymentMethod: 'credit_card',
      cardLast4: '4242',
      cardBrand: 'Visa Sandbox Test',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Topbar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#161715] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E8E1D1] text-[#152230] border border-[#E8E1D1] flex items-center justify-center font-bold font-mono text-sm shadow">
              0{step}
            </div>
            <div>
              <h3 className="font-heading font-bold text-white text-base">
                {step === 1 && t('step1Title')}
                {step === 2 && t('step2Title')}
                {step === 3 && t('step3Title')}
                {step === 4 && t('step4Title')}
                {step === 5 && t('step5Title')}
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">{tour.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Stepper Progress Bar */}
        <div className="w-full bg-[#161715] h-1.5 flex">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 transition-all duration-300 ${
                s <= step ? 'bg-gradient-to-r from-[#E8E1D1] to-[#A8A396]' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-[#161715]">
          
          {/* STEP 1: Date, Time & Passenger Count */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Date Picker */}
                <div className="p-5 rounded-2xl bg-[#181A17]/90 border border-white/10 space-y-3">
                  <label className="text-xs uppercase font-bold text-[#E8E1D1] flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{t('selectDate')}</span>
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#141513] border border-white/15 text-white font-semibold text-sm focus:border-[#E8E1D1] focus:outline-none"
                  />
                </div>

                {/* Time Slots */}
                <div className="p-5 rounded-2xl bg-[#181A17]/90 border border-white/10 space-y-3">
                  <label className="text-xs uppercase font-bold text-[#E8E1D1] flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{t('timeSlot')}</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {tour.timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-xl text-xs font-bold transition-all border ${
                          selectedTime === time
                            ? 'bg-[#E8E1D1] text-[#152230] border-[#E8E1D1] shadow-md shadow-black/30'
                            : 'bg-[#141513] text-stone-300 border-white/15 hover:border-white/30'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Passengers Breakdown */}
              <div className="p-5 rounded-2xl bg-[#181A17]/90 border border-white/10">
                <h4 className="text-xs uppercase font-bold text-[#E8E1D1] flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4" />
                  <span>{t('passengerCount')}</span>
                </h4>

                <div className="grid sm:grid-cols-2 gap-4">
                  
                  {/* Adults */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <div className="font-bold text-white text-sm">{t('adults')}</div>
                      <div className="text-xs text-slate-400">${tour.price} USD</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePassengerCountChange(Math.max(1, adultsCount - 1), childrenCount)}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="font-bold text-white text-base w-4 text-center">{adultsCount}</span>
                      <button
                        onClick={() => handlePassengerCountChange(adultsCount + 1, childrenCount)}
                        className="w-8 h-8 rounded-lg bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] font-black flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <div className="font-bold text-white text-sm">{t('children')}</div>
                      <div className="text-xs text-slate-400">${tour.childPrice} USD</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePassengerCountChange(adultsCount, Math.max(0, childrenCount - 1))}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="font-bold text-white text-base w-4 text-center">{childrenCount}</span>
                      <button
                        onClick={() => handlePassengerCountChange(adultsCount, childrenCount + 1)}
                        className="w-8 h-8 rounded-lg bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] font-black flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Optional Add-ons */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-3">
                {AVAILABLE_ADDONS.map((addon) => {
                  const isSelected = selectedAddOns.some(a => a.id === addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddOn(addon)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-[#1a2433] border-[#E8E1D1] shadow-md shadow-black/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-md mt-0.5 border flex items-center justify-center ${
                          isSelected ? 'bg-[#E8E1D1] border-[#E8E1D1] text-[#152230]' : 'border-slate-600'
                        }`}>
                          {isSelected && <CheckCircle className="w-4 h-4 fill-[#152230] text-[#E8E1D1]" />}
                        </div>
                        <div>
                          <h5 className="font-bold text-white text-sm">{addon.name}</h5>
                          <p className="text-xs text-slate-400 mt-0.5">{addon.description}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-heading font-extrabold text-[#E8E1D1] text-base">
                          +${addon.price} USD
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Lead Customer & Passenger Details */}
          {step === 3 && (
            <div className="p-5 rounded-2xl bg-[#181A17]/90 border border-white/10 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs uppercase font-bold text-[#E8E1D1] flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{t('leadCustomerTitle')}</span>
                </h4>
                <button
                  type="button"
                  onClick={handleAutofillTestData}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-[#E8E1D1] text-xs font-bold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#E8E1D1]" />
                  <span>🧪 Autocompletar Datos de Prueba</span>
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">{t('fullName')} *</label>
                  <input
                    type="text"
                    placeholder="Ej: Andrea Morales"
                    value={leadCustomer.fullName}
                    onChange={(e) => setLeadCustomer({ ...leadCustomer, fullName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-[#E8E1D1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">{t('email')} *</label>
                  <input
                    type="email"
                    placeholder="andrea@ejemplo.com"
                    value={leadCustomer.email}
                    onChange={(e) => setLeadCustomer({ ...leadCustomer, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-[#E8E1D1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">{t('phone')} *</label>
                  <input
                    type="tel"
                    placeholder="+51 987 654 321"
                    value={leadCustomer.phone}
                    onChange={(e) => setLeadCustomer({ ...leadCustomer, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-[#E8E1D1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">{t('country')}</label>
                  <input
                    type="text"
                    placeholder="Perú, USA, España..."
                    value={leadCustomer.country}
                    onChange={(e) => setLeadCustomer({ ...leadCustomer, country: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-[#E8E1D1] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">{t('notes')}</label>
                <textarea
                  rows={2}
                  value={leadCustomer.notes}
                  onChange={(e) => setLeadCustomer({ ...leadCustomer, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-[#E8E1D1] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Checkout, Coupons & Payment */}
          {step === 4 && (
            <div className="space-y-6">
              
              {isAwaitingApproval ? (
                /* Card para tours con Aprobación Previa (Sin cobro) */
                <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-heading font-black text-lg text-white">
                        Modalidad: Aprobación Previa del Operario
                      </h4>
                      <p className="text-xs text-amber-200/90 leading-relaxed mt-1">
                        Este tour no requiere pago inmediato. Al enviar tu solicitud, el operario oficial asignado verificará cupos y condiciones en tiempo real y te responderá directamente vía WhatsApp.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-500/20 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-[#E8E1D1] border border-slate-700">Paso 1</span>
                      <span>Envías esta solicitud sin ingresar tarjeta ni pagar hoy.</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-[#E8E1D1] border border-slate-700">Paso 2</span>
                      <span>El guía oficial recibe una alerta interactiva en su WhatsApp (+507 6527-4580).</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-[#E8E1D1] border border-slate-700">Paso 3</span>
                      <span>En cuanto el guía responda <strong>1 (Aceptar)</strong>, recibirás el enlace de pago seguro a tu WhatsApp y a tu correo.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle className="w-5 h-5 text-[#E8E1D1] shrink-0 mt-0.5" />
                    <span>
                      Sin cobro hoy: Se reservarán tus lugares por 24 horas mientras el guía confirma disponibilidad.
                    </span>
                  </div>
                </div>
              ) : (
                /* Card para tours con Pago Directo / Instantáneo O tour aprobado listo para pagar */
                <>
                  {initialBooking && (
                    <div className="p-4 rounded-2xl bg-[#181A17]/90 border border-white/20 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white/10 text-[#E8E1D1] shrink-0">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-white">¡Tour Aprobado por el Guía Oficial (+507 6527-4580)!</span>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Tu guía ha aprobado la reserva <strong>{initialBooking.code}</strong>. Al procesar tu pago a continuación, se emitirá tu Factura Oficial y Pase Digital QR tanto por WhatsApp como por correo electrónico.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Test Mode Card */}
                  <div className="p-4 rounded-2xl bg-[#181A17] border border-[#E8E1D1]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white/5 text-[#E8E1D1] border border-white/10">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">Modo Test & Simulación Habilitado</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-white/10 text-[#E8E1D1] border border-white/20">
                            Sandbox Activo
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          No se realiza ningún cobro real a tu tarjeta. Se emitirá tu Factura Comercial y se despachará la confirmación real a WhatsApp y Email.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePayInTestMode}
                      disabled={isProcessing}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] font-black text-xs shadow-lg shadow-black/40 transition-all hover:scale-105 shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <span>⚡ Pagar en Modo Test (1-Click)</span>
                    </button>
                  </div>

                  {/* Promo Coupon Card */}
                  <div className="p-4 rounded-2xl bg-[#181A17]/90 border border-white/10 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#E8E1D1] flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      <span>{t('couponTitle')}</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t('couponPlaceholder')}
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1 p-2.5 rounded-xl bg-[#141513] border border-white/15 text-white font-mono text-xs uppercase focus:border-[#E8E1D1] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon || !couponInput.trim()}
                        className="px-5 py-2.5 rounded-xl bg-[#222420] hover:bg-[#2A2C27] text-[#E8E1D1] font-bold text-xs shadow transition-colors disabled:opacity-50"
                      >
                        {isValidatingCoupon ? '...' : t('applyCoupon')}
                      </button>
                    </div>

                    {appliedCoupon && (
                      <div className="text-xs text-[#E8E1D1] font-semibold flex items-center gap-1.5 pt-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>¡Cupón <strong>{appliedCoupon.code}</strong> aplicado! Descuento: -${couponDiscount.toFixed(2)} USD</span>
                      </div>
                    )}
                    {couponError && (
                      <div className="text-xs text-rose-400 font-semibold flex items-center gap-1.5 pt-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{couponError}</span>
                      </div>
                    )}
                  </div>

                  {/* Payment selector */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setPaymentMethod('credit_card')}
                      className={`p-3.5 rounded-2xl border text-center transition-all ${
                        paymentMethod === 'credit_card'
                          ? 'bg-[#1a2331] border-[#E8E1D1] text-white shadow-lg shadow-black/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mx-auto mb-1 text-[#E8E1D1]" />
                      <span className="text-xs font-bold block">{t('creditCard')}</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('mercadopago')}
                      className={`p-3.5 rounded-2xl border text-center transition-all ${
                        paymentMethod === 'mercadopago'
                          ? 'bg-[#1a2331] border-[#E8E1D1] text-white shadow-lg shadow-black/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Sparkles className="w-5 h-5 mx-auto mb-1 text-[#E8E1D1]" />
                      <span className="text-xs font-bold block">{t('mercadoPago')}</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-3.5 rounded-2xl border text-center transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'bg-[#1a2331] border-[#E8E1D1] text-white shadow-lg shadow-black/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <FileText className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                      <span className="text-xs font-bold block">{t('bankTransfer')}</span>
                    </button>
                  </div>
                </>
              )}

              {/* Card Form */}
              {paymentMethod === 'credit_card' && (
                <div className="p-5 rounded-2xl bg-[#181A17]/90 border border-white/10 space-y-4">
                  <div className="w-full max-w-sm mx-auto h-44 rounded-2xl bg-gradient-to-tr from-[#252823] via-[#1C1E1B] to-[#121310] p-5 text-white shadow-2xl flex flex-col justify-between border border-[#E8E1D1]/30">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-extrabold text-sm tracking-widest text-[#E8E1D1]">VISA PLATINUM</span>
                      <Lock className="w-4 h-4 text-[#E8E1D1]" />
                    </div>
                    <div className="font-mono text-lg tracking-widest text-white/90">{cardNumber}</div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="text-[9px] text-white/60 uppercase">Titular</div>
                        <div>{cardHolder || leadCustomer.fullName || 'NOMBRE TITULAR'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-white/60 uppercase">Expira</div>
                        <div>{cardExpiry}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">{t('cardNumber')}</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-[#141513] border border-white/15 text-white font-mono text-xs focus:border-[#E8E1D1] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">{t('cardHolder')}</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-[#E8E1D1] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Tour + Extras</span>
                  <span>${subtotalRaw.toFixed(2)} USD</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-[#E8E1D1] font-bold">
                    <span>Descuento Cupón ({appliedCoupon?.code})</span>
                    <span>-${couponDiscount.toFixed(2)} USD</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>{t('taxes')}</span>
                  <span>${tax.toFixed(2)} USD</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-base font-bold text-white">
                  <span>{t('totalToPay')}</span>
                  <span className="font-heading font-black text-[#E8E1D1] text-xl">
                    ${totalAmount.toFixed(2)} USD
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* STEP 5: Success & Digital Boarding Pass */}
          {step === 5 && createdBooking && (
            <div className="space-y-6">
              
              <div className="text-center space-y-2">
                <div className={`inline-flex items-center gap-2 px-4 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${
                  createdBooking.paymentStatus === 'pending'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  {createdBooking.paymentStatus === 'pending' ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  <span>{createdBooking.paymentStatus === 'pending' ? 'Solicitud Enviada al Guía • Sin Desembolso Hoy' : 'Reserva Confirmada & Notificaciones Enviadas'}</span>
                </div>
                <h3 className="font-heading font-extrabold text-2xl md:text-3xl text-white">
                  {createdBooking.paymentStatus === 'pending' ? '¡Solicitud Recibida con Éxito!' : '¡Todo Listo para tu Aventura!'}
                </h3>
                {createdBooking.paymentStatus === 'pending' && (
                  <p className="text-xs text-slate-300 max-w-lg mx-auto">
                    Hemos notificado al guía oficial asignado (<strong>+507 6527-4580</strong>) por WhatsApp. En cuanto responda <strong>1 (Aceptar)</strong>, recibirás el enlace de pago seguro a tu WhatsApp (<strong>{createdBooking.leadCustomer.phone}</strong>) y a tu correo.
                  </p>
                )}
              </div>

              {/* Printable Boarding Pass Card */}
              <div className="print-ticket-area bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-[10px] font-extrabold tracking-widest text-emerald-700 uppercase">
                      {createdBooking.paymentStatus === 'pending' ? 'PRE-RESERVA & SOLICITUD DE SERVICIO' : t('boardingPassTitle')}
                    </span>
                    <h2 className="font-heading font-black text-2xl text-slate-900">{tour.title}</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Punto: {tour.meetingPoint.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-mono">CÓDIGO</span>
                    <span className="font-heading font-black text-xl text-emerald-700 font-mono">{createdBooking.code}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Fecha</span>
                    <span className="font-bold text-slate-800 text-sm">📅 {createdBooking.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Horario</span>
                    <span className="font-bold text-slate-800 text-sm">⏰ {createdBooking.timeSlot}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Pasajeros</span>
                    <span className="font-bold text-slate-800 text-sm">👥 {createdBooking.totalPassengers} Personas</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Estado de Pago</span>
                    <span className={`font-bold text-sm ${createdBooking.paymentStatus === 'pending' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {createdBooking.paymentStatus === 'pending' ? `⏳ $0.00 Pagado ($${createdBooking.totalAmount.toFixed(2)} al confirmar)` : `✅ $${createdBooking.totalAmount.toFixed(2)} USD`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 pt-4 border-t border-dashed border-slate-300">
                  <div className="shrink-0 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                    {qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="QR Code" className="w-36 h-36 mx-auto rounded-lg" />
                    ) : (
                      <div className="w-36 h-36 bg-slate-100 flex items-center justify-center text-xs">Generando QR...</div>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono block mt-1.5 uppercase tracking-wider">
                      {createdBooking.paymentStatus === 'pending' ? 'Voucher Pre-Reserva' : 'Voucher de Embarque'}
                    </span>
                  </div>

                  <div className="flex-1 text-xs space-y-2 text-slate-600">
                    <p>
                      <strong>Titular:</strong> {createdBooking.leadCustomer.fullName} ({createdBooking.leadCustomer.phone})
                    </p>
                    <p>
                      <strong>Punto de Encuentro:</strong> {tour.meetingPoint.address}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {createdBooking.paymentStatus === 'pending'
                        ? '🛡️ Tu reserva está reservada provisionalmente. No se ha realizado ningún cobro hasta que el guía confirme.'
                        : 'Presenta este código QR en tu teléfono o impreso al guía asignado el día de la salida.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t('printPdf')}</span>
                </button>

                <a
                  href={`https://wa.me/${leadCustomer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${leadCustomer.fullName}, aquí tienes tu solicitud de reserva ${createdBooking.code} para ${tour.title}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t('shareWhatsApp')}</span>
                </a>
              </div>

            </div>
          )}

        </div>

        {/* Modal Navigation Footer */}
        {step < 5 && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t('backBtn')}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">{t('totalEstimated')}</span>
                <div className="font-heading font-extrabold text-white text-base">
                  ${totalAmount.toFixed(2)} USD
                </div>
              </div>

              {step < 4 ? (
                <button
                  onClick={() => setStep((prev) => (prev + 1) as any)}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] font-black text-xs shadow-lg shadow-black/40 transition-all hover:scale-105"
                >
                  <span>{t('continueBtn')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : isAwaitingApproval ? (
                <button
                  onClick={() => handleFinalizeBooking({ paymentStatus: 'pending' })}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transition-all hover:scale-105 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Enviando Solicitud...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>📩 Enviar Solicitud (Sin Desembolso Hoy)</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleFinalizeBooking()}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-7 py-3 rounded-xl bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] font-black text-sm shadow-xl shadow-black/40 transition-all hover:scale-105 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>{t('processingBooking')}</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{t('payAndConfirm')} (${totalAmount.toFixed(2)} USD)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
