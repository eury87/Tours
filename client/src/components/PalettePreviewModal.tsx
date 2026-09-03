import React from 'react';
import { X, Sparkles, Check, Palette } from 'lucide-react';

interface PalettePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPalette: (paletteId: string) => void;
}

export const PalettePreviewModal: React.FC<PalettePreviewModalProps> = ({
  isOpen,
  onClose,
  onSelectPalette
}) => {
  if (!isOpen) return null;

  const palettes = [
    {
      id: 'coastal_blue',
      title: 'Coastal Blue (Hunter Palettes)',
      vibe: 'Estilo Riviera / Mediterráneo de Lujo',
      desc: 'Deep Sea (#0D2B45) marino profundo, Ocean Mist (#5A7D9A), acentos suaves en Seafoam (#8DBFB7), arena Sandy Shore (#DCC7AA) y blanco Salt Air (#F4F6F6). Fresco, sobrio y costero.',
      image: '/palettes/mockup_coastal_blue.jpg',
      swatches: ['#0D2B45', '#5A7D9A', '#8DBFB7', '#DCC7AA', '#F4F6F6']
    },
    {
      id: 'monterey_sky',
      title: 'Monterey Sky & Magnolia',
      vibe: 'Estilo Costero & Sendero Natural (Besta)',
      desc: 'Monterey Sky (azul acero sobrio BU90), crema cálida Magnolia (WH52) y piedra Koala (GY82). Estética orgánica, serena, terrosa y de alta expedición.',
      image: '/palettes/mockup_monterey_sky.jpg',
      swatches: ['#344A68', '#E6DECE', '#A8A498', '#1E242E', '#FAF8F5']
    },
    {
      id: 'champagne_gold',
      title: 'Oro Champán & Negro Grafito',
      vibe: 'Estilo Four Seasons / Belmond',
      desc: 'Fondo negro grafito cálido (#0D0E12) con detalles en oro champán satinado (#D4AF37, #C5A880) y blanco hueso. Cero colores chillones, ultra sobrio.',
      image: '/palettes/opcion1_oro_champagne.jpg',
      swatches: ['#0D0E12', '#1C1D24', '#C5A880', '#D4AF37', '#FAF7F2']
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#0d0e12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-black text-xl text-white">
                Muestras Visuales de Nuevas Paletas Sobrias
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Eliminamos por completo el azul y verde anterior. Elige la dirección visual que prefieras:
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Options Grid */}
        <div className="p-6 overflow-y-auto grid md:grid-cols-3 gap-6">
          {palettes.map((p) => (
            <div 
              key={p.id}
              className="flex flex-col justify-between bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-amber-400/50 transition-all duration-300 group shadow-xl"
            >
              <div>
                {/* Visual Image Preview */}
                <div className="relative h-48 w-full overflow-hidden bg-black">
                  <img 
                    src={p.image} 
                    alt={p.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/90 block">
                      {p.vibe}
                    </span>
                    <h4 className="font-heading font-black text-lg text-white mt-1 leading-snug">
                      {p.title}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {p.desc}
                  </p>

                  {/* Swatches */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Muestras:</span>
                    <div className="flex items-center gap-1.5">
                      {p.swatches.map((color, idx) => (
                        <span 
                          key={idx} 
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm" 
                          style={{ backgroundColor: color }} 
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => onSelectPalette(p.id)}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-slate-950 font-black text-xs transition-all duration-200 flex items-center justify-center gap-2 border border-white/10 hover:border-amber-400"
                >
                  <Check className="w-4 h-4" />
                  <span>Aplicar {p.title.split(':')[0]}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
