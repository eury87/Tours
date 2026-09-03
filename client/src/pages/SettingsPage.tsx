import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Mail, 
  MessageSquare, 
  Building, 
  DollarSign, 
  Save, 
  CheckCircle,
  Sparkles,
  Send,
  ExternalLink,
  HelpCircle,
  Receipt,
  PhoneCall,
  Key,
  QrCode,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Unlink
} from 'lucide-react';
import { SystemSettings } from '../types';
import { useSocket } from '../context/SocketContext';

export const SettingsPage: React.FC = () => {
  const { socket } = useSocket();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live tester state
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testPhoneTo, setTestPhoneTo] = useState('+1 (555) 234-5678');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; url?: string } | null>(null);

  // WhatsApp QR state
  const [whatsappStatus, setWhatsappStatus] = useState<{
    connected: boolean;
    phone: string | null;
    qrDataUrl: string | null;
    initializing: boolean;
  }>({
    connected: false,
    phone: null,
    qrDataUrl: null,
    initializing: false,
  });

  const fetchWhatsAppStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        if (data.data) setWhatsappStatus(data.data);
      }
    } catch (e) {
      console.error('Error fetching WhatsApp status:', e);
    }
  };

  useEffect(() => {
    fetchWhatsAppStatus();

    if (socket) {
      socket.on('whatsapp:qr', (data: { qrDataUrl: string }) => {
        setWhatsappStatus(prev => ({ ...prev, qrDataUrl: data.qrDataUrl, initializing: false }));
      });

      socket.on('whatsapp:connected', (data: { phone: string }) => {
        setWhatsappStatus({ connected: true, phone: data.phone, qrDataUrl: null, initializing: false });
      });

      socket.on('whatsapp:disconnected', () => {
        setWhatsappStatus({ connected: false, phone: null, qrDataUrl: null, initializing: false });
      });
    }

    return () => {
      if (socket) {
        socket.off('whatsapp:qr');
        socket.off('whatsapp:connected');
        socket.off('whatsapp:disconnected');
      }
    };
  }, [socket]);

  const handleStartWhatsAppQr = async () => {
    try {
      setWhatsappStatus(prev => ({ ...prev, initializing: true }));
      const res = await fetch('/api/whatsapp/start', { method: 'POST' });
      const data = await res.json();
      if (data.qrDataUrl) {
        setWhatsappStatus(prev => ({ ...prev, qrDataUrl: data.qrDataUrl, initializing: false }));
      }
    } catch (e) {
      console.error('Error starting WhatsApp QR:', e);
      setWhatsappStatus(prev => ({ ...prev, initializing: false }));
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      setWhatsappStatus({ connected: false, phone: null, qrDataUrl: null, initializing: false });
    } catch (e) {
      console.error('Error disconnecting WhatsApp:', e);
    }
  };

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data.data);
        if (data.data?.businessEmail) setTestEmailTo(data.data.businessEmail);
        if (data.data?.businessPhone) setTestPhoneTo(data.data.businessPhone);
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo.trim()) return;
    try {
      setIsSendingTest(true);
      setTestResult(null);

      const res = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmailTo.trim() }),
      });
      const resData = await res.json();

      setTestResult({
        success: res.ok,
        message: res.ok 
          ? (resData.message || `¡Confirmación y Factura enviadas a ${testEmailTo}! Revisa tu bandeja de entrada o spam.`) 
          : (resData.error || 'Error al despachar correo'),
      });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleTestWhatsApp = () => {
    const cleanPhone = testPhoneTo.replace(/[^0-9]/g, '');
    const sampleMsg = encodeURIComponent(`🌴 *PRUEBA DE CONFIRMACIÓN & FACTURA - ${settings?.businessName || 'TERRAAVENTURA'}*\n\nHola! Este es un mensaje de prueba para verificar que recibes la confirmación de tour y factura electrónica en tiempo real.\n\n🎟️ Reserva: TOUR-2026-DEMO\n🧾 Factura: FACT-2026-0001\n💰 Total: $185.00 USD`);
    const waUrl = `https://wa.me/${cleanPhone}?text=${sampleMsg}`;
    window.open(waUrl, '_blank');
  };

  if (!settings) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-[#E8E1D1] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#E8E1D1] text-xs font-bold uppercase tracking-wider mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>Configuración & Envío Real de Confirmaciones</span>
        </div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
          Ajustes del Negocio, Facturación Fiscal & Notificaciones Reales
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configura tus datos fiscales (RUC/RFC), servidores de correo (Gmail, Resend, SendGrid) y WhatsApp para que los clientes y guías reciban sus confirmaciones en la vida real.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-[#E8E1D1]/10 border border-[#E8E1D1]/40 text-[#E8E1D1] text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-[#E8E1D1]" />
          <span>¡Ajustes y credenciales guardados correctamente!</span>
        </div>
      )}

      {/* WhatsApp Web QR Connection Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 bg-[#181A17]/90 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#E8E1D1]">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-lg text-white">
                  Conexión WhatsApp Web por Código QR
                </h3>
                {whatsappStatus.connected && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#E8E1D1]/20 text-[#E8E1D1] border border-[#E8E1D1]/40 animate-pulse">
                    En Vivo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Vincula tu número escaneando el QR desde tu móvil. Todos los vouchers, confirmaciones y mensajes a guías se enviarán automáticamente desde tu propio WhatsApp.
              </p>
            </div>
          </div>

          <div>
            {whatsappStatus.connected ? (
              <button
                type="button"
                onClick={handleDisconnectWhatsApp}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors"
              >
                <Unlink className="w-4 h-4" />
                <span>Desvincular WhatsApp</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartWhatsAppQr}
                disabled={whatsappStatus.initializing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] font-black text-xs shadow-lg shadow-black/40 transition-all hover:scale-105 disabled:opacity-50"
              >
                <QrCode className="w-4 h-4" />
                <span>{whatsappStatus.initializing ? 'Generando QR...' : 'Vincular WhatsApp (Generar QR)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* State 1: Connected */}
        {whatsappStatus.connected ? (
          <div className="p-4 rounded-2xl bg-[#E8E1D1]/10 border border-[#E8E1D1]/30 flex items-center justify-between flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#E8E1D1] shrink-0" />
              <div>
                <div className="font-bold text-white text-sm">
                  WhatsApp Conectado y Operativo
                </div>
                <div className="text-[#E8E1D1] font-mono mt-0.5">
                  Número Vinculado: {whatsappStatus.phone || 'Tu Teléfono'}
                </div>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">
              Despacho 100% automático activo para reservas y respuestas de guías.
            </span>
          </div>
        ) : (
          /* State 2: QR Ready or Prompt */
          <div className="space-y-4">
            {whatsappStatus.qrDataUrl ? (
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-6 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="p-3 bg-white rounded-2xl shadow-2xl shrink-0">
                  <img src={whatsappStatus.qrDataUrl} alt="Escanea con tu WhatsApp" className="w-56 h-56 block rounded-lg" />
                </div>
                <div className="space-y-3 text-xs max-w-sm">
                  <span className="font-bold text-[#E8E1D1] uppercase text-[11px] tracking-wider block">
                    Escanea este código en 3 pasos:
                  </span>
                  <ol className="space-y-2 text-slate-300 leading-relaxed list-decimal list-inside font-medium">
                    <li>Abre <strong>WhatsApp</strong> en tu teléfono móvil.</li>
                    <li>Toca <strong>Ajustes</strong> (o los 3 puntos ⋮) ➔ <strong>Dispositivos vinculados</strong>.</li>
                    <li>Toca <strong>Vincular un dispositivo</strong> y apunta tu cámara a este código.</li>
                  </ol>
                  <p className="text-[11px] text-slate-500 pt-1">
                    El código se actualiza automáticamente. Una vez vinculado, la pantalla se conectará de inmediato.
                  </p>
                </div>
              </div>
            ) : whatsappStatus.initializing ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-[#E8E1D1] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Iniciando puente con WhatsApp Web... El código QR aparecerá en segundos.</p>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
                <Smartphone className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-white">No hay ninguna cuenta de WhatsApp vinculada en este momento.</p>
                <p className="text-slate-500 mt-1">
                  Haz click en el botón superior para generar un código QR y conectar tu WhatsApp en 10 segundos.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Verification Testing Center */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 bg-[#181A17]/80 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-[#E8E1D1] font-heading font-bold text-base">
            <Sparkles className="w-5 h-5 text-[#E8E1D1]" />
            <span>Centro de Pruebas en Vivo (Emails & WhatsApp Reales)</span>
          </div>
          <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-[#E8E1D1] border border-white/20">
            Verificación Activa
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Test Real Email */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-[#E8E1D1] font-bold text-xs">
              <Mail className="w-4 h-4" />
              <span>Probar Envío de Correo con Factura HTML</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Escribe tu correo personal y haz click para recibir una factura comercial y un voucher digital de prueba en tu bandeja.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="tu-correo@gmail.com"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-[#E8E1D1] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTest || !testEmailTo}
                className="px-3.5 py-2 rounded-xl bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] font-black text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTest ? 'Enviando...' : 'Enviar'}</span>
              </button>
            </div>
          </div>

          {/* Test Real WhatsApp */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-[#25D366] font-bold text-xs">
              <MessageSquare className="w-4 h-4" />
              <span>Probar Notificación de WhatsApp con Itinerario</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Ingresa tu número con código de país (ej. +51999888777) y prueba cómo se ve el mensaje listo para el cliente y el guía.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="+51 999 888 777"
                value={testPhoneTo}
                onChange={(e) => setTestPhoneTo(e.target.value)}
                className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-[#E8E1D1] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestWhatsApp}
                className="px-3.5 py-2 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Probar</span>
              </button>
            </div>
          </div>

        </div>

        {testResult && (
          <div className={`p-3 rounded-xl text-xs font-medium ${testResult.success ? 'bg-[#E8E1D1]/15 text-[#E8E1D1] border border-[#E8E1D1]/30' : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'}`}>
            {testResult.message}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Business & Legal Tax Details Card */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <Receipt className="w-5 h-5 text-[#E8E1D1]" />
            <div>
              <h3 className="font-heading font-bold text-lg text-white">Datos Comerciales & Fiscales (Facturación)</h3>
              <p className="text-[11px] text-slate-400">Estos datos aparecerán en los encabezados de las facturas comerciales emitidas a tus clientes.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Nombre Comercial de la Empresa</label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-[#E8E1D1] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Razón Social Oficial (Legal)</label>
              <input
                type="text"
                placeholder="Ej: Turismo & Aventuras Internacional SAC"
                value={settings.legalName || ''}
                onChange={(e) => setSettings({ ...settings, legalName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-[#E8E1D1] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Identificación Fiscal (RUC / RFC / Tax ID / NIF)</label>
              <input
                type="text"
                placeholder="Ej: RUC 20608942101 o RFC ABC1234567"
                value={settings.taxId || ''}
                onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-[#E8E1D1] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Correo del Dueño (Recepción de Ventas)</label>
              <input
                type="email"
                value={settings.businessEmail}
                onChange={(e) => setSettings({ ...settings, businessEmail: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-[#E8E1D1] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#E8E1D1] font-semibold block mb-1">
                📬 Correo de Copia de la Plataforma (CC de todo email a clientes)
              </label>
              <input
                type="email"
                placeholder="auditoria@tuempresa.com"
                value={settings.platformAuditEmail || ''}
                onChange={(e) => setSettings({ ...settings, platformAuditEmail: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/20 text-white focus:border-[#E8E1D1] focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">Recibirá copia exacta (CC) de cada correo enviado al cliente.</span>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Teléfono / WhatsApp Oficial de Atención</label>
              <input
                type="text"
                value={settings.businessPhone}
                onChange={(e) => setSettings({ ...settings, businessPhone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-[#E8E1D1] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Dirección Fiscal / Sede Central</label>
              <input
                type="text"
                value={settings.businessAddress}
                onChange={(e) => setSettings({ ...settings, businessAddress: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-[#E8E1D1] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Email & SMTP Server Credentials */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#E8E1D1]" />
              <div>
                <h3 className="font-heading font-bold text-lg text-white">Servidor de Correo (SMTP para Envío Real)</h3>
                <p className="text-[11px] text-slate-400">Compatible con Gmail, Resend, SendGrid, Mailgun o el SMTP de tu hosting.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Modo Simulado / Ethereal:</span>
              <input
                type="checkbox"
                checked={settings.smtpConfig.isSimulated}
                onChange={(e) => setSettings({
                  ...settings,
                  smtpConfig: { ...settings.smtpConfig, isSimulated: e.target.checked }
                })}
                className="w-4 h-4 accent-[#E8E1D1]"
                title="Desmarca esta casilla cuando quieras que los correos salgan a destinatarios reales"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Host SMTP</label>
              <input
                type="text"
                placeholder="smtp.gmail.com o smtp.resend.com"
                value={settings.smtpConfig.host}
                onChange={(e) => setSettings({ ...settings, smtpConfig: { ...settings.smtpConfig, host: e.target.value } })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-[#E8E1D1] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Puerto</label>
              <input
                type="number"
                placeholder="465 (SSL) o 587 (TLS)"
                value={settings.smtpConfig.port}
                onChange={(e) => setSettings({ ...settings, smtpConfig: { ...settings.smtpConfig, port: Number(e.target.value) } })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-[#E8E1D1] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Usuario / Email Remitente</label>
              <input
                type="text"
                placeholder="tu-correo@gmail.com"
                value={settings.smtpConfig.user}
                onChange={(e) => setSettings({ ...settings, smtpConfig: { ...settings.smtpConfig, user: e.target.value } })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-[#E8E1D1] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Contraseña de Aplicación / API Key</label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={settings.smtpConfig.pass}
                onChange={(e) => setSettings({ ...settings, smtpConfig: { ...settings.smtpConfig, pass: e.target.value } })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-[#E8E1D1] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Cloud API */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <MessageSquare className="w-5 h-5 text-[#E8E1D1]" />
            <div>
              <h3 className="font-heading font-bold text-lg text-white">WhatsApp Business Cloud API (Meta / Twilio)</h3>
              <p className="text-[11px] text-slate-400">Para envíos 100% automáticos vía bot sin requerir abrir el enlace manualmente.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Endpoint de Mensajería API</label>
              <input
                type="text"
                placeholder="https://graph.facebook.com/v18.0/TU_PHONE_NUMBER_ID/messages"
                value={settings.whatsappConfig.apiUrl}
                onChange={(e) => setSettings({ ...settings, whatsappConfig: { ...settings.whatsappConfig, apiUrl: e.target.value } })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-[#E8E1D1] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Token de Acceso Permanente (Bearer Token)</label>
              <input
                type="password"
                placeholder="EAABw..."
                value={settings.whatsappConfig.apiKey}
                onChange={(e) => setSettings({ ...settings, whatsappConfig: { ...settings.whatsappConfig, apiKey: e.target.value } })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-[#E8E1D1] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#E8E1D1] hover:bg-[#F8F5EE] text-[#152230] font-black text-sm shadow-xl shadow-black/40 transition-all hover:scale-105 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando Ajustes...' : 'Guardar Ajustes & Credenciales'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
