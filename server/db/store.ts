import fs from 'fs';
import path from 'path';
import { Tour, Booking, Operator, NotificationItem, SystemSettings, Company, User, Coupon } from './schema';

const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

export interface DatabaseState {
  companies: Company[];
  users: User[];
  coupons: Coupon[];
  tours: Tour[];
  bookings: Booking[];
  operators: Operator[];
  notifications: NotificationItem[];
  settings: SystemSettings;
}

const DEFAULT_SETTINGS: SystemSettings = {
  businessName: 'TerraAventura Expeditions & Luxury Tours',
  legalName: 'TerraAventura Operador Turístico Internacional SAC',
  taxId: 'RUC 20608942101',
  businessEmail: 'euryhealer@gmail.com',
  platformAuditEmail: 'euryhealer@gmail.com',
  businessPhone: '+507 6754 6550',
  businessAddress: 'Av. Gran Vía 240, Distrito Turístico Central',
  currency: 'USD',
  currencySymbol: '$',
  taxRate: 0.10,
  notificationChannels: {
    emailOwner: true,
    emailOperator: true,
    emailCustomer: true,
    whatsappCustomer: true,
    whatsappOperator: true,
    inAppSoundAlerts: true,
  },
  smtpConfig: {
    host: 'smtp.resend.com',
    port: 465,
    user: 'resend',
    pass: process.env.RESEND_API_KEY || 're_sample_smtp_pass',
    from: '"TerraAventura Tours" <onboarding@resend.dev>',
    isSimulated: false,
  },
  whatsappConfig: {
    apiUrl: 'https://graph.facebook.com/v19.0/PHONE_NUMBER_ID/messages',
    apiKey: 'WA_TOKEN_PROD_SAMPLE',
    senderPhone: '+50767546550',
    isSimulated: false,
  },
};

const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    name: 'TerraAventura Expeditions',
    slug: 'terra-aventura',
    plan: 'Enterprise',
    status: 'active',
    ownerEmail: 'owner@terraaventura.com',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'comp-2',
    name: 'Andean Secrets Travel',
    slug: 'andean-secrets',
    plan: 'Pro',
    status: 'active',
    ownerEmail: 'admin@andeansecrets.com',
    createdAt: '2026-02-01T12:00:00Z',
  }
];

const INITIAL_USERS: User[] = [
  {
    id: 'usr-superadmin',
    name: 'Alex Rivera (SaaS Owner)',
    email: 'superadmin@tourspro.com',
    role: 'superadmin',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'usr-owner',
    name: 'Lucía Benítez (Dueño Agencia)',
    email: 'owner@terraaventura.com',
    role: 'company_admin',
    companyId: 'comp-1',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'usr-guide-1',
    name: 'Carlos Mendoza (Guía Oficial)',
    email: 'carlos.mendoza@terraaventura.com',
    role: 'operator',
    companyId: 'comp-1',
    operatorId: 'op-1',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'usr-customer',
    name: 'Visitante / Cliente',
    email: 'cliente@ejemplo.com',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  }
];

const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'cpn-1',
    code: 'WELCOME10',
    description: '10% de descuento de bienvenida en tu primera reserva',
    discountType: 'percentage',
    discountValue: 10,
    minSpend: 50,
    usedCount: 14,
    active: true,
  },
  {
    id: 'cpn-2',
    code: 'VIPTOUR25',
    description: '$25 USD de descuento en expediciones seleccionadas',
    discountType: 'fixed',
    discountValue: 25,
    minSpend: 100,
    usedCount: 6,
    active: true,
  },
  {
    id: 'cpn-3',
    code: 'EARLYBIRD',
    description: '15% de descuento por reserva anticipada',
    discountType: 'percentage',
    discountValue: 15,
    minSpend: 70,
    usedCount: 22,
    active: true,
  }
];

