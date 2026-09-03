import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Upload, 
  Sparkles,
  Check
} from 'lucide-react';
import { Operator } from '../types';

interface OperatorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (operator: Operator) => void;
  operatorToEdit?: Operator | null;
}

export const OperatorFormModal: React.FC<OperatorFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  operatorToEdit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('Guía Principal');
  const [phone, setPhone] = useState('+507');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');
  const [languages, setLanguages] = useState<string[]>(['Español', 'Inglés']);
  const [active, setActive] = useState(true);

  const ALL_LANGUAGES = ['Español', 'Inglés', 'Francés', 'Portugués', 'Alemán', 'Italiano'];

  useEffect(() => {
    if (operatorToEdit) {
      setName(operatorToEdit.name);
      setRole(operatorToEdit.role);
      setPhone(operatorToEdit.phone);
      setEmail(operatorToEdit.email);
      setAvatar(operatorToEdit.avatar);
      setLanguages(operatorToEdit.languages || ['Español']);
      setActive(operatorToEdit.active);
    } else {
      setName('');
      setRole('Guía Principal');
      setPhone('+507');
      setEmail('');
      setAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');
      setLanguages(['Español', 'Inglés']);
      setActive(true);
    }
  }, [operatorToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleLanguage = (lang: string) => {
    setLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setAvatar(data.url);
      } else {
        alert(data.error || 'Error subiendo avatar');
      }
    } catch (err: any) {
      alert(`Error subiendo foto: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      alert('Nombre, teléfono de WhatsApp y correo son obligatorios');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      email: email.trim(),
      avatar: avatar.trim(),
      languages,
      active,
    };

    try {
      const url = operatorToEdit ? `/api/operators/${operatorToEdit.id}` : '/api/operators';
      const method = operatorToEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success && data.data) {
        onSaved(data.data);
        onClose();
      } else {
        alert(data.error || 'Error guardando operario');
      }
    } catch (err: any) {
      alert(`Error de red: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#181A17] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8E1D1]/10 border border-[#E8E1D1]/20 flex items-center justify-center text-[#E8E1D1]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">
                {operatorToEdit ? 'Editar Operario / Guía' : 'Registrar Nuevo Operario'}
              </h3>
              <p className="text-xs text-slate-400">
                Datos para la asignación y notificación de turnos por WhatsApp.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Avatar Preview & Upload */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/10">
            <img
              src={avatar}
              alt="Avatar"
              className="w-14 h-14 rounded-2xl object-cover border border-white/20 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Fotografía del Operario</label>
              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 rounded-xl bg-[#E8E1D1]/10 hover:bg-[#E8E1D1]/20 border border-[#E8E1D1]/20 text-[#E8E1D1] text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingAvatar ? 'Subiendo...' : 'Subir Foto'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingAvatar}
                    className="hidden"
                  />
                </label>
                <input
                  type="url"
                  placeholder="O URL directa..."
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="flex-1 p-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 font-semibold block mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                placeholder="Ej: Mateo Sandoval"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#E8E1D1] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Rol / Especialidad</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#E8E1D1] focus:outline-none"
              >
                <option value="Guía Principal">Guía Principal</option>
                <option value="Guía de Montaña">Guía de Montaña</option>
                <option value="Coordinador de Ruta">Coordinador de Ruta</option>
                <option value="Conductor Especializado">Conductor Especializado</option>
                <option value="Buzo Certificado">Buzo Certificado</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Teléfono WhatsApp *</label>
              <input
                type="tel"
                required
                placeholder="+50765274580"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#E8E1D1] focus:outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 font-semibold block mb-1">Correo Electrónico *</label>
              <input
                type="email"
                required
                placeholder="mateo@terraaventura.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#E8E1D1] focus:outline-none"
              />
            </div>
          </div>

          {/* Idiomas */}
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-2">Idiomas que domina:</label>
            <div className="flex flex-wrap gap-2">
              {ALL_LANGUAGES.map(lang => {
                const isSelected = languages.includes(lang);

                return (
                  <button
                    type="button"
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#E8E1D1] border-[#E8E1D1] text-[#141513]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{lang}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estado Activo */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-white">Operario Activo para Asignaciones</div>
              <div className="text-[11px] text-slate-400">Si está inactivo, el sistema no le enviará solicitudes por WhatsApp.</div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E8E1D1] peer-checked:after:bg-[#141513]"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#E8E1D1] hover:bg-[#d8d1c1] text-[#141513] font-bold text-xs shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-[#141513]" />
              <span>{isSubmitting ? 'Guardando...' : (operatorToEdit ? 'Guardar Cambios' : 'Registrar Operario')}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
