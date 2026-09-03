-- ============================================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS PARA SUPABASE (POSTGRESQL)
-- PLATAFORMA DE TOURS, RESERVAS, OPERADORES Y NOTIFICACIONES
-- ============================================================================

-- 1. TABLA: EMPRESAS / AGENCIAS (Multi-Tenant SaaS)
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo TEXT,
    plan TEXT NOT NULL DEFAULT 'Starter', -- Starter, Pro, Enterprise
    status TEXT NOT NULL DEFAULT 'active', -- active, suspended
    owner_email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: USUARIOS DEL SISTEMA
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer', -- superadmin, company_admin, operator, customer
    company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
    operator_id TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: OPERADORES / GUÍAS DE CAMPO
CREATE TABLE IF NOT EXISTS operators (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- Guía Oficial, Conductor Turístico, Especialista Marino
    phone TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    avatar TEXT,
    active BOOLEAN DEFAULT TRUE,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: CATÁLOGO DE TOURS & EXPERIENCIAS
CREATE TABLE IF NOT EXISTS tours (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT NOT NULL,
    destination TEXT NOT NULL,
    category TEXT NOT NULL, -- Aventura, Cultural, Gastronomía, Naturaleza, Playa, Extremo
    price NUMERIC(10, 2) NOT NULL,
    child_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    duration TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'Moderado',
    max_capacity INTEGER NOT NULL DEFAULT 15,
    meeting_point JSONB NOT NULL DEFAULT '{}'::jsonb, -- { name, address, googleMapsUrl, pickupAvailable }
    time_slots JSONB NOT NULL DEFAULT '[]'::jsonb, -- ["07:30 AM", "01:30 PM"]
    included JSONB NOT NULL DEFAULT '[]'::jsonb, -- ["Transporte 4x4", "Guía certificado", ...]
    not_included JSONB NOT NULL DEFAULT '[]'::jsonb,
    itinerary JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ time, title, desc }]
    images JSONB NOT NULL DEFAULT '[]'::jsonb, -- ["https://...", "https://..."]
    rating NUMERIC(3, 2) DEFAULT 4.95,
    reviews_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    requires_operator_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: RESERVAS (BOOKINGS)
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
    tour_id TEXT REFERENCES tours(id) ON DELETE SET NULL,
    tour_title TEXT NOT NULL,
    tour_image TEXT,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    adults_count INTEGER NOT NULL DEFAULT 1,
    children_count INTEGER NOT NULL DEFAULT 0,
    total_passengers INTEGER NOT NULL DEFAULT 1,
    lead_customer JSONB NOT NULL, -- { fullName, email, phone, country, notes }
    passengers JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ fullName, documentType, documentNumber, ageType, specialRequirements }]
    selected_add_ons JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    coupon_code TEXT,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, paid, boarded, cancelled
    payment_method TEXT NOT NULL DEFAULT 'credit_card', -- credit_card, mercadopago, paypal, bank_transfer
    payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, processing, rejected
    payment_details JSONB DEFAULT '{}'::jsonb, -- { transactionId, cardLast4, transferReceiptUrl, paidAt }
    assigned_operator_id TEXT REFERENCES operators(id) ON DELETE SET NULL,
    assigned_operator_name TEXT,
    operator_confirmed BOOLEAN DEFAULT FALSE,
    operator_confirmed_at TIMESTAMPTZ,
    invoice_number TEXT,
    invoice_issued_at TIMESTAMPTZ,
    qr_code_url TEXT,
    check_in_at TIMESTAMPTZ,
    language TEXT DEFAULT 'es',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: MOTOR DE CUPONES DE DESCUENTO
CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    max_uses INTEGER NOT NULL DEFAULT 100,
    current_uses INTEGER NOT NULL DEFAULT 0,
    valid_until TIMESTAMPTZ NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA: HISTORIAL DE NOTIFICACIONES MULTICANAL
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- booking_created, booking_confirmed, booking_paid, operator_assigned, status_changed
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
    booking_code TEXT,
    customer_name TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE
);

-- 8. TABLA: CONFIGURACIÓN GLOBAL DEL SISTEMA (SETTINGS)
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    business_name TEXT NOT NULL,
    legal_name TEXT,
    tax_id TEXT,
    business_email TEXT,
    platform_audit_email TEXT,
    business_phone TEXT,
    business_address TEXT,
    currency TEXT DEFAULT 'USD',
    currency_symbol TEXT DEFAULT '$',
    tax_rate NUMERIC(4, 2) DEFAULT 0.10,
    notification_channels JSONB NOT NULL DEFAULT '{}'::jsonb,
    smtp_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    whatsapp_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLA DE CONTROL DE ARCHIVOS Y RESPALDOS (DUAL-STORAGE CLOUDINARY & LOCAL)
CREATE TABLE IF NOT EXISTS media_assets (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    filename TEXT NOT NULL UNIQUE,
    mime_type TEXT,
    size_bytes BIGINT,
    local_path TEXT NOT NULL,
    cloudinary_url TEXT,
    cloudinary_public_id TEXT,
    backup_status TEXT NOT NULL DEFAULT 'pending', -- pending, backed_up, error
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES DE ALTO RENDIMIENTO
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(code);
CREATE INDEX IF NOT EXISTS idx_bookings_operator ON bookings(assigned_operator_id);
CREATE INDEX IF NOT EXISTS idx_tours_destination ON tours(destination);
CREATE INDEX IF NOT EXISTS idx_tours_category ON tours(category);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_media_filename ON media_assets(filename);
