import { supabase, isSupabaseConfigured } from '../db/supabaseClient';
import { db as localDb } from '../db/store';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 INICIANDO MIGRACIÓN DE DATOS LOCALES A SUPABASE');
  console.log('====================================================');

  if (!isSupabaseConfigured() || !supabase) {
    console.error('❌ Error: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están definidas en tu archivo .env');
    console.error('Por favor, agrega tus credenciales de Supabase en .env antes de ejecutar esta migración.');
    process.exit(1);
  }

  try {
    // 1. Migrar Empresas (Companies)
    const companies = localDb.getCompanies();
    console.log(`\n📦 Migrando ${companies.length} empresas...`);
    for (const c of companies) {
      const { error } = await supabase.from('companies').upsert({
        id: c.id,
        name: c.name,
        slug: c.slug,
        logo: c.logo,
        plan: c.plan,
        status: c.status,
        owner_email: c.ownerEmail,
        created_at: c.createdAt || new Date().toISOString(),
      });
      if (error) console.error(`   ⚠️ Error en empresa ${c.name}:`, error.message);
      else console.log(`   ✅ Empresa migrada: ${c.name}`);
    }

    // 2. Migrar Usuarios
    const users = localDb.getUsers();
    console.log(`\n👥 Migrando ${users.length} usuarios...`);
    for (const u of users) {
      const { error } = await supabase.from('users').upsert({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        company_id: u.companyId,
        operator_id: u.operatorId,
        avatar: u.avatar,
      });
      if (error) console.error(`   ⚠️ Error en usuario ${u.name}:`, error.message);
      else console.log(`   ✅ Usuario migrado: ${u.name} (${u.role})`);
    }

    // 3. Migrar Operadores / Guías
    const operators = localDb.getOperators();
    console.log(`\n🧭 Migrando ${operators.length} operarios/guías...`);
    for (const op of operators) {
      const { error } = await supabase.from('operators').upsert({
        id: op.id,
        company_id: op.companyId,
        name: op.name,
        role: op.role,
        phone: op.phone,
        whatsapp_number: op.whatsappNumber || op.phone || '+50765274580',
        avatar: op.avatar,
        active: op.active,
        rating: (op as any).rating || 5.0,
      });
      if (error) console.error(`   ⚠️ Error en operario ${op.name}:`, error.message);
      else console.log(`   ✅ Operador migrado: ${op.name}`);
    }

    // 4. Migrar Tours
    const tours = localDb.getTours();
    console.log(`\n🌄 Migrando ${tours.length} tours del catálogo...`);
    for (const t of tours) {
      const { error } = await supabase.from('tours').upsert({
        id: t.id,
        company_id: t.companyId,
        title: t.title,
        tagline: t.tagline,
        description: t.description,
        destination: t.destination,
        category: t.category,
        price: t.price,
        child_price: t.childPrice,
        duration: t.duration,
        difficulty: t.difficulty,
        max_capacity: t.maxCapacity,
        meeting_point: t.meetingPoint,
        time_slots: t.timeSlots,
        included: t.included,
        not_included: t.notIncluded,
        itinerary: t.itinerary,
        images: t.images,
        rating: t.rating,
        reviews_count: t.reviewsCount,
        featured: t.featured,
        requires_operator_approval: t.requiresOperatorApproval,
      });
      if (error) console.error(`   ⚠️ Error en tour ${t.title}:`, error.message);
      else console.log(`   ✅ Tour migrado: ${t.title}`);
    }

    // 5. Migrar Cupones
    const coupons = localDb.getCoupons();
    console.log(`\n🎟️ Migrando ${coupons.length} cupones de descuento...`);
    for (const c of coupons) {
      const discountPercent = c.discountPercent || (c.discountType === 'percentage' ? c.discountValue : 0);
      const discountAmount = c.discountAmount || (c.discountType === 'fixed' ? c.discountValue : 0);
      const validUntil = (c as any).validUntil || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();

      const { error } = await supabase.from('coupons').upsert({
        id: c.id,
        code: c.code,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        max_uses: (c as any).maxUses || 100,
        current_uses: (c as any).usedCount || c.currentUses || 0,
        valid_until: validUntil,
        active: c.active,
      });
      if (error) console.error(`   ⚠️ Error en cupón ${c.code}:`, error.message);
      else console.log(`   ✅ Cupón migrado: ${c.code}`);
    }

    // 6. Migrar Ajustes Globales
    const settings = localDb.getSettings();
    console.log(`\n⚙️ Migrando configuración del sistema...`);
    const { error: settingsErr } = await supabase.from('settings').upsert({
      id: 'global',
      business_name: settings.businessName,
      legal_name: settings.legalName,
      tax_id: settings.taxId,
      business_email: settings.businessEmail,
      platform_audit_email: settings.platformAuditEmail,
      business_phone: settings.businessPhone,
      business_address: settings.businessAddress,
      currency: settings.currency,
      currency_symbol: settings.currencySymbol,
      tax_rate: settings.taxRate,
      notification_channels: settings.notificationChannels,
      smtp_config: settings.smtpConfig,
      whatsapp_config: settings.whatsappConfig,
      updated_at: new Date().toISOString(),
    });
    if (settingsErr) console.error(`   ⚠️ Error al migrar ajustes:`, settingsErr.message);
    else console.log(`   ✅ Ajustes globales migrados.`);

    console.log('\n====================================================');
    console.log('🎉 ¡MIGRACIÓN A SUPABASE COMPLETADA CON ÉXITO!');
    console.log('====================================================');
  } catch (err: any) {
    console.error('\n❌ Ocurrió un error inesperado durante la migración:', err);
  }
}

runMigration();
