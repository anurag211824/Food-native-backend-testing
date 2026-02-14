import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

export interface AuthedRequest extends Request {
  userId?: number;
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let token: string | undefined;

    // 1️⃣ Check Cookie (Web)
    if (req.cookies && req.cookies["food-token"]) {
      token = req.cookies["food-token"];
    }

    // 2️⃣ If no cookie → check Bearer header (Mobile)
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload = verifyToken(token) as { userId: number };

    req.userId = payload.userId;

    next();

  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export default requireAuth;
