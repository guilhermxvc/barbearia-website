"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { User, Search, Users, TrendingUp, Loader2, Phone, Calendar } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface BarberClient {
  id: string
  name: string
  phone: string
  totalVisits: number
  totalSpent: number
  lastVisit: string | null
}

export function BarberClients() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.barber?.id) {
      loadClients()
    }
  }, [user])

  const loadClients = async () => {
    try {
      setLoading(true)

      if (!user?.barber?.id) return

      const response = await apiClient.get(`/appointments?barberId=${user.barber.id}`)

      if (response.success && response.appointments) {
        setAppointments(response.appointments)
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
    } finally {
      setLoading(false)
    }
  }

  const completedAppointments = useMemo(
    () => appointments.filter((a) => a.status === "completed" || a.status === "finished"),
    [appointments]
  )

  const uniqueClients = useMemo((): BarberClient[] => {
    const clientMap = new Map<string, BarberClient>()

    completedAppointments.forEach((appointment) => {
      const clientId = appointment.client?.id
      if (!clientId) return

      const existing = clientMap.get(clientId)

      if (existing) {
        existing.totalVisits += 1
        existing.totalSpent += Number(appointment.totalPrice) || 0
        if (appointment.scheduledAt) {
          const appointmentDate = new Date(appointment.scheduledAt)
          const lastDate = existing.lastVisit ? new Date(existing.lastVisit) : null
          if (!lastDate || appointmentDate > lastDate) {
            existing.lastVisit = appointment.scheduledAt
          }
        }
      } else {
        const clientName = appointment.client?.name || "Cliente"
        const clientPhone = appointment.client?.phone || ""

        clientMap.set(clientId, {
          id: clientId,
          name: clientName,
          phone: clientPhone,
          totalVisits: 1,
          totalSpent: Number(appointment.totalPrice) || 0,
          lastVisit: appointment.scheduledAt || null,
        })
      }
    })

    return Array.from(clientMap.values()).sort((a, b) => b.totalVisits - a.totalVisits)
  }, [completedAppointments])

  const avgVisits = useMemo(
    () => (uniqueClients.length > 0 ? completedAppointments.length / uniqueClients.length : 0),
    [uniqueClients, completedAppointments]
  )

  const filteredClients = useMemo(
    () =>
      uniqueClients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone.includes(searchTerm)
      ),
    [uniqueClients, searchTerm]
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (uniqueClients.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum cliente ainda</h3>
        <p className="text-gray-600">
          Seus clientes aparecerão aqui automaticamente após você completar atendimentos
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueClients.length}</div>
            <p className="text-xs text-muted-foreground">clientes atendidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedAppointments.length}</div>
            <p className="text-xs text-muted-foreground">serviços completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Cliente</CardTitle>
            <User className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{avgVisits.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">atendimentos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meus Clientes</CardTitle>
          <CardDescription>Clientes que você já atendeu, ordenados por frequência</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="divide-y">
            {filteredClients.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Nenhum cliente encontrado para essa busca</p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 bg-amber-100 text-amber-700 flex items-center justify-center rounded-full font-semibold shrink-0">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900">{client.name}</h4>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {client.phone && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </span>
                        )}
                        {client.lastVisit && (
                          <span className="text-sm text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(client.lastVisit), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        R$ {client.totalSpent.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">faturado</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {client.totalVisits} {client.totalVisits === 1 ? "visita" : "visitas"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
