import React, { useState } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Booking } from '../types';
import { useSocket } from '../context/SocketContext';
import { playNotificationChime } from '../utils/audio';

export const QrScannerModal: React.FC = () => {
  const { liveBookings, refreshBookings } = useSocket();
  const [manualCode, setManualCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    alreadyBoarded?: boolean;
    message: string;
    booking?: Booking;
  } | null>(null);

  const handleValidateCode = async (codeToValidate: string) => {
    if (!codeToValidate.trim()) return;
    try {
      setIsValidating(true);
      setValidationResult(null);

      const res = await fetch('/api/bookings/validate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawQrData: codeToValidate.trim() }),
      });

      const data = await res.json();
      setValidationResult({
        success: data.success,
        alreadyBoarded: data.alreadyBoarded,
        message: data.message || data.error,
        booking: data.data,
      });

      if (data.success) {
        playNotificationChime();
        await refreshBookings();
      }
    } catch (err: any) {
      setValidationResult({
        success: false,
        message: `Error de red: ${err.message}`,
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#E8E1D1] text-xs font-bold uppercase tracking-wider">
          <QrCode className="w-3.5 h-3.5" />
          <span>Control de Acceso & Check-In en Punto de Encuentro</span>
        </div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
          Validador Digital de Boletos y QR
        </h1>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Ingresa o escanea el código del voucher presentado por el cliente para verificar su validez y registrar el abordaje en tiempo real.
        </p>
      </div>

      {/* Code Input Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6">
        
        <div className="space-y-3">
          <label className="text-xs uppercase font-bold text-[#E8E1D1] block">
            Código de Reserva o Contenido del QR
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Ej: TOUR-2026-9142"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleValidateCode(manualCode)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#1C1E1B] border border-white/15 text-white font-mono text-sm uppercase focus:border-[#E8E1D1] focus:outline-none placeholder-stone-500 shadow-inner"
              />
            </div>
            <button
              onClick={() => handleValidateCode(manualCode)}
              disabled={isValidating || !manualCode.trim()}
              className="px-6 py-3 rounded-2xl bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] font-black text-xs shadow-lg shadow-black/40 disabled:opacity-50 transition-all hover:scale-105"
            >
              {isValidating ? 'Validando...' : 'Validar Boleto'}
            </button>
          </div>
        </div>

        {/* Quick select from recent bookings for easy demonstration */}
        <div className="pt-4 border-t border-white/10">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2">
            O selecciona un código de prueba reciente:
          </span>
          <div className="flex flex-wrap gap-2">
            {liveBookings.slice(0, 4).map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setManualCode(b.code);
                  handleValidateCode(b.code);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#1C1E1B] hover:bg-[#252824] text-stone-300 border border-white/10 text-xs font-mono font-bold transition-colors shadow-sm"
              >
                {b.code} ({b.leadCustomer.fullName.split(' ')[0]})
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Validation Result Box */}
      {validationResult && (
        <div className={`p-6 sm:p-8 rounded-3xl border animate-in zoom-in-95 duration-200 ${
          validationResult.success
            ? validationResult.alreadyBoarded
              ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
              : 'bg-[#E8E1D1]/10 border-[#E8E1D1]/40 text-[#E8E1D1]'
            : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              validationResult.success
                ? validationResult.alreadyBoarded
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-white/10 text-[#E8E1D1] border border-white/20'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}>
              {validationResult.success ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-heading font-bold text-xl text-white">
                  {validationResult.success
                    ? validationResult.alreadyBoarded
                      ? '⚠️ Boleto ya Registrado Previamente'
                      : '✅ ¡Boleto Válido y Autorizado!'
                    : '❌ Boleto No Encontrado'}
                </h3>
                <p className="text-xs mt-1 leading-relaxed opacity-90">{validationResult.message}</p>
              </div>

              {validationResult.booking && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-3 text-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-heading font-bold text-white text-sm">
                      {validationResult.booking.tourTitle}
                    </span>
                    <span className="font-mono font-bold text-[#E8E1D1]">
                      {validationResult.booking.code}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Titular</span>
                      <strong>{validationResult.booking.leadCustomer.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Pasajeros</span>
                      <strong>{validationResult.booking.totalPassengers} Personas</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Fecha y Hora</span>
                      <strong>{validationResult.booking.date} ({validationResult.booking.timeSlot})</strong>
                    </div>
                  </div>

                  {validationResult.booking.passengers && (
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold block mb-1">Acompañantes:</span>
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {validationResult.booking.passengers.map((p, i) => (
                          <li key={i}>
                            • {p.fullName} - {p.documentType} {p.documentNumber}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
