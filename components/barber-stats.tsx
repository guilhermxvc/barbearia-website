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
  BarChart3
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api"
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface ServiceCommission {
  serviceId: string
  serviceName: string
  commissionRate: string
}

export function BarberStats() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [commissions, setCommissions] = useState<ServiceCommission[]>([])
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

      // Fetch appointments and commissions in parallel
      const [appointmentsRes, commissionsRes] = await Promise.all([
        apiClient.get(
          `/appointments?barberId=${user.barber.id}&startDate=${monthStart}&endDate=${monthEnd}`
        ),
        apiClient.get(`/barber-service-commissions?barberId=${user.barber.id}`)
      ])

      const appointmentsData = (appointmentsRes as any).data?.appointments || (appointmentsRes as any).appointments || []
      setAppointments(appointmentsData)
      
      // Get commissions for this barber
      const commissionsData = (commissionsRes as any).data?.commissions || (commissionsRes as any).commissions || []
      if (commissionsData.length > 0) {
        setCommissions(commissionsData[0]?.services || [])
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }
  
  // Calculate commission value for a completed appointment
  const calculateCommission = (appointment: any): number => {
    const servicePrice = Number(appointment.totalPrice) || 0
    const serviceName = appointment.service?.name || ''
    
    // Find the commission rate for this service
    const serviceComm = commissions.find(c => c.serviceName === serviceName)
    const commissionRate = serviceComm ? parseFloat(serviceComm.commissionRate) : 50 // Default 50%
    
    return servicePrice * (commissionRate / 100)
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
  
  // Calculate total earnings based on commission rates (not full service price)
  const totalEarnings = completedAppointments.reduce((sum, a) => sum + calculateCommission(a), 0)

  const uniqueClients = new Set(completedAppointments.map(a => a.clientId)).size

  const serviceCount: Record<string, number> = {}
  completedAppointments.forEach(a => {
    const serviceName = a.service?.name || 'Serviço'
    serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1
  })
  
  const servicesRanking = Object.entries(serviceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  const topService = servicesRanking[0]

  const currentMonthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const barColors = [
    "#f59e0b", "#fb923c", "#fbbf24", "#f97316", 
    "#fcd34d", "#fdba74", "#fed7aa", "#fef3c7"
  ]

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Agendamentos</p>
                <p className="text-2xl font-bold text-gray-900">{pendingAppointments.length}</p>
                <p className="text-xs text-gray-400">pendentes</p>
              </div>
              <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Completados</p>
                <p className="text-2xl font-bold text-gray-900">{completedAppointments.length}</p>
                <p className="text-xs text-gray-400">serviços</p>
              </div>
              <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Seus Ganhos</p>
                <p className="text-2xl font-bold text-green-600">R$ {totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-gray-400">comissões no mês</p>
              </div>
              <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{uniqueClients}</p>
                <p className="text-xs text-gray-400">atendidos</p>
              </div>
              <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {servicesRanking.length > 0 ? (
        <Card className="bg-white border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-600" />
              Ranking de Serviços
            </CardTitle>
            <CardDescription>Serviços mais realizados neste mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={servicesRanking}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} vezes`, 'Realizados']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                  >
                    {servicesRanking.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-600" />
              Ranking de Serviços
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <Scissors className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Complete atendimentos para ver o ranking</p>
          </CardContent>
        </Card>
      )}

      {monthAppointments.length === 0 && (
        <Card className="bg-white border">
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
