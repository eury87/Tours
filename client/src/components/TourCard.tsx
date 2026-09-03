import React from 'react';
import { Star, Clock, Users, MapPin, CheckCircle, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { Tour } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getLocalizedTour, getLocalizedCategory } from '../utils/tourTranslations';

interface TourCardProps {
  tour: Tour;
  onBookNow: (tour: Tour) => void;
  onViewDetails: (tour: Tour) => void;
}

export const TourCard: React.FC<TourCardProps> = ({ tour, onBookNow, onViewDetails }) => {
  const { t, language } = useLanguage();
  const localizedTour = getLocalizedTour(tour, language);

  return (
    <div className="group rounded-3xl glass-card overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl relative border border-slate-800/80 hover:border-[#E8E1D1]/40">
      
      {/* Image & Badges */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={localizedTour.images[0]}
          alt={localizedTour.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

        {/* Top Badges Bar */}
        <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between pointer-events-none">
          {/* Category Pill */}
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase bg-slate-950/85 backdrop-blur-md text-[#E8E1D1] border border-[#E8E1D1]/30 shadow-lg">
            {getLocalizedCategory(localizedTour.category, language)}
          </span>

          {/* Rating Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs font-bold shadow-lg">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{localizedTour.rating.toFixed(2)}</span>
            <span className="text-slate-400 text-[10px] font-normal">({localizedTour.reviewsCount})</span>
          </div>
        </div>

        {/* Bottom Destination Tag */}
        <div className="absolute bottom-3 left-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/70 backdrop-blur-md border border-white/10 text-xs text-slate-200 font-medium">
          <MapPin className="w-3.5 h-3.5 text-[#E8E1D1] shrink-0" />
          <span className="truncate max-w-[200px]">{localizedTour.destination}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Modalidad de Confirmación Badge (Top of Content) */}
          <div className="mb-2.5">
            {tour.requiresOperatorApproval ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>⏳ Aprobación de Guía (0% Cobrado Hoy)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#E8E1D1]/10 text-[#E8E1D1] border border-[#E8E1D1]/30">
                <Zap className="w-3.5 h-3.5 text-[#E8E1D1] fill-[#E8E1D1]" />
                <span>Confirmación Inmediata (1-Click)</span>
              </span>
            )}
          </div>

          <h3 className="font-heading font-black text-xl text-white group-hover:text-[#E8E1D1] transition-colors line-clamp-1">
            {localizedTour.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {localizedTour.tagline}
          </p>

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-2 gap-2 my-4 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-[#A8A396] shrink-0" />
              <span className="truncate">{localizedTour.duration}</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <Users className="w-3.5 h-3.5 text-[#A8A396] shrink-0" />
              <span className="truncate">{t('upToCapacity').replace('{count}', localizedTour.maxCapacity.toString())}</span>
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-1.5">
            {localizedTour.included.slice(0, 2).map((inc, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-[#E8E1D1] shrink-0" />
                <span className="truncate">{inc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer & Price */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">{t('fromPrice')}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-heading text-[#E8E1D1]">
                ${localizedTour.price}
              </span>
              <span className="text-xs text-slate-400 font-medium">USD</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewDetails(localizedTour)}
              className="px-3.5 py-2.5 rounded-xl bg-[#34506D]/35 hover:bg-[#34506D]/60 border border-[#34506D]/50 text-[#E8E1D1] hover:text-white transition-all text-xs font-bold"
              title={t('moreInfo')}
            >
              {t('moreInfo')}
            </button>
            <button
              onClick={() => onBookNow(localizedTour)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] font-black text-xs shadow-lg shadow-black/40 hover:shadow-black/60 transition-all active:scale-95"
            >
              <span>{t('bookNow')}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
