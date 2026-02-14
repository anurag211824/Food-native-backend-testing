import type { Request, Response } from 'express';
import { prisma } from '../lib/db.js';

export async function createOrder(req: Request, res: Response) {
  const { userId, restaurantId, driverId, itemsSnapshot, paymentMode } = req.body;
  if (!userId || !restaurantId || !itemsSnapshot) return res.status(400).json({ error: 'missing fields' });

  const itemTotal = (itemsSnapshot as any[]).reduce(
  (sum, item) => sum + (item.price * (item.quantity || 1)),
  0
);

  const tax = Number((itemTotal * 0.05).toFixed(2));
  const deliveryCharge = 30;
  const totalAmount = itemTotal + tax + deliveryCharge;

  const order = await prisma.order.create({
    data: {
      userId,
      restaurantId,
      driverId,
      itemsSnapshot,
      itemTotal,
      tax,
      deliveryCharge,
      platformFee: 10,
      totalAmount,
      paymentMode: paymentMode || 'UPI',
    },
  });

  res.status(201).json(order);
}

export async function listOrdersByRestaurant(
  req: Request,
  res: Response
) {
  const restaurantId = Number(req.params.restaurantId);

  if (!restaurantId) {
    return res.status(400).json({ error: "restaurantId required" });
  }

  const orders = await prisma.order.findMany({
    where: { restaurantId },
    orderBy: { placedAt: "desc" },
  });

  res.json(orders);
}


export default { createOrder,listOrdersByRestaurant };
