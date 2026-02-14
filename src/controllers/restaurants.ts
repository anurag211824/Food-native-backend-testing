import type { Request, Response } from "express";
import { prisma } from "../lib/db.js";

export async function listRestaurants(req: Request, res: Response) {
  const items = await prisma.restaurant.findMany({
    include: { menuCategories: true },
  });
  res.json(items);
}

export async function getRestaurant(req: Request, res: Response) {
  const id = Number(req.params.id);
  const r = await prisma.restaurant.findUnique({
    where: { id },
    include: { menuCategories: { include: { items: true } } },
  });
  if (!r) return res.status(404).json({ error: "not found" });
  res.json(r);
}

export async function createRestaurant(req: Request, res: Response) {
  const { managerId, name, costForTwo, cuisineTypes, lat, lng, address } =
    req.body;
  if (!managerId || !name)
    return res.status(400).json({ error: "managerId and name required" });

  const r = await prisma.restaurant.create({
    data: { managerId, name, costForTwo, cuisineTypes, lat, lng, address },
  });
  res.status(201).json(r);
}

export default { listRestaurants, getRestaurant, createRestaurant };
