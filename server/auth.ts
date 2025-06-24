import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: number, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
  } catch {
    return null;
  }
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  // Verify user still exists
  const user = await storage.getUserById(decoded.userId);
  if (!user) {
    return res.status(403).json({ message: 'User not found' });
  }

  req.user = { id: decoded.userId, username: decoded.username };
  next();
}

export async function loginUser(username: string, password: string): Promise<{ user: any; token: string } | null> {
  const user = await storage.getUserByUsername(username);
  if (!user) {
    return null;
  }

  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    return null;
  }

  const token = generateToken(user.id, user.username);
  return {
    user: { id: user.id, username: user.username },
    token
  };
}

export async function registerUser(username: string, password: string): Promise<{ user: any; token: string }> {
  const hashedPassword = await hashPassword(password);
  const user = await storage.createUser({ username, password: hashedPassword });
  const token = generateToken(user.id, user.username);
  
  return {
    user: { id: user.id, username: user.username },
    token
  };
}