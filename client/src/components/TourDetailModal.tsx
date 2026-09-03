import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Star, 
  Check, 
  X as CrossIcon, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Tour } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getLocalizedTour, getLocalizedCategory, getLocalizedDifficulty } from '../utils/tourTranslations';

interface TourDetailModalProps {
  tour: Tour | null;
  onClose: () => void;
  onBookNow: (tour: Tour) => void;
}

export const TourDetailModal: React.FC<TourDetailModalProps> = ({ tour, onClose, onBookNow }) => {
  const { t, language } = useLanguage();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!tour) return null;
  const localizedTour = getLocalizedTour(tour, language);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header with image */}
        <div className="relative h-72 md:h-80 shrink-0">
          <img
            src={localizedTour.images[activeImageIndex]}
            alt={localizedTour.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white backdrop-blur-md border border-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image thumbnails */}
          <div className="absolute bottom-4 left-6 flex items-center gap-2">
            {localizedTour.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                  activeImageIndex === idx ? 'border-[#E8E1D1] scale-105' : 'border-white/30 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <div className="absolute top-4 left-6">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#E8E1D1] text-[#152230] shadow-lg">
              {getLocalizedCategory(localizedTour.category, language)}
            </span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          
          <div>
            <h2 className="font-heading font-black text-2xl md:text-3xl text-white">{localizedTour.title}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5">
              <MapPin className="w-4 h-4 text-[#E8E1D1]" />
              <span>{localizedTour.destination}</span>
            </div>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">{localizedTour.description}</p>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">{t('durationLabel')}</div>
              <div className="font-heading font-bold text-white text-base mt-0.5">{localizedTour.duration}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">{t('difficultyLabel')}</div>
              <div className="font-heading font-bold text-[#E8E1D1] text-base mt-0.5">
                {getLocalizedDifficulty(localizedTour.difficulty, language)}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">{t('maxCapacityLabel')}</div>
              <div className="font-heading font-bold text-white text-base mt-0.5">{localizedTour.maxCapacity} {t('passengerCount')}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">{t('ratingLabel')}</div>
              <div className="font-heading font-bold text-amber-400 text-base mt-0.5 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{localizedTour.rating}</span>
                <span className="text-xs text-slate-500 font-normal">({localizedTour.reviewsCount})</span>
              </div>
            </div>
          </div>

          {/* Itinerary Timeline */}
          <div>
            <h4 className="font-heading font-bold text-lg text-white mb-4">{t('itineraryTitle')}</h4>
            <div className="space-y-4 border-l-2 border-[#E8E1D1]/30 pl-4 ml-2">
              {localizedTour.itinerary.map((item, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#E8E1D1] ring-4 ring-slate-900" />
                  <span className="text-xs font-mono font-bold text-[#E8E1D1]">{item.time}</span>
                  <h5 className="font-heading font-bold text-white text-sm mt-0.5">{item.title}</h5>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Inclusions & Exclusions */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-black/40 border border-white/10">
              <h4 className="font-heading font-bold text-[#E8E1D1] text-sm mb-3 flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{t('includedTitle')}</span>
              </h4>
              <ul className="space-y-2">
                {localizedTour.included.map((inc, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-200">
                    <Check className="w-3.5 h-3.5 text-[#E8E1D1] shrink-0 mt-0.5" />
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/10">
              <h4 className="font-heading font-bold text-rose-400 text-sm mb-3 flex items-center gap-2">
                <CrossIcon className="w-4 h-4" />
                <span>{t('notIncludedTitle')}</span>
              </h4>
              <ul className="space-y-2">
                {localizedTour.notIncluded.map((notInc, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <CrossIcon className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{notInc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Meeting Point */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">{t('meetingPointTitle')}</span>
              <h5 className="font-heading font-bold text-white text-sm">{localizedTour.meetingPoint.name}</h5>
              <p className="text-xs text-slate-400 mt-0.5">{localizedTour.meetingPoint.address}</p>
            </div>
            <a
              href={localizedTour.meetingPoint.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#E8E1D1] text-xs font-semibold shrink-0"
            >
              <span>{t('viewInMaps')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 bg-[#161715] flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400">{t('adultPriceLabel')}</span>
            <div className="font-heading font-extrabold text-2xl text-white">
              ${localizedTour.price} <span className="text-xs font-normal text-slate-400">{t('perPerson')}</span>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              onBookNow(localizedTour);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] font-black text-sm shadow-xl shadow-black/40 transition-all hover:scale-105 active:scale-95"
          >
            <span>{t('bookNowModalBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
