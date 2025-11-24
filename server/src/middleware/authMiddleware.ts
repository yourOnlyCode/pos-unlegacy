import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_secret';

export interface AuthRequest extends Request {
  auth?: {
    sub: string;
    businessId: string;
    email: string;
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.auth = {
      sub: payload.sub,
      businessId: payload.businessId,
      email: payload.email
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireBusinessMatch(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
  const { businessId } = req.params;
  if (businessId && businessId !== req.auth.businessId) {
    return res.status(403).json({ error: 'Forbidden for this business' });
  }
  next();
}