const INITIAL_OPERATORS: Operator[] = [
  {
    id: 'op-1',
    companyId: 'comp-1',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@terraaventura.com',
    phone: '+50765274580',
    role: 'Guía Principal',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    languages: ['Español', 'Inglés', 'Portugués'],
    active: true,
  },
  {
    id: 'op-2',
    companyId: 'comp-1',
    name: 'Valeria Quispe',
    email: 'valeria.quispe@terraaventura.com',
    phone: '+50765274580',
    role: 'Coordinador de Ruta',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    languages: ['Español', 'Inglés', 'Francés'],
    active: true,
  },
  {
    id: 'op-3',
    companyId: 'comp-1',
    name: 'Mateo Sandoval',
    email: 'mateo.sandoval@terraaventura.com',
    phone: '+50765274580',
    role: 'Conductor Especializado',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    languages: ['Español', 'Inglés básico'],
    active: true,
  },
];

const INITIAL_TOURS: Tour[] = [
  {
    id: 'tour-1',
    companyId: 'comp-1',
    title: 'Expedición a la Selva Mágica & Cascadas Secretas',
    tagline: 'Aventura 4x4, tirolesa panorámica y baño en aguas cristalinas',
    description: 'Sumérgete en el corazón del bosque tropical con guías botánicos certificados. Descubre senderos vírgenes, cascadas ocultas y degusta un almuerzo campestre con ingredientes autóctonos.',
    destination: 'Parque Nacional Valle Esmeralda',
    category: 'Aventura',
    price: 85,
    childPrice: 55,
    duration: '7 Horas (Día Completo)',
    difficulty: 'Moderado',
    maxCapacity: 14,
    meetingPoint: {
      name: 'Base Aventura TerraAventura - Módulo 3',
      address: 'Km 14 Carretera a los Bosques, Valle Esmeralda',
      googleMapsUrl: 'https://maps.google.com/?q=-13.163141,-72.544963',
      pickupAvailable: true,
    },
    timeSlots: ['07:30 AM', '09:00 AM'],
    included: [
      'Transporte 4x4 ida y vuelta desde el hotel',
      'Guía oficial bilingüe especializado en fauna y flora',
      'Equipo completo de seguridad y tirolesa certificada',
      'Almuerzo buffet campestre gourmet',
      'Snacks energéticos e hidratación ilimitada',
      'Seguro de accidentes contra todo riesgo'
    ],
    notIncluded: [
      'Bebidas alcohólicas premium',
      'Fotografía profesional (disponible como extra)',
      'Propinas para el equipo de ruta'
    ],
    itinerary: [
      { time: '07:30 AM', title: 'Recogida en Hotel', desc: 'Encuentro con el guía y traslado en vehículo 4x4 climatizado.' },
      { time: '09:00 AM', title: 'Senderismo Botánico', desc: 'Caminata guiada identificando aves tropicales y plantas medicinales.' },
      { time: '11:30 AM', title: 'Cascada Cristalina & Tirolesa', desc: 'Tiempo libre para nadar y vuelo panorámico sobre el dosel arbóreo.' },
      { time: '01:30 PM', title: 'Almuerzo Campestre de Autor', desc: 'Banquete de la selva con pesca del día y frutas exóticas.' },
      { time: '03:30 PM', title: 'Retorno a la Ciudad', desc: 'Llegada confortable directo a su alojamiento.' }
    ],
    images: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
    ],
    rating: 4.95,
    reviewsCount: 312,
    featured: true,
    requiresOperatorApproval: true, // Espera confirmación del guía para procesar pago
  },
  {
    id: 'tour-2',
    companyId: 'comp-1',
    title: 'Safari Marino: Ballenas, Delfines & Arrecifes de Coral',
    tagline: 'Navegación en catamarán de lujo con snorkel y barra libre',
    description: 'Navega por las aguas turquesas del santuario marino. Avistamiento de fauna marina en su hábitat natural, snorkel guiado en arrecife de coral vivo y cócteles al atardecer.',
    destination: 'Bahía Esmeralda & Islas de Coral',
    category: 'Naturaleza',
    price: 110,
    childPrice: 70,
    duration: '5 Horas',
    difficulty: 'Fácil',
    maxCapacity: 20,
    meetingPoint: {
      name: 'Marina Real - Muelle Turístico Puerta 4',
      address: 'Malecón Costero 1020, Bahía Azul',
      googleMapsUrl: 'https://maps.google.com/?q=-12.046374,-77.042793',
      pickupAvailable: true,
    },
    timeSlots: ['08:30 AM', '02:00 PM'],
    included: [
      'Paseo en catamarán de lujo de 45 pies',
      'Biólogo marino a bordo y guía en varios idiomas',
      'Equipo completo de snorkel (máscara, aletas y chaleco)',
      'Barra libre nacional de cócteles y bebidas frías',
      'Tabla de quesos, ceviche fresco y frutas',
      'Tasa de ingreso al parque marino'
    ],
    notIncluded: [
      'Toallas de playa personales',
      'Propinas'
    ],
    itinerary: [
      { time: '08:30 AM', title: 'Zarpada y Bienvenida', desc: 'Cóctel de cortesía y charla de seguridad marina.' },
      { time: '09:30 AM', title: 'Zona de Avistamiento de Cetáceos', desc: 'Búsqueda guiada con hidrófono para escuchar cantos marinos.' },
      { time: '11:00 AM', title: 'Snorkel en Arrecife Protegido', desc: 'Inmersión entre peces multicolores y tortugas marinas.' },
      { time: '12:30 PM', title: 'Degustación Gastronómica Marina', desc: 'Ceviche preparado al momento con vista al horizonte.' },
      { time: '01:30 PM', title: 'Regreso al Muelle', desc: 'Fin de la navegación.' }
    ],
    images: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?auto=format&fit=crop&w=1200&q=80'
    ],
    rating: 4.98,
    reviewsCount: 489,
    featured: true,
  },
  {
    id: 'tour-3',
    companyId: 'comp-1',
    title: 'Ruta Culinaria Nocturna & Cata de Vinos y Destilados',
    tagline: '7 paradas gastronómicas secretas, maridaje y música en vivo',
    description: 'Un viaje sensorial por la gastronomía local más galardonada. Recorre tabernas históricas, mercados nocturnos y rooftops exclusivos guiado por un chef sommelier.',
    destination: 'Centro Histórico & Distrito Gourmet',
    category: 'Gastronomía',
    price: 95,
    childPrice: 50,
    duration: '4 Horas',
    difficulty: 'Fácil',
    maxCapacity: 10,
    meetingPoint: {
      name: 'Plaza Mayor - Frente a la Fuente Histórica',
      address: 'Plaza de Armas Central, Casco Antiguo',
      googleMapsUrl: 'https://maps.google.com/?q=-12.046374,-77.042793',
      pickupAvailable: false,
    },
    timeSlots: ['05:30 PM', '07:30 PM'],
    included: [
      'Chef anfitrión y guía sommelier privado',
      'Degustación de 8 platillos insignia en restaurantes premiados',
      'Maridaje con 4 copas de vinos selectos y cata de destilado local',
      'Acceso VIP sin filas a todos los locales',
      'Recetario digital exclusivo al terminar el tour'
    ],
    notIncluded: [
      'Platos a la carta adicionales',
      'Transporte al punto de encuentro'
    ],
    itinerary: [
      { time: '05:30 PM', title: 'Punto de Encuentro y Brindis Inicial', desc: 'Bienvenida con cóctel de autor en taberna de 1920.' },
      { time: '06:15 PM', title: 'Ruta de Tapas y Cocina Tradicional', desc: 'Visita a 3 locales tradicionales con preparación en directo.' },
      { time: '07:45 PM', title: 'Cata a Ciegas con Sommelier', desc: 'Maridaje y aprendizaje sensorial.' },
      { time: '09:00 PM', title: 'Postre de Vanguardia en Rooftop', desc: 'Cierre con vista panorámica iluminada de la ciudad.' }
    ],
    images: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80'
    ],
    rating: 4.92,
    reviewsCount: 215,
    featured: true,
  },
  {
    id: 'tour-4',
    companyId: 'comp-1',
    title: 'Senderismo al Pico del Sol & Observación Astronómica',
    tagline: 'Caminata crepuscular, fogata mística y telescopio profesional',
    description: 'Asciende por encima del mar de nubes para presenciar una puesta de sol inolvidable, seguida de una sesión astronómica guiada con telescopio para ver planetas y constelaciones.',
    destination: 'Mirador Cerro Nevado',
    category: 'Cultural',
    price: 75,
    childPrice: 45,
    duration: '6 Horas',
    difficulty: 'Moderado',
    maxCapacity: 12,
    meetingPoint: {
      name: 'Estación Base Mirador de las Estrellas',
      address: 'Camino a las Cumbres 400',
      googleMapsUrl: 'https://maps.google.com/?q=-13.163141,-72.544963',
      pickupAvailable: true,
    },
    timeSlots: ['03:30 PM'],
    included: [
      'Transporte de montaña 4x4',
      'Guía astronómico y equipo de telescopio motorizado',
      'Bebidas calientes (chocolate artesanal, vino especiado)',
      'Bastones de trekking y linternas frontales rojas'
    ],
    notIncluded: [
      'Ropa de abrigo extrema (abrigos térmicos en alquiler)'
    ],
    itinerary: [
      { time: '03:30 PM', title: 'Subida hacia el Refugio', desc: 'Ascenso en vehículo panorámico.' },
      { time: '05:15 PM', title: 'Puesta de Sol Dorada', desc: 'Fotografía sobre el mar de nubes.' },
      { time: '06:30 PM', title: 'Fogata & Charla Arqueoastronómica', desc: 'Historias ancestrales sobre las estrellas.' },
      { time: '07:30 PM', title: 'Observación de Espacio Profundo', desc: 'Visualización de nebulosas y anillos de Saturno.' },
      { time: '09:30 PM', title: 'Regreso', desc: 'Llegada al punto de origen.' }
    ],
    images: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'
    ],
    rating: 4.89,
    reviewsCount: 178,
    featured: false,
  }
];

