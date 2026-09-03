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

export default router;
