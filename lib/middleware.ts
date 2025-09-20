import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AuthUser } from './auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

export function withAuth(userTypes?: string[]) {
  return (handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) => {
    return async (req: AuthenticatedRequest, context?: any) => {
      try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        
        if (!token) {
          return NextResponse.json({ error: 'Token de acesso não fornecido' }, { status: 401 });
        }

        const user = verifyToken(token);
        if (!user) {
          return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
        }

        if (userTypes && !userTypes.includes(user.userType)) {
          return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        req.user = user;
        return handler(req, context);
      } catch (error) {
        console.error('Auth middleware error:', error);
        return NextResponse.json({ error: 'Erro de autenticação' }, { status: 500 });
      }
    };
  };
}

export function corsMiddleware(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}