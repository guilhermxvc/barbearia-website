"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Loader2, 
  Users, 
  Scissors, 
  XCircle,
  Clock,
  Target
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api"
import { startOfMonth, endOfMonth, isWithinInterval, format, isToday, isTomorrow } from "date-fns"
import { ptBR } from "date-fns/locale"

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
  const cancelledAppointments = monthAppointments.filter((a) => a.status === "cancelled" || a.status === "no_show")
  
  const totalRevenue = completedAppointments.reduce((sum, a) => sum + (Number(a.totalPrice) || 0), 0)
  
  const averageTicket = completedAppointments.length > 0 
    ? totalRevenue / completedAppointments.length 
    : 0

  const noShowRate = monthAppointments.length > 0
    ? (cancelledAppointments.length / monthAppointments.length) * 100
    : 0

  const uniqueClients = new Set(monthAppointments.map(a => a.clientId)).size

  const serviceCount: Record<string, number> = {}
  completedAppointments.forEach(a => {
    const serviceName = a.service?.name || 'Serviço'
    serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1
  })
  const topService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0]

  const upcomingAppointments = pendingAppointments
    .filter(a => new Date(a.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5)

  const currentMonthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Estatísticas do Mês</h2>
          <p className="text-sm text-gray-500 capitalize">{currentMonthName}</p>
        </div>
        <Badge variant="outline" className="text-amber-600 border-amber-300">
          <Calendar className="h-3 w-3 mr-1" />
          Mês Atual
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">Agendamentos</p>
                <p className="text-2xl font-bold text-blue-900">{pendingAppointments.length}</p>
                <p className="text-xs text-gray-500">pendentes</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">Completados</p>
                <p className="text-2xl font-bold text-green-900">{completedAppointments.length}</p>
                <p className="text-xs text-gray-500">serviços</p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600 font-medium">Faturamento</p>
                <p className="text-2xl font-bold text-amber-900">R$ {totalRevenue.toFixed(0)}</p>
                <p className="text-xs text-gray-500">no mês</p>
              </div>
              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-medium">Ticket Médio</p>
                <p className="text-2xl font-bold text-purple-900">R$ {averageTicket.toFixed(0)}</p>
                <p className="text-xs text-gray-500">por serviço</p>
              </div>
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-600 font-medium">Clientes</p>
                <p className="text-2xl font-bold text-indigo-900">{uniqueClients}</p>
                <p className="text-xs text-gray-500">atendidos</p>
              </div>
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600 font-medium">Cancelamentos</p>
                <p className="text-2xl font-bold text-red-900">{cancelledAppointments.length}</p>
                <p className="text-xs text-gray-500">{noShowRate.toFixed(0)}% do total</p>
              </div>
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {topService && (
          <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-100 col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-teal-600 font-medium">Serviço Mais Realizado</p>
                  <p className="text-lg font-bold text-teal-900 truncate">{topService[0]}</p>
                  <p className="text-xs text-gray-500">{topService[1]} vezes no mês</p>
                </div>
                <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center">
                  <Scissors className="h-5 w-5 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Próximos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => {
                const aptDate = new Date(apt.scheduledAt)
                let dateLabel = format(aptDate, "dd/MM", { locale: ptBR })
                if (isToday(aptDate)) dateLabel = "Hoje"
                else if (isTomorrow(aptDate)) dateLabel = "Amanhã"
                
                return (
                  <div 
                    key={apt.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[50px]">
                        <p className="text-xs text-gray-500">{dateLabel}</p>
                        <p className="font-semibold text-amber-600">
                          {format(aptDate, "HH:mm")}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {apt.client?.name || apt.client?.user?.firstName || "Cliente"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {apt.service?.name || "Serviço"}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        apt.status === "confirmed" 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }
                    >
                      {apt.status === "confirmed" ? "Confirmado" : "Pendente"}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
