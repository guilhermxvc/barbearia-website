"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  Calendar,
  TrendingUp,
  XCircle,
  Trophy,
  Loader2,
  Scissors,
  BarChart3
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts"

interface DashboardData {
  confirmedAppointments: number
  dailyRevenue: number
  weeklyRevenue: number
  monthlyRevenue: number
  cancellationRate: number
  totalAppointments: number
  cancelledAppointments: number
  barberRanking: { name: string; count: number }[]
  popularServices: { name: string; count: number; revenue: number }[]
  weekdayOccupancy: { day: string; appointments: number }[]
}

const COLORS = ["#f59e0b", "#fb923c", "#fbbf24", "#f97316", "#fcd34d", "#fdba74", "#fed7aa", "#fef3c7"]
const WEEKDAY_COLORS = ["#f59e0b", "#fb923c", "#fbbf24", "#f97316", "#fcd34d", "#fdba74", "#fed7aa"]

export function OverviewCards() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [revenueView, setRevenueView] = useState<'daily' | 'weekly' | 'monthly'>('monthly')

  useEffect(() => {
    loadDashboardData()
  }, [user?.barbershop?.id])

  const loadDashboardData = async () => {
    const barbershopId = user?.barbershop?.id || localStorage.getItem('barbershopId')
    if (!barbershopId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const headers = { 'Authorization': `Bearer ${token}` }

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0]
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      const weekStartStr = weekStart.toISOString().split('T')[0]

      const [appointmentsRes, salesRes] = await Promise.all([
        fetch(`/api/appointments?barbershopId=${barbershopId}&startDate=${monthStart}&endDate=${monthEnd}`, { headers }),
        fetch(`/api/sales?barbershopId=${barbershopId}`, { headers }),
      ])

      const appointmentsData = await appointmentsRes.json()
      const salesData = await salesRes.json()

      const allAppointments = appointmentsData.appointments || []
      const allSales = salesData.sales || []

      const confirmed = allAppointments.filter((a: any) =>
        a.status === 'confirmed' || a.status === 'scheduled' || a.status === 'pending'
      ).length

      const cancelled = allAppointments.filter((a: any) => a.status === 'cancelled').length
      const total = allAppointments.length
      const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0

      const todaySales = allSales.filter((s: any) => {
        const d = new Date(s.createdAt)
        return d.toISOString().split('T')[0] === todayStart
      })
      const dailyRevenue = todaySales.reduce((sum: number, s: any) => sum + parseFloat(s.totalAmount || '0'), 0)

      const weeklySales = allSales.filter((s: any) => {
        const d = new Date(s.createdAt)
        return d >= weekStart && d <= now
      })
      const weeklyRevenue = weeklySales.reduce((sum: number, s: any) => sum + parseFloat(s.totalAmount || '0'), 0)

      const monthlySales = allSales.filter((s: any) => {
        const d = new Date(s.createdAt)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      const monthlyRevenue = monthlySales.reduce((sum: number, s: any) => sum + parseFloat(s.totalAmount || '0'), 0)

      const completed = allAppointments.filter((a: any) => a.status === 'completed')

      const barberCount: Record<string, number> = {}
      completed.forEach((a: any) => {
        const name = a.barber?.name || 'Barbeiro'
        barberCount[name] = (barberCount[name] || 0) + 1
      })
      const barberRanking = Object.entries(barberCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }))

      const serviceCount: Record<string, { count: number; revenue: number }> = {}
      completed.forEach((a: any) => {
        const name = a.service?.name || 'Serviço'
        const price = Number(a.totalPrice) || 0
        if (!serviceCount[name]) serviceCount[name] = { count: 0, revenue: 0 }
        serviceCount[name].count += 1
        serviceCount[name].revenue += price
      })
      const popularServices = Object.entries(serviceCount)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 8)
        .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))

      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      const dayCount: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
      allAppointments.forEach((a: any) => {
        if (a.status !== 'cancelled') {
          const day = new Date(a.scheduledAt).getDay()
          dayCount[day] = (dayCount[day] || 0) + 1
        }
      })
      const weekdayOccupancy = dayNames.map((day, i) => ({
        day,
        appointments: dayCount[i] || 0,
      }))

      setData({
        confirmedAppointments: confirmed,
        dailyRevenue,
        weeklyRevenue,
        monthlyRevenue,
        cancellationRate,
        totalAppointments: total,
        cancelledAppointments: cancelled,
        barberRanking,
        popularServices,
        weekdayOccupancy,
      })
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        <span className="ml-2 text-gray-600">Carregando dashboard...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>Sem dados disponíveis</p>
      </div>
    )
  }

  const revenueValue = revenueView === 'daily' ? data.dailyRevenue
    : revenueView === 'weekly' ? data.weeklyRevenue
    : data.monthlyRevenue

  const revenueLabel = revenueView === 'daily' ? 'Hoje'
    : revenueView === 'weekly' ? 'Essa Semana'
    : 'Este Mês'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Confirmados</CardTitle>
            <Calendar className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.confirmedAppointments}</div>
            <p className="text-xs text-muted-foreground">pendentes este mês</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => setRevenueView(v => v === 'daily' ? 'weekly' : v === 'weekly' ? 'monthly' : 'daily')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {revenueValue.toFixed(2)}</div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs cursor-pointer">
                {revenueLabel}
              </Badge>
              <span className="text-xs text-gray-400">clique para alternar</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Cancelamento</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.cancellationRate > 20 ? 'text-red-600' : data.cancellationRate > 10 ? 'text-amber-600' : 'text-green-600'}`}>
              {data.cancellationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.cancelledAppointments} de {data.totalAppointments} cancelados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Realizados</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.popularServices.reduce((sum, s) => sum + s.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">completados este mês</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-600" />
              Ranking de Barbeiros
            </CardTitle>
            <CardDescription>Mais serviços realizados no mês</CardDescription>
          </CardHeader>
          <CardContent>
            {data.barberRanking.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhum serviço completado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.barberRanking.map((barber, index) => (
                  <div key={barber.name} className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {index + 1}º
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{barber.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-600">{barber.count}</p>
                      <p className="text-xs text-gray-400">serviços</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Scissors className="h-4 w-4 text-amber-600" />
              Serviços Mais Populares
            </CardTitle>
            <CardDescription>Serviços mais realizados no mês</CardDescription>
          </CardHeader>
          <CardContent>
            {data.popularServices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Scissors className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhum serviço completado ainda</p>
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.popularServices}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.popularServices.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${value} vezes (R$ ${props.payload.revenue.toFixed(2)})`,
                        name
                      ]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-amber-600" />
            Ocupação por Dia da Semana
          </CardTitle>
          <CardDescription>Distribuição de agendamentos por dia da semana neste mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weekdayOccupancy} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="day" tick={{ fontSize: 13 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} agendamentos`, 'Agendamentos']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="appointments" radius={[6, 6, 0, 0]} cursor="pointer">
                  {data.weekdayOccupancy.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={WEEKDAY_COLORS[index % WEEKDAY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
