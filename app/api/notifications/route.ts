import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications, insertNotificationSchema } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/notifications - Listar notificações do usuário
export const GET = withAuth()(async (req) => {
  try {
    const userId = req.user!.id;
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    let whereConditions = [eq(notifications.userId, userId)];
    
    if (unreadOnly) {
      whereConditions.push(eq(notifications.isRead, false));
    }

    const notificationsList = await db
      .select()
      .from(notifications)
      .where(and(...whereConditions))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return NextResponse.json({
      success: true,
      notifications: notificationsList,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar notificações' },
      { status: 500 }
    );
  }
});

// POST /api/notifications - Criar nova notificação (sistema interno)
export const POST = withAuth(['manager'])(async (req) => {
  try {
    const body = await req.json();
    const data = insertNotificationSchema.parse(body);

    const [newNotification] = await db
      .insert(notifications)
      .values(data)
      .returning();

    return NextResponse.json({
      success: true,
      notification: newNotification,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar notificação' },
      { status: 500 }
    );
  }
});

// PUT /api/notifications/[id]/read - Marcar notificação como lida
export const PUT = withAuth()(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID da notificação é obrigatório' },
        { status: 400 }
      );
    }

    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, req.user!.id)
        )
      )
      .returning();

    if (!updatedNotification) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: updatedNotification,
    });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar notificação' },
      { status: 500 }
    );
  }
});