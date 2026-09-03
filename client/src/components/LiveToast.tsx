import React from 'react';
import { Sparkles, X, Compass, ExternalLink } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

interface LiveToastProps {
  onViewBooking?: (bookingId: string) => void;
}

export const LiveToast: React.FC<LiveToastProps> = ({ onViewBooking }) => {
  const { latestAlert, dismissLatestAlert } = useSocket();

  if (!latestAlert) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="glass-panel bg-slate-900/95 border-2 border-emerald-500/50 rounded-2xl p-4 shadow-2xl shadow-emerald-950/60 glow-emerald">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Notificación en Tiempo Real
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h4 className="font-heading font-bold text-white text-base mt-0.5">
              {latestAlert.title}
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {latestAlert.message}
            </p>

            {latestAlert.booking && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono text-emerald-300 font-bold">
                  {latestAlert.booking.code}
                </span>
                {onViewBooking && (
                  <button
                    onClick={() => {
                      if (latestAlert.booking) onViewBooking(latestAlert.booking.id);
                      dismissLatestAlert();
                    }}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    <span>Ver en Panel</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={dismissLatestAlert}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
