import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cyber-secret-key-2035';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'seller' | 'client';
    name: string;
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "AUTHORIZATION TOKEN REQUIRED" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: 'admin' | 'seller' | 'client';
      name: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "INVALID OR EXPIRED GRID SESSION TOKEN" });
  }
};

export const requireRole = (roles: Array<'admin' | 'seller' | 'client'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "UNAUTHORIZED ACTION" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "INSUFFICIENT SECURITY CLEARANCE" });
    }

    next();
  };
};
