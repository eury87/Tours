import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Building2, 
  Receipt, 
  CreditCard,
  QrCode,
  ShieldCheck
} from 'lucide-react';
import { Booking, SystemSettings } from '../types';

interface InvoiceModalProps {
  booking: Booking | null;
  settings?: SystemSettings | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ booking, settings, isOpen, onClose }) => {
  if (!isOpen || !booking) return null;

  const invoiceNum = booking.invoiceNumber || `FACT-2026-${booking.code.replace('TOUR-2026-', '')}`;
  const businessName = settings?.businessName || 'TerraAventura Expeditions';
  const legalName = settings?.legalName || 'TerraAventura Operador Turístico Internacional SAC';
  const taxId = settings?.taxId || 'RUC 20608942101';
  const address = settings?.businessAddress || 'Av. Gran Vía 240, Distrito Turístico Central';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top bar (actions) */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="font-heading font-bold text-white text-sm">
              Factura Comercial Electrónica • {invoiceNum}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 print-ticket-area space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-200 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                  {businessName}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-1">{legalName}</p>
              <p className="text-xs text-slate-500 font-mono">{taxId}</p>
              <p className="text-xs text-slate-500">{address}</p>
              <p className="text-xs text-slate-500">contacto: {settings?.businessEmail || 'reservas@terraaventura.com'}</p>
            </div>

            <div className="sm:text-right border sm:border-0 p-3 sm:p-0 rounded-xl bg-slate-50 sm:bg-transparent">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 block">
                COMPROBANTE FISCAL DIGITAL
              </span>
              <h2 className="font-heading font-black text-2xl text-slate-900 font-mono mt-0.5">
                {invoiceNum}
              </h2>
              <div className="text-xs text-slate-500 mt-1 font-medium">
                <div>Fecha de Emisión: <strong>{new Date(booking.createdAt).toLocaleDateString()}</strong></div>
                <div>Reserva Asociada: <strong className="font-mono text-emerald-700">{booking.code}</strong></div>
              </div>
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Facturado a (Cliente):
              </span>
              <div className="font-bold text-slate-900 text-sm">{booking.leadCustomer.fullName}</div>
              <div className="text-slate-600 mt-0.5">Email: {booking.leadCustomer.email}</div>
              <div className="text-slate-600">Teléfono: {booking.leadCustomer.phone}</div>
              <div className="text-slate-600">País: {booking.leadCustomer.country}</div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Condiciones de Pago:
              </span>
              <div className="font-semibold text-slate-800">
                Método: <strong className="text-emerald-700">{booking.paymentMethod.toUpperCase()}</strong>
              </div>
              <div className="text-slate-600 mt-0.5">
                Estado: <span className="text-emerald-700 font-bold">PAGADO (Liquidado en Línea)</span>
              </div>
              {booking.paymentDetails?.transactionId && (
                <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                  ID Transacción: {booking.paymentDetails.transactionId}
                </div>
              )}
              {booking.paymentDetails?.cardLast4 && (
                <div className="text-slate-500 text-[11px]">
                  Tarjeta {booking.paymentDetails.cardBrand || 'Visa'} terminada en •••• {booking.paymentDetails.cardLast4}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-700 font-bold text-[11px] uppercase bg-slate-100">
                  <th className="py-2.5 px-3">Concepto / Servicio</th>
                  <th className="py-2.5 px-3 text-center">Cant.</th>
                  <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                  <th className="py-2.5 px-3 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3 px-3">
                    <strong className="text-slate-900 block text-sm">{booking.tourTitle}</strong>
                    <span className="text-slate-500 text-[11px]">
                      Salida programada para el {booking.date} a las {booking.timeSlot} ({booking.totalPassengers} pasajeros)
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold">{booking.totalPassengers}</td>
                  <td className="py-3 px-3 text-right font-mono">${(booking.subtotal / Math.max(1, booking.totalPassengers)).toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold">${booking.subtotal.toFixed(2)}</td>
                </tr>

                {booking.selectedAddOns.map((addon) => (
                  <tr key={addon.id} className="text-slate-600">
                    <td className="py-2 px-3 pl-6">• {addon.name}</td>
                    <td className="py-2 px-3 text-center">1</td>
                    <td className="py-2 px-3 text-right font-mono">${addon.price.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono">${addon.price.toFixed(2)}</td>
                  </tr>
                ))}

                {booking.couponCode && (
                  <tr className="text-emerald-700 font-bold bg-emerald-50/60">
                    <td className="py-2 px-3">🎟️ Descuento Promocional ({booking.couponCode})</td>
                    <td className="py-2 px-3 text-center">1</td>
                    <td className="py-2 px-3 text-right font-mono">-${(booking.discountAmount || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono">-${(booking.discountAmount || 0).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Total */}
          <div className="flex justify-end pt-4 border-t-2 border-slate-200">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base Imponible / Subtotal:</span>
                <span className="font-mono font-semibold">${booking.subtotal.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Impuesto sobre las Ventas (10%):</span>
                <span className="font-mono font-semibold">${booking.tax.toFixed(2)} USD</span>
              </div>
              <div className="pt-2 border-t-2 border-slate-900 flex justify-between text-base font-black text-slate-900">
                <span>TOTAL FACTURADO:</span>
                <span className="font-mono text-lg text-emerald-800">${booking.totalAmount.toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          {/* Footer & QR Verification Seal */}
          <div className="pt-6 border-t border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 p-1 border border-slate-300 rounded-lg flex items-center justify-center shrink-0">
                <QrCode className="w-9 h-9 text-slate-800" />
              </div>
              <div>
                <div className="font-bold text-slate-800 text-[11px]">Firma y Timbre Digital Autorizado</div>
                <div className="text-[10px] text-slate-400 font-mono">Hdr: SHA256-DIGITAL-INVOICE-STAMP</div>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400">
              Documento tributario emitido electrónicamente de conformidad con la normativa turística y fiscal.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