class Database {
  private state: DatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          companies: parsed.companies || INITIAL_COMPANIES,
          users: parsed.users || INITIAL_USERS,
          coupons: parsed.coupons || INITIAL_COUPONS,
          tours: parsed.tours || INITIAL_TOURS,
          bookings: parsed.bookings || [],
          operators: parsed.operators || INITIAL_OPERATORS,
          notifications: parsed.notifications || [],
          settings: parsed.settings || DEFAULT_SETTINGS,
        };
      }
    } catch (err) {
      console.warn('Error reading store.json, using defaults', err);
    }

    const initialState: DatabaseState = {
      companies: INITIAL_COMPANIES,
      users: INITIAL_USERS,
      coupons: INITIAL_COUPONS,
      tours: INITIAL_TOURS,
      bookings: [],
      operators: INITIAL_OPERATORS,
      notifications: [],
      settings: DEFAULT_SETTINGS,
    };

    this.save(initialState);
    return initialState;
  }

  private save(state: DatabaseState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving store.json', err);
    }
  }

  // Companies (Tenants)
  public getCompanies(): Company[] {
    return this.state.companies;
  }

  public createCompany(comp: Company): Company {
    this.state.companies.push(comp);
    this.save(this.state);
    return comp;
  }

  // Users & Auth
  public getUsers(): User[] {
    return this.state.users;
  }

  public getUserById(id: string): User | undefined {
    return this.state.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User): User {
    this.state.users.push(user);
    this.save(this.state);
    return user;
  }

  // Coupons
  public getCoupons(): Coupon[] {
    return this.state.coupons;
  }

  public getCouponByCode(code: string): Coupon | undefined {
    return this.state.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.active);
  }

  public createCoupon(coupon: Coupon): Coupon {
    this.state.coupons.push(coupon);
    this.save(this.state);
    return coupon;
  }

  public updateCoupon(id: string, update: Partial<Coupon>): Coupon | null {
    const idx = this.state.coupons.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.state.coupons[idx] = { ...this.state.coupons[idx], ...update };
    this.save(this.state);
    return this.state.coupons[idx];
  }

  public deleteCoupon(id: string): boolean {
    const prevLen = this.state.coupons.length;
    this.state.coupons = this.state.coupons.filter(c => c.id !== id);
    if (this.state.coupons.length !== prevLen) {
      this.save(this.state);
      return true;
    }
    return false;
  }

  // Tours
  public getTours(): Tour[] {
    return this.state.tours;
  }

  public getTourById(id: string): Tour | undefined {
    return this.state.tours.find(t => t.id === id);
  }

  public createTour(tour: Tour): Tour {
    this.state.tours.push(tour);
    this.save(this.state);
    return tour;
  }

  public updateTour(id: string, update: Partial<Tour>): Tour | null {
    const idx = this.state.tours.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.state.tours[idx] = { ...this.state.tours[idx], ...update };
    this.save(this.state);
    return this.state.tours[idx];
  }

  public deleteTour(id: string): boolean {
    const prevLen = this.state.tours.length;
    this.state.tours = this.state.tours.filter(t => t.id !== id);
    if (this.state.tours.length !== prevLen) {
      this.save(this.state);
      return true;
    }
    return false;
  }

  // Bookings
  public getBookings(): Booking[] {
    return this.state.bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getBookingById(id: string): Booking | undefined {
    return this.state.bookings.find(b => b.id === id || b.code === id);
  }

  public createBooking(booking: Booking): Booking {
    this.state.bookings.unshift(booking);
    this.save(this.state);
    return booking;
  }

  public updateBooking(id: string, update: Partial<Booking>): Booking | null {
    const idx = this.state.bookings.findIndex(b => b.id === id || b.code === id);
    if (idx === -1) return null;
    this.state.bookings[idx] = {
      ...this.state.bookings[idx],
      ...update,
      updatedAt: new Date().toISOString()
    };
    this.save(this.state);
    return this.state.bookings[idx];
  }

  public clearBookings(): void {
    this.state.bookings = [];
    this.state.notifications = [];
    this.save(this.state);
  }

  // Operators
  public getOperators(): Operator[] {
    return this.state.operators;
  }

  public getOperatorById(id: string): Operator | undefined {
    return this.state.operators.find(o => o.id === id);
  }

  public addOperator(operator: Operator): Operator {
    this.state.operators.push(operator);
    this.save(this.state);
    return operator;
  }

  public updateOperator(id: string, update: Partial<Operator>): Operator | null {
    const idx = this.state.operators.findIndex(o => o.id === id);
    if (idx === -1) return null;
    this.state.operators[idx] = { ...this.state.operators[idx], ...update };
    this.save(this.state);
    return this.state.operators[idx];
  }

  public deleteOperator(id: string): boolean {
    const prevLen = this.state.operators.length;
    this.state.operators = this.state.operators.filter(o => o.id !== id);
    if (this.state.operators.length !== prevLen) {
      this.save(this.state);
      return true;
    }
    return false;
  }

  // Notifications
  public getNotifications(): NotificationItem[] {
    return this.state.notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addNotification(item: NotificationItem): NotificationItem {
    this.state.notifications.unshift(item);
    if (this.state.notifications.length > 100) {
      this.state.notifications = this.state.notifications.slice(0, 100);
    }
    this.save(this.state);
    return item;
  }

  // Settings
  public getSettings(): SystemSettings {
    return this.state.settings;
  }

  public updateSettings(newSettings: Partial<SystemSettings>): SystemSettings {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.save(this.state);
    return this.state.settings;
  }
}

export const db = new Database();
