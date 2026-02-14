import type { Request, Response } from 'express';
import { prisma } from '../lib/db.js';

export async function search(req: Request, res: Response) {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.status(400).json({ error: 'query param q required' });

  const type = (req.query.type || 'all').toString();
  const limit = Number(req.query.limit) || 20;
  console.log(q,type,limit);
  
  const restaurantWhere: any = {
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { cuisineTypes: { has: q } },
      { address: { contains: q, mode: 'insensitive' } },
    ],
    isActive: true,
  };

  const itemWhere: any = {
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ],
    isAvailable: true,
  };

  const results: Record<string, unknown> = {};

  if (type === 'restaurants' || type === 'all') {
    results.restaurants = await prisma.restaurant.findMany({
      where: restaurantWhere,
      include: { menuCategories: { include: { items: true } } },
      take: limit,
    });
  }

  if (type === 'items' || type === 'all') {
    results.items = await prisma.menuItem.findMany({
      where: itemWhere,
      include: { category: { include: { restaurant: true } } },
      take: limit,
    });
  }

  res.json(results);
}

export default { search };
