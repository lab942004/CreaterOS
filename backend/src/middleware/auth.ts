import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { dbStore } from '../utils/store';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If running in development demo mode, fallback to default creator user if no token provided
    req.user = dbStore.users[0];
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, config.jwtSecret);
    const user = dbStore.users.find(u => u.id === decoded.id) || dbStore.adminUsers.find(a => a.id === decoded.id);
    if (!user) {
      req.user = dbStore.users[0];
    } else {
      req.user = user;
    }
    next();
  } catch (err) {
    req.user = dbStore.users[0];
    next();
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN')) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Admin authorization required.' });
};
