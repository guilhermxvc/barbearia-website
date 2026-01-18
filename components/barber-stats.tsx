"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp, Calendar, DollarSign, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api"
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns"

export function BarberStats() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [user])

  const loadStats = async () => {
    try {
      setLoading(true)

      if (!user?.barber?.id) {
        return
      }

      const now = new Date()
      const monthStart = startOfMonth(now).toISOString().split('T')[0]
      const monthEnd = endOfMonth(now).toISOString().split('T')[0]

      const response = await apiClient.get(
        `/appointments?barberId=${user.barber.id}&startDate=${monthStart}&endDate=${monthEnd}`
      )

      const appointmentsData = response.data?.appointments || response.appointments || []
      setAppointments(appointmentsData)
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  const now = new Date()
  const monthInterval = { start: startOfMonth(now), end: endOfMonth(now) }

  const monthAppointments = appointments.filter((a) => {
    const scheduledAt = new Date(a.scheduledAt)
    return isWithinInterval(scheduledAt, monthInterval)
  })

  const pendingAppointments = monthAppointments.filter(
    (a) => a.status === "confirmed" || a.status === "scheduled" || a.status === "pending"
  )
  const completedAppointments = monthAppointments.filter((a) => a.status === "completed")
  const totalRevenue = completedAppointments.reduce((sum, a) => sum + (Number(a.totalPrice) || 0), 0)

  const currentMonthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-500 mb-2">
        Estatísticas de {currentMonthName}
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Agendamentos Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{pendingAppointments.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-green-900">{completedAppointments.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Faturamento do Mês</p>
                <p className="text-2xl font-bold text-gray-900">R$ {totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {monthAppointments.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
            <CardDescription>Suas estatísticas aparecerão aqui conforme você realiza atendimentos</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum atendimento neste mês ainda</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
