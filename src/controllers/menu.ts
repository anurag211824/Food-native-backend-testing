import type { Request, Response } from 'express';
import { prisma } from '../lib/db.js';

export async function listCategories(req: Request, res: Response) {
  const categories = await prisma.menuCategory.findMany({ include: { items: true } });
  res.json(categories);
}

export async function getCategoryItems(req: Request, res: Response) {
  const categoryId = Number(req.params.id);
  const items = await prisma.menuItem.findMany({ where: { categoryId } });
  res.json(items);
}

export default { listCategories, getCategoryItems };
