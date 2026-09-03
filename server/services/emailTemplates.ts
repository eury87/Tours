import { Booking, Tour, Operator, SystemSettings } from '../db/schema';

export function getCustomerConfirmationEmailHtml(
  booking: Booking,
  tour: Tour,
  operator: Operator | undefined,
  settings: SystemSettings
): string {
  const isPaid = booking.paymentStatus === 'completed';
  const statusColor = isPaid ? '#10b981' : '#f59e0b';
  const statusText = isPaid ? 'PAGADO & CONFIRMADO' : 'PENDIENTE DE PAGO';
  const invoiceNum = booking.invoiceNumber || `FACT-2026-${booking.code.replace('TOUR-2026-', '')}`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación & Factura - ${booking.code}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #334155; margin: 0; padding: 20px; }
    .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0d9488 100%); color: #ffffff; padding: 36px 30px; text-align: center; }
    .badge { display: inline-block; padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; background-color: ${statusColor}; color: #ffffff; margin-top: 12px; }
    .content { padding: 32px 30px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 4px; }
    .value { font-size: 15px; font-weight: 600; color: #0f172a; }
    .invoice-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    .invoice-table th { background: #e2e8f0; text-align: left; padding: 8px 12px; color: #475569; font-weight: 600; }
    .invoice-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .qr-box { text-align: center; padding: 24px; background: #ecfdf5; border: 2px dashed #10b981; border-radius: 12px; margin: 24px 0; }
    .btn { display: inline-block; padding: 14px 28px; background: #0d9488; color: #ffffff !important; text-decoration: none; font-weight: 700; border-radius: 10px; font-size: 15px; margin: 8px 4px; }
    .btn-whatsapp { background: #25D366; }
    .footer { background: #f1f5f9; padding: 24px 30px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase; color: #5eead4;">${settings.businessName}</h2>
      <h1 style="margin: 8px 0 0 0; font-size: 24px; color: #ffffff;">Confirmación de Reserva & Factura Comercial</h1>
      <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">Reserva: <strong>${booking.code}</strong> | Factura: <strong>${invoiceNum}</strong></p>
      <div class="badge">${statusText}</div>
    </div>

    <div class="content">
      <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-top: 0;">
        Estimado(a) <strong>${booking.leadCustomer.fullName}</strong>, gracias por tu compra. Adjuntamos los detalles del itinerario, tu pase de abordaje con código QR y la factura oficial de tu servicio.
      </p>

      {/* FACTURA FISCAL COMERCIAL */}
      <div class="card" style="border: 1px solid #cbd5e1; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 12px;">
          <div>
            <div style="font-size: 12px; font-weight: bold; color: #0f172a;">${settings.legalName || settings.businessName}</div>
            <div style="font-size: 11px; color: #64748b;">${settings.taxId || 'RUC 20608942101'} | ${settings.businessAddress}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 14px; font-weight: bold; color: #0d9488;">FACTURA ELECTRÓNICA</div>
            <div style="font-size: 12px; font-family: monospace; font-weight: bold; color: #0f172a;">${invoiceNum}</div>
            <div style="font-size: 11px; color: #64748b;">Fecha: ${new Date(booking.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div style="font-size: 12px; margin-bottom: 14px; background: #f8fafc; padding: 10px; border-radius: 8px;">
          <div><strong>Cliente / Titular:</strong> ${booking.leadCustomer.fullName}</div>
          <div><strong>Email / Teléfono:</strong> ${booking.leadCustomer.email} | ${booking.leadCustomer.phone}</div>
          <div><strong>Método de Pago:</strong> ${booking.paymentMethod.toUpperCase()} ${booking.paymentDetails?.transactionId ? `(Transacción: ${booking.paymentDetails.transactionId})` : ''}</div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th style="text-align: center;">Cant.</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${tour.title}</strong> (Salida: ${booking.date} - ${booking.timeSlot})</td>
              <td style="text-align: center;">${booking.totalPassengers}</td>
              <td style="text-align: right;">$${((booking.adultsCount * tour.price) + (booking.childrenCount * tour.childPrice)).toFixed(2)}</td>
            </tr>
            ${booking.selectedAddOns.map(a => `
              <tr>
                <td>+ ${a.name}</td>
                <td style="text-align: center;">1</td>
                <td style="text-align: right;">$${a.price.toFixed(2)}</td>
              </tr>
            `).join('')}
            ${booking.couponCode ? `
              <tr style="color: #10b981; font-weight: bold;">
                <td>🎟️ Cupón de Descuento Promocional (${booking.couponCode})</td>
                <td style="text-align: center;">1</td>
                <td style="text-align: right;">-$${(booking.discountAmount || 0).toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr>
              <td colspan="2" style="text-align: right; font-weight: bold; border-top: 2px solid #e2e8f0;">Base Imponible:</td>
              <td style="text-align: right; font-weight: bold; border-top: 2px solid #e2e8f0;">$${booking.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="2" style="text-align: right; color: #64748b;">Impuestos (10%):</td>
              <td style="text-align: right; color: #64748b;">$${booking.tax.toFixed(2)}</td>
            </tr>
            <tr style="font-size: 15px; color: #0d9488; font-weight: 800;">
              <td colspan="2" style="text-align: right; border-top: 2px solid #0d9488;">TOTAL PAGADO:</td>
              <td style="text-align: right; border-top: 2px solid #0d9488;">${settings.currencySymbol}${booking.totalAmount.toFixed(2)} ${settings.currency}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #0f172a;">📍 Punto de Encuentro & Logística</h3>
        <div class="value" style="margin-bottom: 4px;">${tour.meetingPoint.name}</div>
        <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">${tour.meetingPoint.address}</div>
        <a href="${tour.meetingPoint.googleMapsUrl}" target="_blank" style="color: #0d9488; font-weight: 600; font-size: 13px;">Ver ubicación en Google Maps &rarr;</a>
      </div>

      ${operator ? `
      <div class="card" style="border-left: 4px solid #0d9488;">
        <div class="label">Tu Guía / Operador Asignado</div>
        <div style="margin-top: 6px;">
          <div class="value">${operator.name} (${operator.role})</div>
          <div style="font-size: 13px; color: #64748b;">Teléfono / WhatsApp: ${operator.phone}</div>
        </div>
      </div>
      ` : ''}

      <div class="qr-box">
        <h4 style="margin: 0 0 6px 0; color: #065f46; font-size: 16px;">🎟️ Pase de Abordaje Digital (QR)</h4>
        <p style="margin: 0 0 14px 0; font-size: 13px; color: #047857;">Presenta este código al guía antes de iniciar tu recorrido.</p>
        <div style="background: white; display: inline-block; padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`TOUR_BOARDING_PASS:${booking.code}:${booking.id}`)}" alt="QR Code" style="display: block; width: 180px; height: 180px;" />
        </div>
        <div style="margin-top: 10px; font-weight: bold; font-family: monospace; font-size: 16px; color: #065f46;">${booking.code}</div>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://wa.me/${(operator?.phone || settings.businessPhone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola! Tengo una consulta sobre mi reserva ${booking.code} para el tour ${tour.title}.`)}" class="btn btn-whatsapp" target="_blank">
          💬 Contactar por WhatsApp
        </a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>${settings.businessName}</strong></p>
      <p style="margin: 0 0 6px 0;">${settings.businessAddress} | ${settings.businessEmail} | ${settings.businessPhone}</p>
      <p style="margin: 0; color: #94a3b8;">Comprobante de compra oficial emitido electrónicamente.</p>
    </div>
  </div>
</body>
</html>
`;
}

export function getOwnerAlertEmailHtml(
  booking: Booking,
  tour: Tour,
  operator: Operator | undefined,
  settings: SystemSettings
): string {
  const invoiceNum = booking.invoiceNumber || `FACT-2026-${booking.code.replace('TOUR-2026-', '')}`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Copia de Factura & Venta - ${booking.code}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; }
    .box { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f172a; color: #38bdf8; padding: 24px; }
    .content { padding: 24px; }
    .badge-paid { background: #10b981; color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  </style>
</head>
<body>
  <div class="box">
    <div class="header">
      <h3 style="margin: 0; font-size: 12px; text-transform: uppercase; color: #94a3b8;">Liquidación de Venta & Copia Contable</h3>
      <h2 style="margin: 6px 0 0 0; color: #ffffff;">💰 Factura Electrónica ${invoiceNum}</h2>
      <p style="margin: 4px 0 0 0; color: #38bdf8; font-size: 13px;">Reserva: <strong>${booking.code}</strong></p>
    </div>
    <div class="content">
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 12px; color: #166534;">Monto Total Facturado al Cliente:</div>
        <div style="font-size: 26px; font-weight: bold; color: #15803d;">${settings.currencySymbol}${booking.totalAmount.toFixed(2)} ${settings.currency}</div>
        <div style="margin-top: 6px;">
          <span class="badge-paid">
            COBRO PROCESADO (${booking.paymentMethod.toUpperCase()})
          </span>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="margin: 0 0 10px 0; color: #334155; font-size: 14px;">Detalles Fiscales y Operativos</h4>
        <div class="info-row"><span>Número de Factura:</span><strong>${invoiceNum}</strong></div>
        <div class="info-row"><span>Tour:</span><strong>${tour.title}</strong></div>
        <div class="info-row"><span>Fecha y Hora:</span><strong>${booking.date} (${booking.timeSlot})</strong></div>
        <div class="info-row"><span>Pasajeros:</span><strong>${booking.totalPassengers} (${booking.adultsCount} Adultos, ${booking.childrenCount} Niños)</strong></div>
        <div class="info-row"><span>Titular:</span><strong>${booking.leadCustomer.fullName}</strong></div>
        <div class="info-row"><span>Email / Teléfono:</span><strong>${booking.leadCustomer.email} | ${booking.leadCustomer.phone}</strong></div>
        <div class="info-row"><span>Base Imponible:</span><strong>$${booking.subtotal.toFixed(2)}</strong></div>
        <div class="info-row"><span>Impuestos (10%):</span><strong>$${booking.tax.toFixed(2)}</strong></div>
        <div class="info-row"><span>Operario Asignado:</span><strong>${operator ? operator.name : 'Sin Asignar'}</strong></div>
      </div>

      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #64748b;">
        Copia contable registrada en el sistema SaaS de TerraAventura.
      </div>
    </div>
  </div>
</body>
</html>
`;
}

export function getOperatorDispatchEmailHtml(
  booking: Booking,
  tour: Tour,
  operator: Operator,
  settings: SystemSettings
): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Asignación de Tour - ${booking.code}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #1e293b; padding: 20px; }
    .box { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
    .header { background: #0369a1; color: #ffffff; padding: 24px; text-align: center; }
    .content { padding: 24px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    .table th { background: #e0f2fe; color: #0369a1; padding: 8px; text-align: left; }
    .table td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="box">
    <div class="header">
      <h3 style="margin: 0; font-size: 13px; text-transform: uppercase;">Orden de Operación / Hoja de Ruta</h3>
      <h2 style="margin: 6px 0 0 0;">Hola ${operator.name}, tienes un tour asignado</h2>
    </div>
    <div class="content">
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #0369a1;">${tour.title}</h3>
        <p style="margin: 4px 0;">📅 <strong>Fecha:</strong> ${booking.date}</p>
        <p style="margin: 4px 0;">⏰ <strong>Hora de Inicio:</strong> ${booking.timeSlot}</p>
        <p style="margin: 4px 0;">📍 <strong>Punto de Encuentro:</strong> ${tour.meetingPoint.name} (${tour.meetingPoint.address})</p>
        <p style="margin: 4px 0;">👥 <strong>Total Pasajeros:</strong> ${booking.totalPassengers}</p>
      </div>

      <h4 style="margin: 20px 0 8px 0; font-size: 14px;">Lista de Pasajeros y Requisitos</h4>
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Dieta / Especial</th>
          </tr>
        </thead>
        <tbody>
          ${booking.passengers.map(p => `
            <tr>
              <td><strong>${p.fullName}</strong></td>
              <td>${p.documentType} ${p.documentNumber}</td>
              <td style="color: ${p.specialRequirements ? '#b91c1c' : '#475569'}; font-weight: ${p.specialRequirements ? 'bold' : 'normal'};">
                ${p.specialRequirements || 'Sin requerimiento'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 24px; padding: 16px; background: #ecfdf5; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #047857;">Contacto directo del cliente líder:</p>
        <p style="margin: 0; font-weight: bold; font-size: 16px; color: #065f46;">${booking.leadCustomer.fullName} - ${booking.leadCustomer.phone}</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

// Fase 1: Email al Cliente al registrar la solicitud (Pre-reserva)
export function getCustomerPreReservationEmailHtml(
  booking: Booking,
  tour: Tour,
  settings: SystemSettings
): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Solicitud de Reserva Recibida - ${booking.code}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #334155; margin: 0; padding: 20px; }
    .box { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
    .header { background: linear-gradient(135deg, #1e293b, #0f766e); color: white; padding: 32px 24px; text-align: center; }
    .content { padding: 28px 24px; font-size: 14px; line-height: 1.6; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 18px 0; }
    .footer { background: #f1f5f9; padding: 18px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="box">
    <div class="header">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #5eead4;">${settings.businessName}</div>
      <h2 style="margin: 8px 0 0 0; color: #ffffff;">📋 Solicitud de Reserva Recibida</h2>
      <p style="margin: 4px 0 0 0; color: #cbd5e1; font-size: 13px;">Código: <strong>${booking.code}</strong></p>
    </div>
    <div class="content">
      <p>Hola <strong>${booking.leadCustomer.fullName}</strong>,</p>
      <p>Hemos registrado tu solicitud para vivir la experiencia <strong>${tour.title}</strong>. En este momento estamos coordinando y confirmando la asignación con el guía oficial disponible.</p>

      <div class="card">
        <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #0f172a;">Resumen de tu Solicitud</h3>
        <p style="margin: 4px 0;">📅 <strong>Fecha Solicitada:</strong> ${booking.date}</p>
        <p style="margin: 4px 0;">⏰ <strong>Horario:</strong> ${booking.timeSlot}</p>
        <p style="margin: 4px 0;">👥 <strong>Pasajeros:</strong> ${booking.totalPassengers} (${booking.adultsCount} Adultos${booking.childrenCount > 0 ? `, ${booking.childrenCount} Niños` : ''})</p>
        <p style="margin: 4px 0;">📍 <strong>Punto de Encuentro:</strong> ${tour.meetingPoint.name}</p>
      </div>

      <p style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 6px; color: #1e40af; font-size: 13px;">
        ⏳ <strong>Próximo Paso:</strong> Tan pronto como el guía confirme la salida, recibirás un WhatsApp y un correo con el enlace seguro para realizar el pago de tus boletos y descargar tu factura.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">${settings.businessName} | ${settings.businessPhone} | ${settings.businessEmail}</p>
      <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">Copia de cortesía enviada automáticamente a la plataforma de auditoría.</p>
    </div>
  </div>
</body>
</html>
`;
}

// Fase 2: Email al Cliente cuando el Guía Acepta el servicio (Listo para Pagar)
export function getCustomerOperatorAcceptedEmailHtml(
  booking: Booking,
  tour: Tour,
  operator: Operator,
  settings: SystemSettings,
  checkoutUrl: string
): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>¡Guía Confirmado! Procede con el Pago - ${booking.code}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #334155; margin: 0; padding: 20px; }
    .box { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
    .header { background: linear-gradient(135deg, #059669, #0d9488); color: white; padding: 32px 24px; text-align: center; }
    .content { padding: 28px 24px; font-size: 14px; line-height: 1.6; }
    .card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin: 18px 0; }
    .btn { display: inline-block; padding: 14px 32px; background: #059669; color: #ffffff !important; text-decoration: none; font-weight: 700; border-radius: 10px; font-size: 15px; margin: 12px 0; }
    .footer { background: #f1f5f9; padding: 18px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="box">
    <div class="header">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #a7f3d0;">${settings.businessName}</div>
      <h2 style="margin: 8px 0 0 0; color: #ffffff;">🎉 ¡Tu Salida ha sido Confirmada!</h2>
      <p style="margin: 4px 0 0 0; color: #e6fffa; font-size: 13px;">Reserva: <strong>${booking.code}</strong></p>
    </div>
    <div class="content">
      <p>Hola <strong>${booking.leadCustomer.fullName}</strong>,</p>
      <p>¡Excelentes noticias! Tu guía oficial designado <strong>${operator.name}</strong> ha confirmado la disponibilidad y salida para tu grupo.</p>

      <div class="card">
        <h3 style="margin: 0 0 8px 0; color: #065f46;">🧭 Guía Oficial Asignado</h3>
        <p style="margin: 2px 0;"><strong>${operator.name}</strong> (${operator.role})</p>
        <p style="margin: 2px 0; color: #047857; font-size: 13px;">Idiomas: ${operator.languages.join(', ')}</p>
        <p style="margin: 2px 0; color: #047857; font-size: 13px;">Punto de Encuentro: ${tour.meetingPoint.name}</p>
        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #86efac; font-size: 15px; font-weight: bold; color: #065f46;">
          Total a Pagar: ${settings.currencySymbol}${booking.totalAmount.toFixed(2)} ${settings.currency}
        </div>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <p style="margin-bottom: 12px; font-size: 13px; color: #475569;">Para emitir tu <strong>Pase de Abordaje QR</strong> y tu <strong>Factura Comercial</strong>, realiza el pago a continuación:</p>
        <a href="${checkoutUrl}" class="btn" target="_blank">
          💳 Pagar y Confirmar Reserva &rarr;
        </a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">${settings.businessName} | ${settings.businessPhone} | ${settings.businessEmail}</p>
      <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">Copia de cortesía enviada automáticamente a la plataforma de auditoría.</p>
    </div>
  </div>
</body>
</html>
`;
}

