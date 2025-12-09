import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    currentUser?: AuthUser | null;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function attachUser(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const token = req.cookies?.token;
  if (!token) {
    req.currentUser = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true },
    });
    req.currentUser = user || null;
  } catch (err) {
    req.currentUser = null;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.currentUser) {
    return res.redirect('/auth/login');
  }
  next();
}
