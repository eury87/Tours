import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  DollarSign, 
  Users, 
  Clock, 
  Compass, 
  Sparkles, 
  Upload, 
  Check, 
  ShieldCheck, 
  Info,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { Tour, Operator } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface TourFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (tour: Tour) => void;
  tourToEdit?: Tour | null;
  operators: Operator[];
}

export const TourFormModal: React.FC<TourFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  tourToEdit,
  operators,
}) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState<Tour['category']>('Aventura');
  const [price, setPrice] = useState<number>(75);
  const [childPrice, setChildPrice] = useState<number>(45);
  const [duration, setDuration] = useState('4 Horas');
  const [difficulty, setDifficulty] = useState<Tour['difficulty']>('Moderado');
  const [maxCapacity, setMaxCapacity] = useState<number>(12);
  const [requiresOperatorApproval, setRequiresOperatorApproval] = useState(true);
  
  // Meeting Point
  const [meetingName, setMeetingName] = useState('Base Central de Operaciones');
  const [meetingAddress, setMeetingAddress] = useState('Av. Principal #100');
  const [meetingMapsUrl, setMeetingMapsUrl] = useState('https://maps.google.com/?q=Central');
  const [pickupAvailable, setPickupAvailable] = useState(false);

  // Images
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80'
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Selected Operators for this Tour
  const [selectedOperatorIds, setSelectedOperatorIds] = useState<string[]>([]);

  useEffect(() => {
    if (tourToEdit) {
      setTitle(tourToEdit.title);
      setTagline(tourToEdit.tagline || '');
      setDescription(tourToEdit.description || '');
      setDestination(tourToEdit.destination);
      setCategory(tourToEdit.category);
      setPrice(tourToEdit.price);
      setChildPrice(tourToEdit.childPrice || 0);
      setDuration(tourToEdit.duration);
      setDifficulty(tourToEdit.difficulty);
      setMaxCapacity(tourToEdit.maxCapacity);
      setRequiresOperatorApproval(tourToEdit.requiresOperatorApproval !== false);
      setMeetingName(tourToEdit.meetingPoint?.name || '');
      setMeetingAddress(tourToEdit.meetingPoint?.address || '');
      setMeetingMapsUrl(tourToEdit.meetingPoint?.googleMapsUrl || '');
      setPickupAvailable(!!tourToEdit.meetingPoint?.pickupAvailable);
      setImages(tourToEdit.images && tourToEdit.images.length > 0 ? tourToEdit.images : ['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80']);
      setSelectedOperatorIds(tourToEdit.availableOperatorIds || []);
    } else {
      // Defaults para nuevo tour
      setTitle('');
      setTagline('');
      setDescription('');
      setDestination('');
      setCategory('Aventura');
      setPrice(85);
      setChildPrice(50);
      setDuration('4 Horas');
      setDifficulty('Moderado');
      setMaxCapacity(14);
      setRequiresOperatorApproval(true);
      setMeetingName('Base de Operaciones');
      setMeetingAddress('');
      setMeetingMapsUrl('');
      setPickupAvailable(false);
      setImages(['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80']);
      // Por defecto asignar a todos los operarios activos
      setSelectedOperatorIds(operators.filter(o => o.active).map(o => o.id));
    }
  }, [tourToEdit, operators, isOpen]);

  if (!isOpen) return null;

  const toggleOperator = (opId: string) => {
    setSelectedOperatorIds(prev => 
      prev.includes(opId) ? prev.filter(id => id !== opId) : [...prev, opId]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setImages(prev => [data.url, ...prev]);
      } else {
        alert(data.error || 'Error subiendo imagen');
      }
    } catch (err: any) {
      alert(`Error de conexión al subir imagen: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages(prev => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim()) {
      alert('Por favor ingresa un título y un destino para el tour');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title: title.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      destination: destination.trim(),
      category,
      price: Number(price) || 0,
      childPrice: Number(childPrice) || 0,
      duration,
      difficulty,
      maxCapacity: Number(maxCapacity) || 10,
      requiresOperatorApproval,
      meetingPoint: {
        name: meetingName.trim() || destination.trim(),
        address: meetingAddress.trim() || destination.trim(),
        googleMapsUrl: meetingMapsUrl.trim() || `https://maps.google.com/?q=${encodeURIComponent(destination)}`,
        pickupAvailable,
      },
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80'],
      availableOperatorIds: selectedOperatorIds,
    };

    try {
      const url = tourToEdit ? `/api/tours/${tourToEdit.id}` : '/api/tours';
      const method = tourToEdit ? 'PATCH' : 'POST';

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
        alert(data.error || 'Error al guardar el tour');
      }
    } catch (err: any) {
      alert(`Error guardando tour: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#181A17] border border-white/10 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8E1D1]/10 border border-[#E8E1D1]/20 flex items-center justify-center text-[#E8E1D1]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">
                {tourToEdit ? 'Editar Tour Personalizado' : 'Crear Nuevo Tour en el Catálogo'}
              </h3>
              <p className="text-xs text-slate-400">
                Personaliza tarifas, fotos, itinerario y asigna los operarios capacitados.
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* 1. Información Principal */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#E8E1D1] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>1. Información Principal del Tour</span>
            </h4>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400 font-semibold block mb-1">Título del Tour *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Expedición a los Cenotes Sagrados & Selva Maya"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#E8E1D1] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Destino / Región *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Riviera Maya, Perú, Costa Rica..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#E8E1D1] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#E8E1D1] focus:outline-none"
                >
                  <option value="Aventura">Aventura</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Gastronomía">Gastronomía</option>
                  <option value="Naturaleza">Naturaleza</option>
                  <option value="Playa">Playa</option>
                  <option value="Extremo">Extremo</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400 font-semibold block mb-1">Eslogan / Frase Destacada</label>
                <input
                  type="text"
                  placeholder="Ej: Una travesía privada e inolvidable hacia aguas cristalinas"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#E8E1D1] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400 font-semibold block mb-1">Descripción Completa</label>
                <textarea
                  rows={3}
                  placeholder="Describe la experiencia, actividades incluidas, qué esperar..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#E8E1D1] focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Tarifas y Parámetros Operativos */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold text-[#E8E1D1] uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>2. Tarifas y Capacidad</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Precio Adulto (USD) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#E8E1D1] focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Precio Niño (USD)</label>
                <input
                  type="number"
                  min={0}
                  value={childPrice}
                  onChange={(e) => setChildPrice(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#E8E1D1] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Duración</label>
                <input
                  type="text"
                  placeholder="Ej: 5 Horas"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#E8E1D1] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Cupo Máximo</label>
                <input
                  type="number"
                  min={1}
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#E8E1D1] focus:outline-none"
                />
              </div>
            </div>

            {/* Modalidad de Aprobación */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
              <div>
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#E8E1D1]" />
                  <span>Requiere Aprobación de Guía antes de Cobrar</span>
                </h5>
                <p className="text-xs text-slate-400 mt-0.5">
                  {requiresOperatorApproval
                    ? 'El cliente solicita cupos y espera confirmación del guía por WhatsApp antes de debitar su tarjeta.'
                    : 'Cobro y confirmación instantánea sin aprobación previa del operario.'}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={requiresOperatorApproval}
                  onChange={(e) => setRequiresOperatorApproval(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E8E1D1] peer-checked:after:bg-[#141513]"></div>
              </label>
            </div>
          </div>

          {/* 3. ASIGNACIÓN DE OPERARIOS / GUÍAS DISPONIBLES */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#E8E1D1] uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>3. Operarios Asignados y Habilitados para este Tour</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Marca qué guías están autorizados y disponibles para recibir las reservas de este tour.
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-[#E8E1D1]/10 text-[#E8E1D1] border border-[#E8E1D1]/20 text-xs font-bold">
                {selectedOperatorIds.length} Asignado(s)
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {operators.map(op => {
                const isSelected = selectedOperatorIds.includes(op.id);

                return (
                  <div
                    key={op.id}
                    onClick={() => toggleOperator(op.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#E8E1D1]/10 border-[#E8E1D1] text-white shadow-md'
                        : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={op.avatar}
                        alt={op.name}
                        className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs truncate text-white">{op.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{op.role} • {op.phone}</div>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#E8E1D1] border-[#E8E1D1] text-[#141513]' : 'border-white/20'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}

              {operators.length === 0 && (
                <div className="sm:col-span-2 p-4 text-center text-xs text-slate-400 bg-white/5 rounded-2xl border border-white/10">
                  No hay operarios registrados en el sistema. Puedes agregar operarios en la pestaña de Operarios.
                </div>
              )}
            </div>
          </div>

          {/* 4. Punto de Encuentro */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold text-[#E8E1D1] uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>4. Punto de Encuentro & Logística</span>
            </h4>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Nombre del Punto *</label>
                <input
                  type="text"
                  placeholder="Ej: Base Aventura - Módulo 3"
                  value={meetingName}
                  onChange={(e) => setMeetingName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#E8E1D1] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Dirección de Referencia</label>
                <input
                  type="text"
                  placeholder="Ej: Marina Sunset, Muelle B"
                  value={meetingAddress}
                  onChange={(e) => setMeetingAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#E8E1D1] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400 font-semibold block mb-1">Enlace de Google Maps</label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={meetingMapsUrl}
                  onChange={(e) => setMeetingMapsUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#E8E1D1] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 5. Galería de Fotos */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold text-[#E8E1D1] uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span>5. Fotografías del Tour (Cloudinary / URLs)</span>
            </h4>

            {/* Upload Button */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E8E1D1]/10 hover:bg-[#E8E1D1]/20 border border-[#E8E1D1]/30 text-[#E8E1D1] text-xs font-bold cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>{uploadingImage ? 'Subiendo a Cloudinary...' : 'Subir Imagen desde PC'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <input
                  type="url"
                  placeholder="O pega una URL directa de imagen..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 p-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-[#E8E1D1] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
              {images.map((imgUrl, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-white/10">
                  <img src={imgUrl} alt="Tour preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-lg bg-black/70 text-red-400 hover:text-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#E8E1D1] hover:bg-[#d8d1c1] text-[#141513] font-bold text-xs shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#141513]" />
              <span>{isSubmitting ? 'Guardando...' : (tourToEdit ? 'Guardar Cambios' : 'Publicar Tour en Catálogo')}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
