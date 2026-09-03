export interface Tour {
  id: string;
  companyId?: string;
  title: string;
  tagline: string;
  description: string;
  destination: string;
  category: 'Aventura' | 'Cultural' | 'Gastronomía' | 'Naturaleza' | 'Playa' | 'Extremo';
  price: number;
  childPrice: number;
  duration: string;
  difficulty: 'Fácil' | 'Moderado' | 'Desafiante' | 'Extremo';
  maxCapacity: number;
  meetingPoint: {
    name: string;
    address: string;
    googleMapsUrl: string;
    pickupAvailable: boolean;
  };
  timeSlots: string[];
  included: string[];
  notIncluded: string[];
  itinerary: { time: string; title: string; desc: string }[];
  images: string[];
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  requiresOperatorApproval?: boolean; // true = espera aprobación del guía antes de cobrar; false = pago instantáneo
  availableOperatorIds?: string[]; // IDs de operarios asignados y habilitados para este tour
}

export interface Passenger {
  fullName: string;
  documentType: 'DNI' | 'Pasaporte' | 'Cédula';
  documentNumber: string;
  ageType: 'adult' | 'child';
  specialRequirements?: string;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  selected?: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'paid' | 'boarded' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'processing' | 'rejected';
export type PaymentMethod = 'credit_card' | 'mercadopago' | 'paypal' | 'bank_transfer';

export interface Booking {
  id: string;
  code: string;
  companyId?: string;
  tourId: string;
  tourTitle: string;
  tourImage: string;
  date: string;
  timeSlot: string;
  adultsCount: number;
  childrenCount: number;
  totalPassengers: number;
  leadCustomer: {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    notes?: string;
  };
  passengers: Passenger[];
  selectedAddOns: AddOn[];
  subtotal: number;
  discountAmount?: number;
  couponCode?: string;
  tax: number;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails?: {
    transactionId?: string;
    cardLast4?: string;
    cardBrand?: string;
    transferReceiptUrl?: string;
    paidAt?: string;
  };
  assignedOperatorId?: string;
  assignedOperatorName?: string;
  operatorConfirmed?: boolean;
  operatorConfirmedAt?: string;
  invoiceNumber?: string;
  invoiceIssuedAt?: string;
  createdAt: string;
  updatedAt: string;
  qrCodeUrl?: string;
  checkInAt?: string;
  language?: 'es' | 'en';
}

export type UserRole = 'superadmin' | 'company_admin' | 'operator' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  avatar?: string;
  operatorId?: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  status: 'active' | 'suspended';
  ownerEmail: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // e.g. 15 for 15% or 20 for $20
  minSpend: number;
  maxUses?: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string;
}

export interface Operator {
  id: string;
  companyId?: string;
  name: string;
  email: string;
  phone: string;
  role: 'Guía Principal' | 'Coordinador de Ruta' | 'Conductor Especializado';
  avatar: string;
  languages: string[];
  active: boolean;
}

export interface NotificationItem {
  id: string;
  bookingId: string;
  bookingCode: string;
  channel: 'email' | 'whatsapp' | 'in_app';
  recipientRole: 'owner' | 'operator' | 'customer';
  recipientName: string;
  recipientContact: string;
  title: string;
  message: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  emailPreviewUrl?: string;
  whatsappLink?: string;
}

export interface SystemSettings {
  businessName: string;
  legalName?: string; // Razón Social Oficial
  taxId?: string; // RUC / RFC / Tax ID
  businessEmail: string;
  platformAuditEmail?: string; // Correo de Copia / Auditoría de la Plataforma (CC)
  businessPhone: string;
  businessAddress: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  notificationChannels: {
    emailOwner: boolean;
    emailOperator: boolean;
    emailCustomer: boolean;
    whatsappCustomer: boolean;
    whatsappOperator: boolean;
    inAppSoundAlerts: boolean;
  };
  smtpConfig: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    isSimulated: boolean;
  };
  whatsappConfig: {
    apiUrl: string;
    apiKey: string;
    senderPhone: string;
    isSimulated: boolean;
  };
}
