"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DollarSign,
  Calendar,
  Loader2,
  FileText,
  Users,
  Star,
  Scissors,
  TrendingUp,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api"
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface ServiceCommission {
  serviceId: string
  serviceName: string
  commissionRate: string
}

const CHART_COLORS = [
  "#f59e0b", "#d97706", "#b45309", "#92400e",
  "#78716c", "#a8a29e", "#d6d3d1",
]

export function BarberReports() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [commissions, setCommissions] = useState<ServiceCommission[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth)

  useEffect(() => {
    loadReports()
  }, [user])

  const loadReports = async () => {
    try {
      setLoading(true)

      if (!user?.barber?.id) return

      const [appointmentsRes, commissionsRes] = await Promise.all([
        apiClient.get(`/appointments?barberId=${user.barber.id}`),
        apiClient.get(`/barber-service-commissions?barberId=${user.barber.id}`),
      ])

      const appointmentsData =
        (appointmentsRes as any).data?.appointments ||
        (appointmentsRes as any).appointments ||
        []
      setAppointments(appointmentsData)

      const commissionsData =
        (commissionsRes as any).data?.commissions ||
        (commissionsRes as any).commissions ||
        []
      if (commissionsData.length > 0) {
        setCommissions(commissionsData[0]?.services || [])
      }
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCommissionValue = (appointment: any): number => {
    const servicePrice = Number(appointment.totalPrice) || 0
    const serviceName = appointment.service?.name || ""
    const serviceComm = commissions.find((c) => c.serviceName === serviceName)
    const commissionRate = serviceComm ? parseFloat(serviceComm.commissionRate) : 50
    return servicePrice * (commissionRate / 100)
  }

  const periodRange = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number)
    const target = new Date(year, month - 1, 1)
    return { start: startOfMonth(target), end: endOfMonth(target) }
  }, [selectedMonth])

  const periodLabel = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number)
    const target = new Date(year, month - 1, 1)
    const label = format(target, "MMMM 'de' yyyy", { locale: ptBR })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [selectedMonth])

  const completedAppointments = useMemo(
    () => appointments.filter((a) => a.status === "completed" || a.status === "finished"),
    [appointments]
  )

  const filteredAppointments = useMemo(
    () =>
      completedAppointments.filter((a) => {
        if (!a.scheduledAt) return false
        const date = new Date(a.scheduledAt)
        return isWithinInterval(date, { start: periodRange.start, end: periodRange.end })
      }),
    [completedAppointments, periodRange]
  )

  const totalFaturado = useMemo(
    () => filteredAppointments.reduce((sum, a) => sum + (Number(a.totalPrice) || 0), 0),
    [filteredAppointments]
  )

  const totalComissoes = useMemo(
    () => filteredAppointments.reduce((sum, a) => sum + getCommissionValue(a), 0),
    [filteredAppointments, commissions]
  )

  const uniqueClients = useMemo(() => {
    const clientIds = new Set<string>()
    filteredAppointments.forEach((a) => {
      const clientId = a.clientId || a.client?.id
      if (clientId) clientIds.add(clientId)
    })
    return clientIds.size
  }, [filteredAppointments])

  const barberRating = user?.barber?.rating ? parseFloat(user.barber.rating) : 0
  const barberTotalRatings = user?.barber?.totalRatings || 0

  const serviceRanking = useMemo(() => {
    const counts: Record<string, number> = {}
    completedAppointments.forEach((a) => {
      const name = a.service?.name || "Outro"
      counts[name] = (counts[name] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7)
  }, [completedAppointments])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  if (!user?.barber?.barbershop) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Não Vinculado</h3>
          <p className="text-gray-600">
            Você precisa estar vinculado a uma barbearia para ver relatórios
          </p>
        </CardContent>
      </Card>
    )
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Resumo do Período</CardTitle>
              <CardDescription className="capitalize">{periodLabel}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full sm:w-44"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Scissors className="h-3.5 w-3.5 text-blue-600" />
                Atendimentos
              </div>
              <p className="text-2xl font-bold">{filteredAppointments.length}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5 text-green-600" />
                Comissões
              </div>
              <p className="text-2xl font-bold text-green-600">R$ {totalComissoes.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">de R$ {totalFaturado.toFixed(2)} faturado</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-amber-600" />
                Clientes
              </div>
              <p className="text-2xl font-bold">{uniqueClients}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                Nota Média
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{barberRating > 0 ? barberRating.toFixed(1) : "—"}</span>
                {barberRating > 0 && renderStars(barberRating)}
              </div>
              <p className="text-xs text-muted-foreground">
                {barberTotalRatings > 0 ? `${barberTotalRatings} avaliações` : "sem avaliações"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Serviços Mais Realizados</CardTitle>
          <CardDescription>Ranking geral de todos os serviços completados</CardDescription>
        </CardHeader>
        <CardContent>
          {serviceRanking.length === 0 ? (
            <div className="text-center py-8">
              <Scissors className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nenhum serviço completado ainda</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={serviceRanking} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} serviço${value !== 1 ? "s" : ""}`, "Total"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={32}>
                  {serviceRanking.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimos Atendimentos</CardTitle>
          <CardDescription>Serviços completados {periodLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nenhum atendimento {periodLabel}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredAppointments
                .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
                .slice(0, 20)
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 bg-amber-100 text-amber-700 flex items-center justify-center rounded-full shrink-0">
                        <Scissors className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {appointment.service?.name || "Serviço"}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {appointment.client?.user
                            ? `${appointment.client.user.firstName} ${appointment.client.user.lastName}`
                            : appointment.client?.name || "Cliente"}{" "}
                          · {appointment.scheduledAt
                            ? format(new Date(appointment.scheduledAt), "dd/MM HH:mm", { locale: ptBR })
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-semibold text-green-600">
                        R$ {getCommissionValue(appointment).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">
                        de R$ {Number(appointment.totalPrice || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
