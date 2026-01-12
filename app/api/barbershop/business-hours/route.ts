import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { barbershops } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'barbershop-secret-key-2024'

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; userType: string }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const barbershopId = searchParams.get('barbershopId')

    if (!barbershopId) {
      return NextResponse.json({ error: 'barbershopId é obrigatório' }, { status: 400 })
    }

    const barbershop = await db
      .select({ businessHours: barbershops.businessHours })
      .from(barbershops)
      .where(eq(barbershops.id, barbershopId))
      .limit(1)

    if (!barbershop.length) {
      return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      businessHours: barbershop[0].businessHours || null,
    })
  } catch (error) {
    console.error('Error fetching business hours:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (decoded.userType !== 'manager') {
      return NextResponse.json({ error: 'Apenas gerentes podem modificar horários' }, { status: 403 })
    }

    const body = await request.json()
    const { barbershopId, businessHours } = body

    if (!barbershopId || !businessHours) {
      return NextResponse.json({ error: 'barbershopId e businessHours são obrigatórios' }, { status: 400 })
    }

    await db
      .update(barbershops)
      .set({ 
        businessHours,
        updatedAt: new Date(),
      })
      .where(eq(barbershops.id, barbershopId))

    return NextResponse.json({
      success: true,
      message: 'Horários de funcionamento atualizados com sucesso',
    })
  } catch (error) {
    console.error('Error updating business hours:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
