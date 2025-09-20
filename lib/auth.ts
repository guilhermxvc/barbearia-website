import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  userType: 'manager' | 'barber' | 'client';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
    },
    getJWTSecret(),
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as any;
    
    // Verificar se o payload tem as propriedades necessárias
    if (decoded && decoded.id && decoded.email && decoded.name && decoded.userType) {
      return {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        userType: decoded.userType,
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType as 'manager' | 'barber' | 'client',
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType as 'manager' | 'barber' | 'client',
    };
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}