import { Tour } from '../types';
import { Language } from '../i18n/translations';

const TOUR_TRANSLATIONS_EN: Record<string, Partial<Tour>> = {
  'tour-1': {
    title: 'Magical Rainforest & Secret Waterfalls Expedition',
    tagline: '4x4 Adventure, Panoramic Zipline & Swimming in Crystal Waters',
    description: 'Immerse yourself in the heart of the tropical forest with certified botanical guides. Discover pristine trails, hidden waterfalls, and enjoy a gourmet countryside lunch with native ingredients.',
    destination: 'Emerald Valley National Park',
    duration: '7 Hours (Full Day)',
    difficulty: 'Moderado', // will be formatted
    included: [
      'Round-trip 4x4 transport from hotel',
      'Official bilingual guide specialized in flora & fauna',
      'Full safety gear and certified zipline',
      'Gourmet countryside buffet lunch',
      'Energy snacks and unlimited hydration',
      'Comprehensive accident insurance'
    ],
    notIncluded: [
      'Premium alcoholic beverages',
      'Professional photography (available as add-on)',
      'Tips for the route team'
    ],
    itinerary: [
      { time: '07:30 AM', title: 'Hotel Pickup', desc: 'Meet your guide and transfer in an air-conditioned 4x4 vehicle.' },
      { time: '09:00 AM', title: 'Botanical Trekking', desc: 'Guided walk identifying tropical birds and medicinal plants.' },
      { time: '11:30 AM', title: 'Crystal Waterfall & Zipline', desc: 'Free time to swim and flight over the forest canopy.' },
      { time: '01:30 PM', title: 'Signature Country Lunch', desc: 'Rainforest banquet with fresh catch and exotic fruits.' },
      { time: '03:30 PM', title: 'Return to City', desc: 'Comfortable arrival back at your accommodation.' }
    ]
  },
  'tour-2': {
    title: 'Marine Safari: Whales, Dolphins & Coral Reefs',
    tagline: 'Luxury Catamaran Sailing with Snorkeling and Open Bar',
    description: 'Sail through turquoise waters in the marine sanctuary. Wildlife watching in natural habitats, guided snorkeling in living coral reefs, and sunset cocktails.',
    destination: 'Emerald Bay & Coral Islands',
    duration: '5 Hours',
    included: [
      '45-foot luxury catamaran cruise',
      'Onboard marine biologist and multilingual guide',
      'Full snorkeling equipment (mask, fins, life vest)',
      'Open bar with national cocktails and cold beverages',
      'Cheese board, fresh ceviche, and fruits',
      'Marine park entrance fee'
    ],
    notIncluded: [
      'Personal beach towels',
      'Tips and gratuities'
    ],
    itinerary: [
      { time: '08:30 AM', title: 'Boarding & Welcome', desc: 'Complimentary welcome cocktail and marine safety briefing.' },
      { time: '09:30 AM', title: 'Cetacean Watching Area', desc: 'Guided search using hydrophones to listen to marine songs.' },
      { time: '11:00 AM', title: 'Snorkeling in Protected Reef', desc: 'Immersion among multicolor fish and sea turtles.' },
      { time: '12:30 PM', title: 'Marine Gastronomy Tasting', desc: 'Fresh ceviche prepared on the spot with ocean views.' },
      { time: '01:30 PM', title: 'Return to Pier', desc: 'End of sailing excursion.' }
    ]
  },
  'tour-3': {
    title: 'Night Culinary Route & Wine and Spirits Tasting',
    tagline: '7 secret gourmet stops, pairings, and live acoustic music',
    description: 'A sensory journey through the most awarded local cuisine. Visit historic taverns, night markets, and exclusive rooftops guided by an executive chef sommelier.',
    destination: 'Historic Downtown & Gourmet District',
    duration: '4 Hours',
    included: [
      'Executive chef host and private sommelier guide',
      'Tasting of 8 signature dishes in top-tier venues',
      'Pairing with 4 select wines and craft spirit tasting',
      'VIP skip-the-line access to all stops',
      'Exclusive digital recipe book upon tour completion'
    ],
    notIncluded: [
      'Extra a la carte dishes',
      'Transport to the initial meeting point'
    ],
    itinerary: [
      { time: '05:30 PM', title: 'Meeting Point & Welcome Toast', desc: 'Welcome cocktail in a 1920s historic tavern.' },
      { time: '06:15 PM', title: 'Tapas & Traditional Cuisine Route', desc: 'Visit 3 traditional restaurants with live prep.' },
      { time: '07:45 PM', title: 'Blind Tasting with Sommelier', desc: 'Sensory wine and spirit pairings.' },
      { time: '09:00 PM', title: 'Rooftop Avant-garde Dessert', desc: 'Closure with illuminated panoramic city views.' }
    ]
  },
  'tour-4': {
    title: 'Sun Peak Sunset Trek & Deep Space Astronomy',
    tagline: 'Twilight hiking, mystical bonfire, and professional telescope',
    description: 'Ascend above the sea of clouds to witness an unforgettable golden sunset, followed by a guided deep-sky astronomical session with high-power telescopes.',
    destination: 'Snowy Peak Viewpoint',
    duration: '6 Hours',
    included: [
      '4x4 mountain transportation',
      'Astronomical guide and motorized telescope equipment',
      'Hot artisan drinks (hot chocolate, spiced wine)',
      'Trekking poles and red headlamps'
    ],
    notIncluded: [
      'Extreme winter clothing (thermal jackets available for rent)'
    ],
    itinerary: [
      { time: '03:30 PM', title: 'Ascent to Mountain Shelter', desc: 'Panoramic mountain vehicle ride.' },
      { time: '05:15 PM', title: 'Golden Sunset', desc: 'Photography above the sea of clouds.' },
      { time: '06:30 PM', title: 'Bonfire & Archaeoastronomy Talk', desc: 'Ancient celestial stories around the fire.' },
      { time: '07:30 PM', title: 'Deep Space Observation', desc: 'View nebulae, star clusters, and Saturn rings.' },
      { time: '09:30 PM', title: 'Return', desc: 'Arrival at origin meeting point.' }
    ]
  }
};

export function getLocalizedTour(tour: Tour, lang: Language): Tour {
  if (lang === 'es') return tour;

  const translation = TOUR_TRANSLATIONS_EN[tour.id];
  if (!translation) return tour;

  return {
    ...tour,
    title: translation.title || tour.title,
    tagline: translation.tagline || tour.tagline,
    description: translation.description || tour.description,
    destination: translation.destination || tour.destination,
    duration: translation.duration || tour.duration,
    included: translation.included || tour.included,
    notIncluded: translation.notIncluded || tour.notIncluded,
    itinerary: translation.itinerary || tour.itinerary,
  };
}

export function getLocalizedCategory(cat: string, lang: Language): string {
  if (lang === 'es') return cat;
  switch (cat.toLowerCase()) {
    case 'todos': return 'All';
    case 'aventura': return 'Adventure';
    case 'naturaleza': return 'Nature';
    case 'gastronomía': return 'Gastronomy';
    case 'cultural': return 'Cultural';
    case 'playa': return 'Beach';
    case 'extremo': return 'Extreme';
    default: return cat;
  }
}

export function getLocalizedDifficulty(diff: string, lang: Language): string {
  if (lang === 'es') return diff;
  switch (diff.toLowerCase()) {
    case 'fácil': return 'Easy';
    case 'moderado': return 'Moderate';
    case 'desafiante': return 'Challenging';
    case 'extremo': return 'Extreme';
    default: return diff;
  }
}
