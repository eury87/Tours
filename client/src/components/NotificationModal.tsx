import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  MessageSquare, 
  Bell, 
  ExternalLink, 
  RotateCw, 
  CheckCircle2, 
  Send,
  Filter,
  User,
  ShieldAlert
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const { notifications, refreshBookings } = useSocket();
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'whatsapp' | 'in_app'>('all');
  const [isResending, setIsResending] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter((n) => {
    if (channelFilter === 'all') return true;
    return n.channel === channelFilter;
  });

  const handleResend = async (bookingId: string) => {
    try {
      setIsResending(bookingId);
      const res = await fetch(`/api/notifications/resend/${bookingId}`, { method: 'POST' });
      if (res.ok) {
        await refreshBookings();
      }
    } catch (err) {
      console.error('Error reenviando notificaciones:', err);
    } finally {
      setIsResending(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#E8E1D1]">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-white">Centro de Notificaciones Multicanal</h3>
              <p className="text-xs text-slate-400">Registro en vivo de correos, mensajes de WhatsApp y alertas In-App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium mr-1">Canal:</span>
            <button
              onClick={() => setChannelFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                channelFilter === 'all'
                  ? 'bg-[#E8E1D1] text-[#152230]'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todos ({notifications.length})
            </button>
            <button
              onClick={() => setChannelFilter('email')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                channelFilter === 'email'
                  ? 'bg-[#E8E1D1] text-[#152230]'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3 h-3" />
              <span>Email</span>
            </button>
            <button
              onClick={() => setChannelFilter('whatsapp')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                channelFilter === 'whatsapp'
                  ? 'bg-[#E8E1D1] text-[#152230]'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => setChannelFilter('in_app')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                channelFilter === 'in_app'
                  ? 'bg-[#E8E1D1] text-[#152230]'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Bell className="w-3 h-3" />
              <span>In-App</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500">
            Mostrando {filteredNotifs.length} registros
          </span>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Send className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-heading text-base font-semibold text-slate-400">Sin notificaciones aún</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Realiza una reserva desde el catálogo para disparar los correos al cliente, dueño y operario asignado.
              </p>
            </div>
          ) : (
            filteredNotifs.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        n.channel === 'email'
                          ? 'bg-white/10 text-slate-300 border border-white/20'
                          : n.channel === 'whatsapp'
                          ? 'bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {n.channel === 'email' && <Mail className="w-4 h-4" />}
                      {n.channel === 'whatsapp' && <MessageSquare className="w-4 h-4" />}
                      {n.channel === 'in_app' && <Bell className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-bold text-sm text-white">{n.title}</span>
                        <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {n.bookingCode}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {n.recipientRole === 'customer' ? '👤 Cliente' : n.recipientRole === 'owner' ? '👑 Dueño' : '🧭 Operario'}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Destinatario: <strong className="text-slate-200">{n.recipientName}</strong> ({n.recipientContact})</span>
                      </div>

                      <p className="text-xs text-slate-300 mt-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 whitespace-pre-line font-mono text-[11px] leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E8E1D1] bg-white/10 border border-white/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{n.status.toUpperCase()}</span>
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 mt-1">
                      {n.emailPreviewUrl && (
                        <a
                          href={n.emailPreviewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#E8E1D1] border border-white/20 text-xs font-semibold transition-colors"
                          title="Abrir vista previa del correo HTML generado"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Ver Correo HTML</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {n.whatsappLink && (
                        <a
                          href={n.whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/40 text-xs font-semibold transition-colors"
                          title="Enviar o abrir en WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Sistema conectado con Nodemailer (Email) y Webhooks de WhatsApp</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
