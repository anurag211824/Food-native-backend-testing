import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/db.js';
import { signToken } from '../utils/jwt.js';

export async function register(req: Request, res: Response) {
  const { phone, email, password, name } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone required' });

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return res.status(409).json({ error: 'user exists' });

  const hash = password ? await bcrypt.hash(password, 10) : undefined;

  const user = await prisma.user.create({
    data: { phone, email, password: hash, name },
  });

  const token = signToken({ userId: user.id });

  // ✅ Set token in cookie
  res.cookie("food-token", token, {
    httpOnly: true,         // JS cannot access (XSS protection)
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "strict",     // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Remove password before sending user
  const { password: _, ...safeUser } = user;

  res.status(201).json({
    message: "User registered successfully",
    user: safeUser,
    token
  });
}

export async function login(req: Request, res: Response) {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'phone+password required' });

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.password) return res.status(401).json({ error: 'invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  const token = signToken({ userId: user.id });
  res.cookie("food-token", token, {
    httpOnly: true,         // JS cannot access (XSS protection)
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "strict",     // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Remove password before sending user
  const { password: _, ...safeUser } = user;

  res.status(201).json({
    message: "User loggedIn successfully",
    user: safeUser,
    token
  });
}

export async function me(req: Request, res: Response) {
  const userId = (req as any).userId as number | undefined;
  if (!userId) return res.status(401).json({ error: 'not authed' });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  res.json({ user });
}

export default { register, login, me };
