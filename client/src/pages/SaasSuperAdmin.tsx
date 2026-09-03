import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  DollarSign, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { Company } from '../types';
import { useSocket } from '../context/SocketContext';

export const SaasSuperAdmin: React.FC = () => {
  const { liveBookings } = useSocket();
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    fetch('/api/auth/companies')
      .then(res => res.json())
      .then(data => setCompanies(data.data || []))
      .catch(console.error);
  }, []);

  const totalSaaSVolume = liveBookings.reduce((acc, b) => acc + (b.paymentStatus === 'completed' ? b.totalAmount : 0), 0);
  const platformCommission = totalSaaSVolume * 0.05; // 5% SaaS transaction fee

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#E8E1D1] text-xs font-bold uppercase tracking-wider mb-2">
          <Layers className="w-3.5 h-3.5" />
          <span>Panel de Administración Global SaaS</span>
        </div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
          Gestión de Empresas & Plataforma Multi-Tenant
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Supervisa las agencias de turismo suscritas al software, planes activos, comisiones por transacción y volumen transaccionado.
        </p>
      </div>

      {/* Global SaaS KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="p-6 rounded-3xl glass-card border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E8E1D1]">Agencias Suscritas</span>
            <div className="w-10 h-10 rounded-xl bg-white/5 text-[#E8E1D1] border border-white/10 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-white mt-3">
            {companies.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Operadores turísticos activos</p>
        </div>

        <div className="p-6 rounded-3xl glass-card border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Volumen Procesado</span>
            <div className="w-10 h-10 rounded-xl bg-white/5 text-slate-300 border border-white/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-white mt-3">
            ${totalSaaSVolume.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">GMV total en la plataforma</p>
        </div>

        <div className="p-6 rounded-3xl glass-card border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Comisión SaaS (5%)</span>
            <div className="w-10 h-10 rounded-xl bg-white/5 text-amber-400 border border-white/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-white mt-3">
            ${platformCommission.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ingresos recurrentes del software</p>
        </div>

        <div className="p-6 rounded-3xl glass-card border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E8E1D1]">Total Reservas</span>
            <div className="w-10 h-10 rounded-xl bg-white/5 text-[#E8E1D1] border border-white/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-white mt-3">
            {liveBookings.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Transacciones procesadas</p>
        </div>

      </div>

      {/* Companies Directory */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-white">Directorio de Empresas Suscritas</h3>
          <span className="text-xs text-slate-400">Multi-Tenancy Habilitado</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {companies.map((comp) => (
            <div
              key={comp.id}
              className="p-5 rounded-2xl bg-[#181A17]/90 border border-white/10 hover:border-[#E8E1D1]/30 transition-colors space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-heading font-bold text-white text-base">{comp.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">slug: /{comp.slug}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-[#E8E1D1] border border-white/20">
                  Plan {comp.plan}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <div><strong>Contacto Propietario:</strong> {comp.ownerEmail}</div>
                <div><strong>Fecha de Registro:</strong> {new Date(comp.createdAt).toLocaleDateString()}</div>
                <div className="flex items-center gap-1.5 text-[#E8E1D1] pt-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Estado de Cuenta: Activa / En regla</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
