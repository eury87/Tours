import { Router, Request, Response } from 'express';
import { db } from '../db/store';

const router = Router();

// Obtener todos los tours con filtros opcionales (categoría, destino, precio max)
router.get('/', (req: Request, res: Response) => {
  try {
    let tours = db.getTours();
    const { category, search, maxPrice } = req.query;

    if (category && category !== 'Todos') {
      tours = tours.filter(t => t.category.toLowerCase() === (category as string).toLowerCase());
    }

    if (search) {
      const q = (search as string).toLowerCase();
      tours = tours.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.destination.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q)
      );
    }

    if (maxPrice) {
      const price = Number(maxPrice);
      if (!isNaN(price)) {
        tours = tours.filter(t => t.price <= price);
      }
    }

    res.json({ success: true, count: tours.length, data: tours });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Obtener detalle de un tour
router.get('/:id', (req: Request, res: Response) => {
  try {
    const tour = db.getTourById(req.params.id);
    if (!tour) {
      return res.status(404).json({ success: false, error: 'Tour no encontrado' });
    }
    res.json({ success: true, data: tour });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Crear nuevo tour personalizado (Dueño)
router.post('/', (req: Request, res: Response) => {
  try {
    const {
      title,
      tagline,
      description,
      destination,
      category,
      price,
      childPrice,
      duration,
      difficulty,
      maxCapacity,
      meetingPoint,
      timeSlots,
      included,
      notIncluded,
      itinerary,
      images,
      featured,
      requiresOperatorApproval,
      availableOperatorIds,
    } = req.body;

    if (!title || !destination || price === undefined) {
      return res.status(400).json({ success: false, error: 'Título, destino y precio son obligatorios' });
    }

    const newTour = {
      id: `tour-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      tagline: tagline || '',
      description: description || '',
      destination,
      category: category || 'Aventura',
      price: Number(price) || 0,
      childPrice: Number(childPrice) || 0,
      duration: duration || '3 Horas',
      difficulty: difficulty || 'Moderado',
      maxCapacity: Number(maxCapacity) || 12,
      meetingPoint: meetingPoint || {
        name: 'Punto de encuentro central',
        address: destination,
        googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(destination)}`,
        pickupAvailable: false,
      },
      timeSlots: Array.isArray(timeSlots) && timeSlots.length > 0 ? timeSlots : ['08:00 AM', '02:00 PM'],
      included: Array.isArray(included) ? included : ['Guía certificado', 'Seguro de asistencia'],
      notIncluded: Array.isArray(notIncluded) ? notIncluded : ['Propinas', 'Gastos personales'],
      itinerary: Array.isArray(itinerary) ? itinerary : [],
      images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80'],
      rating: 5,
      reviewsCount: 1,
      featured: !!featured,
      requiresOperatorApproval: requiresOperatorApproval !== undefined ? !!requiresOperatorApproval : true,
      availableOperatorIds: Array.isArray(availableOperatorIds) ? availableOperatorIds : [],
    };

    const saved = db.createTour(newTour as any);
    res.status(201).json({ success: true, message: 'Tour creado exitosamente', data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Actualizar tour existente (Dueño)
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateTour(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Tour no encontrado' });
    }
    res.json({ success: true, message: 'Tour actualizado exitosamente', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Eliminar tour
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const deleted = db.deleteTour(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Tour no encontrado' });
    }
    res.json({ success: true, message: 'Tour eliminado exitosamente' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
