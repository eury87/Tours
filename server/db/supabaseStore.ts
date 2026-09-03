import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Company, User, Tour, Booking, Operator, Coupon, NotificationItem, SystemSettings } from './schema';
import { db as localDb } from './store';

/**
 * Adaptador de almacenamiento que interactúa con Supabase (PostgreSQL)
 * y mantiene sincronizada la memoria/fallback local.
 */
export class SupabaseStore {
  
  // ==========================================
  // EMPRESAS (COMPANIES)
  // ==========================================
  public async getCompanies(): Promise<Company[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return localDb.getCompanies();
    }
    const { data, error } = await supabase.from('companies').select('*');
    if (error || !data) {
      console.warn(`[Supabase] Fallo al consultar companies, usando local:`, error?.message);
      return localDb.getCompanies();
    }
    return data.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      logo: r.logo,
      plan: r.plan,
      status: r.status,
      ownerEmail: r.owner_email,
      createdAt: r.created_at,
    }));
  }

  public async addCompany(company: Company): Promise<Company> {
    localDb.addCompany(company);
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('companies').upsert({
        id: company.id,
        name: company.name,
        slug: company.slug,
        logo: company.logo,
        plan: company.plan,
        status: company.status,
        owner_email: company.ownerEmail,
        created_at: company.createdAt || new Date().toISOString(),
      });
      if (error) console.error(`[Supabase] Error al guardar empresa:`, error.message);
    }
    return company;
  }

  // ==========================================
  // TOURS
  // ==========================================
  public async getTours(): Promise<Tour[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return localDb.getTours();
    }
    const { data, error } = await supabase.from('tours').select('*');
    if (error || !data) {
      console.warn(`[Supabase] Fallo al consultar tours, usando local:`, error?.message);
      return localDb.getTours();
    }
    return data.map(r => ({
      id: r.id,
      companyId: r.company_id,
      title: r.title,
      tagline: r.tagline,
      description: r.description,
      destination: r.destination,
      category: r.category,
      price: Number(r.price),
      childPrice: Number(r.child_price || 0),
      duration: r.duration,
      difficulty: r.difficulty,
      maxCapacity: r.max_capacity,
      meetingPoint: r.meeting_point,
      timeSlots: r.time_slots,
      included: r.included,
      notIncluded: r.not_included,
      itinerary: r.itinerary,
      images: r.images,
      rating: Number(r.rating || 5),
      reviewsCount: r.reviews_count || 0,
      featured: r.featured,
      requiresOperatorApproval: r.requires_operator_approval,
    }));
  }

  public async getTourById(id: string): Promise<Tour | undefined> {
    const tours = await this.getTours();
    return tours.find(t => t.id === id);
  }

  public async createTour(tour: Tour): Promise<Tour> {
    localDb.addTour(tour);
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('tours').upsert({
        id: tour.id,
        company_id: tour.companyId,
        title: tour.title,
        tagline: tour.tagline,
        description: tour.description,
        destination: tour.destination,
        category: tour.category,
        price: tour.price,
        child_price: tour.childPrice,
        duration: tour.duration,
        difficulty: tour.difficulty,
        max_capacity: tour.maxCapacity,
        meeting_point: tour.meetingPoint,
        time_slots: tour.timeSlots,
        included: tour.included,
        not_included: tour.notIncluded,
        itinerary: tour.itinerary,
        images: tour.images,
        rating: tour.rating,
        reviews_count: tour.reviewsCount,
        featured: tour.featured,
        requires_operator_approval: tour.requiresOperatorApproval,
      });
      if (error) console.error(`[Supabase] Error al crear tour:`, error.message);
    }
    return tour;
  }

  // ==========================================
  // RESERVAS (BOOKINGS)
  // ==========================================
  public async getBookings(): Promise<Booking[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return localDb.getBookings();
    }
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (error || !data) {
      console.warn(`[Supabase] Fallo al consultar reservas, usando local:`, error?.message);
      return localDb.getBookings();
    }
    return data.map(r => ({
      id: r.id,
      code: r.code,
      companyId: r.company_id,
      tourId: r.tour_id,
      tourTitle: r.tour_title,
      tourImage: r.tour_image,
      date: r.date,
      timeSlot: r.time_slot,
      adultsCount: r.adults_count,
      childrenCount: r.children_count,
      totalPassengers: r.total_passengers,
      leadCustomer: r.lead_customer,
      passengers: r.passengers,
      selectedAddOns: r.selected_add_ons,
      subtotal: Number(r.subtotal),
      discountAmount: Number(r.discount_amount || 0),
      couponCode: r.coupon_code,
      tax: Number(r.tax),
      totalAmount: Number(r.total_amount),
      currency: r.currency,
      status: r.status,
      paymentMethod: r.payment_method,
      paymentStatus: r.payment_status,
      paymentDetails: r.payment_details,
      assignedOperatorId: r.assigned_operator_id,
      assignedOperatorName: r.assigned_operator_name,
      operatorConfirmed: r.operator_confirmed,
      operatorConfirmedAt: r.operator_confirmed_at,
      invoiceNumber: r.invoice_number,
      invoiceIssuedAt: r.invoice_issued_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      qrCodeUrl: r.qr_code_url,
      checkInAt: r.check_in_at,
      language: r.language,
    }));
  }

  public async getBookingById(id: string): Promise<Booking | undefined> {
    if (!isSupabaseConfigured() || !supabase) {
      return localDb.getBookingById(id);
    }
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .or(`id.eq.${id},code.eq.${id}`)
      .limit(1)
      .single();

    if (error || !data) {
      return localDb.getBookingById(id);
    }
    const r = data;
    return {
      id: r.id,
      code: r.code,
      companyId: r.company_id,
      tourId: r.tour_id,
      tourTitle: r.tour_title,
      tourImage: r.tour_image,
      date: r.date,
      timeSlot: r.time_slot,
      adultsCount: r.adults_count,
      childrenCount: r.children_count,
      totalPassengers: r.total_passengers,
      leadCustomer: r.lead_customer,
      passengers: r.passengers,
      selectedAddOns: r.selected_add_ons,
      subtotal: Number(r.subtotal),
      discountAmount: Number(r.discount_amount || 0),
      couponCode: r.coupon_code,
      tax: Number(r.tax),
      totalAmount: Number(r.total_amount),
      currency: r.currency,
      status: r.status,
      paymentMethod: r.payment_method,
      paymentStatus: r.payment_status,
      paymentDetails: r.payment_details,
      assignedOperatorId: r.assigned_operator_id,
      assignedOperatorName: r.assigned_operator_name,
      operatorConfirmed: r.operator_confirmed,
      operatorConfirmedAt: r.operator_confirmed_at,
      invoiceNumber: r.invoice_number,
      invoiceIssuedAt: r.invoice_issued_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      qrCodeUrl: r.qr_code_url,
      checkInAt: r.check_in_at,
      language: r.language,
    };
  }

  public async createBooking(booking: Booking): Promise<Booking> {
    localDb.createBooking(booking);
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('bookings').insert({
        id: booking.id,
        code: booking.code,
        company_id: booking.companyId,
        tour_id: booking.tourId,
        tour_title: booking.tourTitle,
        tour_image: booking.tourImage,
        date: booking.date,
        time_slot: booking.timeSlot,
        adults_count: booking.adultsCount,
        children_count: booking.childrenCount,
        total_passengers: booking.totalPassengers,
        lead_customer: booking.leadCustomer,
        passengers: booking.passengers,
        selected_add_ons: booking.selectedAddOns,
        subtotal: booking.subtotal,
        discount_amount: booking.discountAmount,
        coupon_code: booking.couponCode,
        tax: booking.tax,
        total_amount: booking.totalAmount,
        currency: booking.currency,
        status: booking.status,
        payment_method: booking.paymentMethod,
        payment_status: booking.paymentStatus,
        payment_details: booking.paymentDetails,
        assigned_operator_id: booking.assignedOperatorId,
        assigned_operator_name: booking.assignedOperatorName,
        operator_confirmed: booking.operatorConfirmed,
        operator_confirmed_at: booking.operatorConfirmedAt,
        invoice_number: booking.invoiceNumber,
        invoice_issued_at: booking.invoiceIssuedAt,
        qr_code_url: booking.qrCodeUrl,
        check_in_at: booking.checkInAt,
        language: booking.language,
        created_at: booking.createdAt,
        updated_at: booking.updatedAt,
      });
      if (error) console.error(`[Supabase] Error al crear reserva en DB:`, error.message);
    }
    return booking;
  }

  public async updateBooking(id: string, update: Partial<Booking>): Promise<Booking | null> {
    const updatedLocal = localDb.updateBooking(id, update);
    if (isSupabaseConfigured() && supabase && updatedLocal) {
      const dbPayload: any = { updated_at: new Date().toISOString() };
      if (update.status) dbPayload.status = update.status;
      if (update.paymentStatus) dbPayload.payment_status = update.paymentStatus;
      if (update.paymentDetails) dbPayload.payment_details = update.paymentDetails;
      if (update.assignedOperatorId) dbPayload.assigned_operator_id = update.assignedOperatorId;
      if (update.assignedOperatorName) dbPayload.assigned_operator_name = update.assignedOperatorName;
      if (update.operatorConfirmed !== undefined) dbPayload.operator_confirmed = update.operatorConfirmed;
      if (update.operatorConfirmedAt) dbPayload.operator_confirmed_at = update.operatorConfirmedAt;
      if (update.checkInAt) dbPayload.check_in_at = update.checkInAt;

      const { error } = await supabase
        .from('bookings')
        .update(dbPayload)
        .or(`id.eq.${id},code.eq.${id}`);

      if (error) console.error(`[Supabase] Error actualizando reserva:`, error.message);
    }
    return updatedLocal;
  }

  // ==========================================
  // OPERADORES / GUÍAS
  // ==========================================
  public async getOperators(): Promise<Operator[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return localDb.getOperators();
    }
    const { data, error } = await supabase.from('operators').select('*');
    if (error || !data) {
      return localDb.getOperators();
    }
    return data.map(r => ({
      id: r.id,
      companyId: r.company_id,
      name: r.name,
      role: r.role,
      phone: r.phone,
      whatsappNumber: r.whatsapp_number,
      avatar: r.avatar,
      active: r.active,
      rating: Number(r.rating || 5),
    }));
  }

  // ==========================================
  // CUPONES
  // ==========================================
  public async getCoupons(): Promise<Coupon[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return localDb.getCoupons();
    }
    const { data, error } = await supabase.from('coupons').select('*');
    if (error || !data) {
      return localDb.getCoupons();
    }
    return data.map(r => ({
      id: r.id,
      code: r.code,
      discountPercent: r.discount_percent,
      discountAmount: Number(r.discount_amount || 0),
      maxUses: r.max_uses,
      currentUses: r.current_uses,
      validUntil: r.valid_until,
      active: r.active,
    }));
  }

  // ==========================================
  // NOTIFICACIONES
  // ==========================================
  public async getNotifications(): Promise<NotificationItem[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return localDb.getNotifications();
    }
    const { data, error } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false }).limit(50);
    if (error || !data) {
      return localDb.getNotifications();
    }
    return data.map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message,
      bookingId: r.booking_id,
      bookingCode: r.booking_code,
      customerName: r.customer_name,
      timestamp: r.timestamp,
      read: r.read,
    }));
  }

  public async addNotification(item: NotificationItem): Promise<NotificationItem> {
    localDb.addNotification(item);
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('notifications').insert({
        id: item.id,
        type: item.type,
        title: item.title,
        message: item.message,
        booking_id: item.bookingId,
        booking_code: item.bookingCode,
        customer_name: item.customerName,
        timestamp: item.timestamp,
        read: item.read,
      });
      if (error) console.error(`[Supabase] Error guardando notificación:`, error.message);
    }
    return item;
  }

  // ==========================================
  // AJUSTES DEL SISTEMA
  // ==========================================
  public async getSettings(): Promise<SystemSettings> {
    if (!isSupabaseConfigured() || !supabase) {
      return localDb.getSettings();
    }
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').single();
    if (error || !data) {
      return localDb.getSettings();
    }
    return {
      businessName: data.business_name,
      legalName: data.legal_name,
      taxId: data.tax_id,
      businessEmail: data.business_email,
      platformAuditEmail: data.platform_audit_email,
      businessPhone: data.business_phone,
      businessAddress: data.business_address,
      currency: data.currency,
      currencySymbol: data.currency_symbol,
      taxRate: Number(data.tax_rate),
      notificationChannels: data.notification_channels,
      smtpConfig: data.smtp_config,
      whatsappConfig: data.whatsapp_config,
    };
  }
}

export const supabaseDb = new SupabaseStore();
