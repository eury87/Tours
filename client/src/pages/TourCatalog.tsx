import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Compass, 
  Sparkles, 
  Shield, 
  Award, 
  Users, 
  Star, 
  Mountain, 
  Trees, 
  UtensilsCrossed, 
  Landmark, 
  Zap, 
  Clock, 
  X, 
  ArrowRight, 
  Play, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  ChevronLeft,
  Headphones, 
  Lock,
  CheckCircle2
} from 'lucide-react';
import { Tour } from '../types';
import { TourCard } from '../components/TourCard';
import { useLanguage } from '../i18n/LanguageContext';
import { getLocalizedCategory, getLocalizedTour } from '../utils/tourTranslations';

interface TourCatalogProps {
  onBookTour: (tour: Tour) => void;
  onViewTourDetails: (tour: Tour) => void;
}

interface CategoryOption {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORY_ITEMS: CategoryOption[] = [
  { name: 'Todos', icon: Compass },
  { name: 'Aventura', icon: Mountain },
  { name: 'Naturaleza', icon: Trees },
  { name: 'Gastronomía', icon: UtensilsCrossed },
  { name: 'Cultural', icon: Landmark },
];

export const TourCatalog: React.FC<TourCatalogProps> = ({ onBookTour, onViewTourDetails }) => {
  const { t, language } = useLanguage();
  const [allTours, setAllTours] = useState<Tour[]>([]);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'instant' | 'approval' | 'top_rated'>('all');
  const [loading, setLoading] = useState(true);

  // Carga inicial de TODOS los tours (el Hero siempre tendrá acceso a todas las rutas)
  useEffect(() => {
    const fetchAllTours = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/tours');
        if (res.ok) {
          const data = await res.json();
          setAllTours(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching tours:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTours();
  }, []);

  // Función para normalizar texto (sin tildes, minúsculas y limpio)
  const normalize = (str?: string) => 
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  // "el search mata filtros": si hay texto de búsqueda, ignora categoría y quickFilter
  const isSearching = searchQuery.trim().length > 0;

  const catalogTours = useMemo(() => {
    let list = [...allTours];

    if (isSearching) {
      const q = normalize(searchQuery);
      return list.filter(t => {
        const enTour = getLocalizedTour(t, 'en');
        const esTour = getLocalizedTour(t, 'es');
        const curTour = getLocalizedTour(t, language);

        const searchableText = [
          t.title, t.destination, t.description, t.tagline, t.category, t.meetingPoint?.name,
          enTour.title, enTour.destination, enTour.description, enTour.tagline, enTour.category, enTour.meetingPoint?.name,
          esTour.title, esTour.destination, esTour.description, esTour.tagline, esTour.category, esTour.meetingPoint?.name,
          curTour.title, curTour.destination, curTour.description, curTour.tagline, curTour.category, curTour.meetingPoint?.name
        ].map(normalize).join(' ');

        return searchableText.includes(q);
      });
    }

    if (selectedCategory !== 'Todos') {
      list = list.filter(t => t.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (quickFilter === 'instant') {
      list = list.filter(t => !t.requiresOperatorApproval);
    } else if (quickFilter === 'approval') {
      list = list.filter(t => t.requiresOperatorApproval);
    } else if (quickFilter === 'top_rated') {
      list = list.filter(t => t.rating >= 4.9);
    }

    return list;
  }, [allTours, searchQuery, isSearching, selectedCategory, quickFilter, language]);

  // Tour activo para el Hero (siempre se extrae de allTours, NUNCA dañado por filtros de abajo)
  const rawActiveTour = allTours[activeTourIndex] || allTours[0];
  const activeTour = rawActiveTour ? getLocalizedTour(rawActiveTour, language) : null;

  // Estado para la animación de expansión física de tarjeta a pantalla completa
  const heroRef = useRef<HTMLDivElement>(null);
  const [displayedBgImage, setDisplayedBgImage] = useState<string>('');
  const [expandingCard, setExpandingCard] = useState<{
    imageUrl: string;
    rect: { top: number; left: number; width: number; height: number };
  } | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  useEffect(() => {
    if (activeTour && !displayedBgImage) {
      setDisplayedBgImage(activeTour.images[0]);
    }
  }, [activeTour, displayedBgImage]);

  const handleSelectTour = (idx: number, e?: React.MouseEvent<HTMLDivElement>) => {
    if (idx === activeTourIndex || !allTours[idx]) return;

    const newTour = allTours[idx];
    const newImg = newTour.images[0];

    if (e && heroRef.current) {
      const cardRect = e.currentTarget.getBoundingClientRect();
      const heroRect = heroRef.current.getBoundingClientRect();

      const startRect = {
        top: cardRect.top - heroRect.top,
        left: cardRect.left - heroRect.left,
        width: cardRect.width,
        height: cardRect.height,
      };

      setExpandingCard({ imageUrl: newImg, rect: startRect });
      setIsExpanding(false);

      // Doble frame para asegurar que se pinte en la tarjeta antes de expandirse
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsExpanding(true);
          setActiveTourIndex(idx);
        });
      });

      // Al completar los 620ms de expansión, fijamos la nueva imagen como fondo base
      setTimeout(() => {
        setDisplayedBgImage(newImg);
        setExpandingCard(null);
        setIsExpanding(false);
      }, 620);
    } else {
      setActiveTourIndex(idx);
      setDisplayedBgImage(newImg);
    }
  };

  const nextTour = () => {
    if (allTours.length > 0) {
      const nextIdx = (activeTourIndex + 1) % allTours.length;
      handleSelectTour(nextIdx);
    }
  };

  const prevTour = () => {
    if (allTours.length > 0) {
      const prevIdx = (activeTourIndex - 1 + allTours.length) % allTours.length;
      handleSelectTour(prevIdx);
    }
  };

  return (
    <div className="pb-28">
      
      {/* ========================================================================= */}
      {/* HERO INTERACTIVO FULL-BLEED: LA IMAGEN VA DE BORDE A BORDE Y TRAS EL NAV  */}
      {/* ========================================================================= */}
      {activeTour && (
        <div 
          ref={heroRef}
          className="relative w-full min-h-[95vh] lg:min-h-screen flex flex-col justify-between pt-24 sm:pt-28 pb-10 overflow-hidden"
        >
          
          {/* Fondo Base Actual */}
          <div 
            className="absolute inset-0 bg-cover bg-center pointer-events-none transition-opacity duration-700"
            style={{ 
              backgroundImage: `url('${displayedBgImage || activeTour.images[0]}')` 
            }}
          />

          {/* Tarjeta en Expansión Física: Nace en la tarjeta del carrusel y se expande hasta llenar el fondo */}
          {expandingCard && (
            <div 
              style={{
                top: isExpanding ? 0 : expandingCard.rect.top,
                left: isExpanding ? 0 : expandingCard.rect.left,
                width: isExpanding ? '100%' : expandingCard.rect.width,
                height: isExpanding ? '100%' : expandingCard.rect.height,
                borderRadius: isExpanding ? '0px' : '1rem',
                backgroundImage: `url('${expandingCard.imageUrl}')`,
                transition: 'all 600ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="absolute bg-cover bg-center pointer-events-none z-1 shadow-2xl"
            />
          )}

          {/* Degradados para asegurar legibilidad estilo Koala & Monterey Sky sin oscurecer el navbar superior */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#141513]/90 via-[#141513]/60 to-transparent pointer-events-none z-2" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141513] via-transparent to-transparent pointer-events-none z-2" />

          {/* Sutil trazado decorativo */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 hidden md:block" viewBox="0 0 1200 600" fill="none">
            <path 
              d="M 500 120 C 620 180, 440 290, 500 330" 
              stroke="white" 
              strokeWidth="2" 
              strokeDasharray="6 6" 
            />
          </svg>

          {/* Pin de ubicación sobre el paisaje */}
          <div className="absolute top-[48%] left-[42%] hidden md:flex items-center justify-center text-[#E8E1D1] pointer-events-none animate-bounce">
            <MapPin className="w-8 h-8 fill-[#E8E1D1] text-[#161715]" />
          </div>

          {/* Contenedor Interior Centrado */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col justify-between relative z-10 my-auto py-4">

            {/* TOP / MAIN GRID: Left Tour Details + Right Quick Booking Card */}
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* LEFT COLUMN: Datos reales del tour activo con animación de maximización */}
              <div key={`hero-left-${activeTour.id}`} className="lg:col-span-7 space-y-6 animate-hero-content">
                
                {/* Categoría y Modalidad */}
                <div className="flex items-center gap-3 flex-wrap">
                <span className="w-6 h-[2px] bg-[#E8E1D1]" />
                <span className="text-[11px] font-black tracking-[0.25em] text-[#E8E1D1] uppercase">
                  EXPERIENCIA • {getLocalizedCategory(activeTour.category, language).toUpperCase()}
                </span>

                {rawActiveTour.requiresOperatorApproval ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Clock className="w-3 h-3" />
                    <span>Aprobación de Guía (0% Cobro Hoy)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span>Confirmación Inmediata</span>
                  </span>
                )}
              </div>

              {/* Título en Playfair Display del Tour Activo */}
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-normal tracking-tight text-white leading-[1.08] drop-shadow-md">
                {activeTour.title}
              </h1>

              {/* Subtítulo / Tagline real */}
              <p className="text-slate-200 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed font-normal">
                {activeTour.tagline}
              </p>

              {/* Specs Rápidos del Tour */}
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <Clock className="w-4 h-4 text-[#E8E1D1]" />
                  <span className="font-bold text-white">{activeTour.duration}</span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <Users className="w-4 h-4 text-[#E8E1D1]" />
                  <span className="font-bold text-white">Hasta {activeTour.maxCapacity} personas</span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <MapPin className="w-4 h-4 text-[#E8E1D1]" />
                  <span className="font-bold text-white">{activeTour.destination}</span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-amber-500/30 text-amber-300 backdrop-blur-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{activeTour.rating.toFixed(2)}</span>
                  <span className="text-slate-400 font-normal">({activeTour.reviewsCount})</span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center flex-wrap gap-4 pt-3">
                <button
                  onClick={() => onBookTour(rawActiveTour)}
                  className="btn-mint px-7 py-3.5 rounded-full font-black text-sm shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                >
                  <span>Reservar Este Tour (${activeTour.price} USD)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Botón Itinerario */}
                <button
                  onClick={() => onViewTourDetails(rawActiveTour)}
                  className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-[#34506D]/35 hover:bg-[#34506D]/60 border border-[#34506D]/50 backdrop-blur-md text-xs font-semibold text-white transition-all group shadow-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#E8E1D1] group-hover:text-slate-950 transition-colors">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="font-bold text-white">Ver Itinerario</div>
                    <div className="text-[10px] text-slate-300 font-normal">Punto de encuentro y extras</div>
                  </div>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Tarjeta Flotante "Reserva Rápida de Servicio" en Monterey Sky con Opacidad */}
            <div key={`hero-right-${activeTour.id}`} className="lg:col-span-5 flex justify-center lg:justify-end animate-hero-content">
              <div className="bg-[#34506D]/35 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-[#34506D]/50 max-w-md w-full shadow-2xl shadow-black/60 text-left space-y-5">
                
                <div className="flex items-center justify-between border-b border-[#34506D]/40 pb-3">
                  <div>
                    <h3 className="font-heading font-black text-xl text-white">Reserva de Servicio</h3>
                    <p className="text-xs text-slate-300 mt-0.5">Disponibilidad oficial & cupos en vivo</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wider block">Tarifa</span>
                    <span className="text-2xl font-black font-heading text-[#E8E1D1]">
                      ${activeTour.price}
                    </span>
                    <span className="text-[10px] text-slate-300"> USD/p</span>
                  </div>
                </div>

                {/* Resumen del Servicio Seleccionado */}
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-2xl bg-[#1E2E3E]/60 border border-[#34506D]/30">
                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">Tour Seleccionado</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Compass className="w-4 h-4 text-[#E8E1D1] shrink-0" />
                      <span className="font-bold text-white truncate">{activeTour.title}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#1E2E3E]/60 border border-[#34506D]/30">
                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">Punto de Salida</span>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-[#E8E1D1] shrink-0" />
                      <span className="font-bold text-white truncate">{activeTour.meetingPoint.name}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-2xl bg-[#1E2E3E]/60 border border-[#34506D]/30">
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">Horarios</span>
                      <div className="flex items-center gap-1.5 mt-1 font-bold text-white">
                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                        <span>{activeTour.timeSlots[0] || '07:30 AM'}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#1E2E3E]/60 border border-[#34506D]/30">
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">Modalidad</span>
                      <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-200">
                        {rawActiveTour.requiresOperatorApproval ? '⏳ Aprobación' : '⚡ Inmediato'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón de Apertura de Reserva */}
                <button
                  onClick={() => onBookTour(rawActiveTour)}
                  className="btn-mint w-full py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>Iniciar Reserva en 5 Pasos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-[11px] text-slate-300 text-center font-medium">
                  {rawActiveTour.requiresOperatorApproval 
                    ? '🛡️ Guía oficial confirma por WhatsApp antes de tu pago.' 
                    : '🛡️ Pago y emisión de voucher QR instantáneo.'}
                </p>

              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM HERO BAR: SELECTOR DE TOURS (CAROUSEL) + 4 SELLOS DE CONFIANZA     */}
          {/* ========================================================================= */}
          <div className="relative z-10 pt-8 mt-10 border-t border-white/10 grid lg:grid-cols-12 gap-6 items-end">
            
            {/* Left: Carrusel de Tours reales de la plataforma */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Nuestras Rutas & Salidas</h4>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Haz clic en un tour para cambiar el fondo y ver sus detalles)
                  </span>
                </div>
                
                {/* Flechas de navegación del carrusel */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={prevTour}
                    className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-white transition-colors"
                    title="Tour anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextTour}
                    className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-white transition-colors"
                    title="Siguiente tour"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Fila horizontal de tarjetas de tours de la empresa */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {allTours.map((tItem, idx) => {
                  const isCurrent = idx === activeTourIndex;
                  return (
                    <div
                      key={tItem.id}
                      onClick={(e) => handleSelectTour(idx, e)}
                      className={`group cursor-pointer relative h-28 rounded-2xl overflow-hidden transition-all duration-500 shadow-lg ${
                        isCurrent 
                          ? 'animate-card-burst border-2 border-[#E8E1D1] ring-4 ring-[#E8E1D1]/40 -translate-y-2 scale-[1.06] z-20 shadow-2xl shadow-[#E8E1D1]/30' 
                          : 'border border-white/10 hover:border-[#E8E1D1]/60 hover:-translate-y-1 hover:scale-105 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={tItem.images[0]} 
                        alt={tItem.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                      
                      {/* Badge Activo */}
                      {isCurrent && (
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-[#E8E1D1] text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
                          Activo
                        </div>
                      )}

                      <div className="absolute bottom-2 inset-x-2 flex items-end justify-between">
                        <div className="min-w-0 pr-1">
                          <h5 className="font-bold text-white text-xs leading-tight truncate">{tItem.title}</h5>
                          <span className="text-[10px] text-[#E8E1D1] font-bold block">${tItem.price} USD</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-[9px] text-amber-300 font-bold bg-slate-950/85 px-1.5 py-0.5 rounded-md backdrop-blur-sm shrink-0">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{tItem.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Cápsula de 4 Garantías */}
            <div className="lg:col-span-5">
              <div className="wanderlust-glass rounded-2xl p-4 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-white/5 mx-auto flex items-center justify-center text-[#E8E1D1]">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-200 leading-tight">Mejor Tarifa Directa</div>
                </div>

                <div className="space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-white/5 mx-auto flex items-center justify-center text-[#E8E1D1]">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-200 leading-tight">Asistencia WhatsApp</div>
                </div>

                <div className="space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-white/5 mx-auto flex items-center justify-center text-[#E8E1D1]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-200 leading-tight">Fechas Flexibles</div>
                </div>

                <div className="space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-white/5 mx-auto flex items-center justify-center text-[#E8E1D1]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-200 leading-tight">Pagos Seguros</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN INFERIOR: ESTADÍSTICAS Y CATÁLOGO EN CONTENEDOR CENTRADO          */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 mt-10">

        {/* BARRA DE ESTADÍSTICAS OFICIALES DE LA AGENCIA */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-white/10 text-center">
        <div>
          <div className="font-heading font-black text-3xl sm:text-4xl text-white">
            {allTours.length > 0 ? `${allTours.length}+` : '4+'}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Rutas Oficiales</div>
        </div>

        <div>
          <div className="font-heading font-black text-3xl sm:text-4xl text-white">10K+</div>
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Aventureros Felices</div>
        </div>

        <div>
          <div className="font-heading font-black text-3xl sm:text-4xl text-white">100%</div>
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Salidas Garantizadas</div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-heading font-black text-3xl sm:text-4xl text-white">4.9</span>
            <div className="flex text-[#E8E1D1] text-sm">
              {'★★★★★'.split('').map((s, i) => (
                <span key={i}>{s}</span>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Calificación Promedio</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRILLA COMPLETA DE TOURS CON FILTROS POR CATEGORÍA                       */}
      {/* ========================================================================= */}
      <div id="catalog-tours-section" className="space-y-8 pt-4">
        
        {/* Encabezado de la Sección */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-[2px] bg-[#E8E1D1]" />
              <span className="text-xs font-black tracking-[0.2em] text-[#E8E1D1] uppercase">TODOS LOS SERVICIOS</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-white mt-1">
              Explora Nuestro Catálogo Completo
            </h2>
          </div>

          {/* Filtros Rápidos */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setQuickFilter(quickFilter === 'instant' ? 'all' : 'instant')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                quickFilter === 'instant'
                  ? 'btn-mint shadow-lg'
                  : 'bg-[#1C1E1B] border border-white/10 text-stone-300 hover:text-white hover:bg-[#232521]'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Confirmación Inmediata</span>
            </button>

            <button
              onClick={() => setQuickFilter(quickFilter === 'approval' ? 'all' : 'approval')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                quickFilter === 'approval'
                  ? 'bg-amber-400 text-slate-950 shadow-lg'
                  : 'bg-[#1C1E1B] border border-white/10 text-stone-300 hover:text-white hover:bg-[#232521]'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Con Aprobación de Guía</span>
            </button>

            <button
              onClick={() => setQuickFilter(quickFilter === 'top_rated' ? 'all' : 'top_rated')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                quickFilter === 'top_rated'
                  ? 'bg-amber-300 text-slate-950 shadow-lg'
                  : 'bg-[#1C1E1B] border border-white/10 text-stone-300 hover:text-white hover:bg-[#232521]'
              }`}
            >
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>Top Valorados</span>
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda Rápida: "el search mata filtros" */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-[#E8E1D1] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por lugar, destino o actividad (ej: Cascadas, Snorkel, Montaña, Selva...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1C1E1B] border border-white/15 focus:border-[#E8E1D1] text-white text-xs rounded-full pl-11 pr-10 py-3 placeholder-stone-400 focus:outline-none transition-colors shadow-lg backdrop-blur-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-[#232521] hover:bg-[#2C2E29] text-stone-300 hover:text-white transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isSearching ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8E1D1]/10 border border-[#E8E1D1]/30 text-xs text-[#E8E1D1] font-bold">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Búsqueda global activa (sobrescribe categorías)</span>
            </div>
          ) : (
            <div className="text-xs text-stone-400 font-bold px-3.5 py-1.5 rounded-full bg-[#1C1E1B] border border-white/10">
              ✨ <span className="text-[#E8E1D1]">{catalogTours.length}</span> {t('experiencesCount')} disponibles
            </div>
          )}
        </div>

        {/* Barra de Categorías */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {CATEGORY_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedCategory === item.name && !isSearching;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    if (isSearching) setSearchQuery('');
                    setSelectedCategory(item.name);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap ${
                    isSelected
                      ? 'btn-mint shadow-lg shadow-[#E8E1D1]/20 scale-105'
                      : 'bg-[#1C1E1B] text-stone-300 hover:text-white hover:bg-[#232521] border border-white/10'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-[#E8E1D1]'}`} />
                  <span>{getLocalizedCategory(item.name, language)}</span>
                </button>
              );
            })}
          </div>

          {isSearching && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#E8E1D1] hover:underline font-bold"
            >
              Restablecer búsqueda por texto
            </button>
          )}
        </div>

        {/* Grilla de Tarjetas Filtradas */}
        {loading ? (
          <div className="text-center py-24 wanderlust-glass rounded-3xl border border-white/10">
            <div className="w-12 h-12 border-4 border-[#E8E1D1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-300 font-medium text-sm">{t('loadingTours')}</p>
          </div>
        ) : catalogTours.length === 0 ? (
          <div className="text-center py-20 wanderlust-glass rounded-3xl p-12 border border-white/10 space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto text-[#E8E1D1]">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-black text-xl text-white">{t('noToursFound')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{t('noToursFoundDesc')}</p>
            <button
              onClick={() => {
                setSelectedCategory('Todos');
                setSearchQuery('');
                setQuickFilter('all');
              }}
              className="btn-mint px-5 py-2.5 rounded-full text-xs font-bold shadow-md"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {catalogTours.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                onBookNow={onBookTour}
                onViewDetails={onViewTourDetails}
              />
            ))}
          </div>
        )}

      </div>

      </div>

    </div>
  );
};
