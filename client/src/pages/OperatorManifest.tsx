import React, { useState } from 'react';
import { 
  ClipboardList, 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Calendar,
  Printer
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { Booking } from '../types';

export const OperatorManifest: React.FC = () => {
  const { liveBookings, refreshBookings } = useSocket();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Salidas del día o todas las confirmadas
  const activeBookings = liveBookings.filter(b => b.status !== 'cancelled');

  const handleConfirmOperator = async (bookingId: string) => {
    try {
      await fetch(`/api/bookings/${bookingId}/confirm-operator`, {
        method: 'POST',
      });
      await refreshBookings();
    } catch (err) {
      console.error('Error confirming operator assignment:', err);
    }
  };

  const handleMarkBoarded = async (bookingId: string) => {
    try {
      await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'boarded' }),
      });
      await refreshBookings();
    } catch (err) {
      console.error('Error marking boarded:', err);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#E8E1D1] text-xs font-bold uppercase tracking-wider mb-2">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Vista Operativa para Guías & Conductores</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
            Manifiesto Diario de Pasajeros & Salidas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Consulta la lista de pasajeros, requerimientos alimentarios, puntos de recogida y contactos directos de WhatsApp.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C1E1B] border border-white/10 text-stone-200 hover:text-white hover:bg-[#252824] text-xs font-semibold self-start shadow-md transition-colors"
        >
          <Printer className="w-4 h-4 text-[#E8E1D1]" />
          <span>Imprimir Hoja de Ruta</span>
        </button>
      </div>

      {/* Manifest Groups */}
      <div className="space-y-6">
        {activeBookings.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-3xl p-8 border border-white/10">
            <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="font-heading font-bold text-lg text-white">No hay salidas programadas</h3>
            <p className="text-xs text-slate-400 mt-1">Las nuevas reservas aparecerán automáticamente en esta lista.</p>
          </div>
        ) : (
          activeBookings.map((booking) => {
            const isBoarded = booking.status === 'boarded';

            return (
              <div
                key={booking.id}
                className={`p-6 rounded-3xl glass-panel border transition-all ${
                  isBoarded ? 'border-[#E8E1D1]/40 bg-[#E8E1D1]/5' : 'border-white/10 bg-[#181A17]/80'
                }`}
              >
                {/* Tour & Group Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-black text-xl text-white">
                        {booking.tourTitle}
                      </span>
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-white/10 text-[#E8E1D1] border border-white/20">
                        {booking.code}
                      </span>
                      {booking.assignedOperatorName && (
                        <span className="text-xs text-slate-200 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full font-medium">
                          🧭 Guía: {booking.assignedOperatorName}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-300 mt-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#E8E1D1]" />
                        <span>Fecha: <strong>{booking.date}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#E8E1D1]" />
                        <span>Hora Salida: <strong>{booking.timeSlot}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#E8E1D1]" />
                        <span>Total: <strong>{booking.totalPassengers} Pasajero(s)</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Boarding Status & Operator Assignment Confirmation */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    
                    {/* Confirmation of assignment */}
                    {booking.operatorConfirmed ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-[#E8E1D1] text-xs font-bold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Turno Confirmado {booking.operatorConfirmedAt ? `(${booking.operatorConfirmedAt})` : ''}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConfirmOperator(booking.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] text-xs font-black shadow transition-all hover:scale-105"
                        title="Confirmar al dueño que has recibido la hoja de ruta y estás a cargo de este grupo"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Aceptar & Confirmar Turno</span>
                      </button>
                    )}

                    {/* Boarding Status */}
                    {isBoarded ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-[#E8E1D1] text-xs font-bold">
                        <CheckCircle className="w-4 h-4 text-[#E8E1D1]" />
                        <span>Abordado ({booking.checkInAt || 'Hoy'})</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleMarkBoarded(booking.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] text-xs font-black shadow-lg shadow-black/40 transition-all hover:scale-105"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Marcar Abordaje</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Lead Contact Card & Quick WhatsApp Action */}
                <div className="my-5 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Titular del Grupo</span>
                    <div className="font-bold text-white text-sm">{booking.leadCustomer.fullName}</div>
                    <div className="text-slate-400 mt-0.5 flex items-center gap-3">
                      <span>📞 {booking.leadCustomer.phone}</span>
                      <span>✉️ {booking.leadCustomer.email}</span>
                      <span>🌎 {booking.leadCustomer.country}</span>
                    </div>
                    {booking.leadCustomer.notes && (
                      <div className="mt-2 text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-[11px]">
                        ⚠️ <strong>Nota:</strong> {booking.leadCustomer.notes}
                      </div>
                    )}
                  </div>

                  <a
                    href={`https://wa.me/${booking.leadCustomer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${booking.leadCustomer.fullName}, soy tu guía de TerraAventura para el tour ${booking.tourTitle}. Estamos listos en el punto de encuentro.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/40 text-xs font-bold shrink-0 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp con Titular</span>
                  </a>
                </div>

                {/* Manifest Table */}
                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-300 mb-3 uppercase tracking-wider text-[11px]">
                    Pasajeros Registrados en Seguro Médico
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold text-[11px] uppercase">
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Nombre Completo</th>
                          <th className="py-2.5 px-3">Tipo Pasajero</th>
                          <th className="py-2.5 px-3">Documento</th>
                          <th className="py-2.5 px-3">Requerimiento / Alergia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/80">
                        {booking.passengers.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-3 text-slate-500 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-white">{p.fullName}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.ageType === 'adult' ? 'bg-slate-800 text-slate-300' : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                              }`}>
                                {p.ageType === 'adult' ? 'Adulto' : 'Niño'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 font-mono">
                              {p.documentType}: {p.documentNumber}
                            </td>
                            <td className="py-2.5 px-3">
                              {p.specialRequirements ? (
                                <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>{p.specialRequirements}</span>
                                </span>
                              ) : (
                                <span className="text-slate-500">Sin observaciones</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
