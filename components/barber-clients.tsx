"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { User, Search, Users, TrendingUp, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function BarberClients() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClients()
  }, [user])

  const loadClients = async () => {
    try {
      setLoading(true)

      if (!user?.barber?.id) {
        return
      }

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

  const uniqueClients = appointments.reduce((acc: any[], appointment) => {
    if (appointment.client && !acc.find((c) => c.id === appointment.client.id)) {
      const clientName = appointment.client.user 
        ? `${appointment.client.user.firstName} ${appointment.client.user.lastName}`
        : appointment.client.name || "Cliente"
      const clientEmail = appointment.client.user?.email || appointment.client.email || ""
      const clientPhone = appointment.client.user?.phone || appointment.client.phone || ""
      
      acc.push({
        id: appointment.client.id,
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        totalVisits: appointments.filter((a) => a.client?.id === appointment.client.id).length,
      })
    }
    return acc
  }, [])

  const filteredClients = uniqueClients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  if (uniqueClients.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum cliente ainda</h3>
        <p className="text-gray-600">
          Seus clientes aparecerão aqui conforme você realiza atendimentos
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                <p className="text-3xl font-bold text-gray-900">{uniqueClients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Atendimentos</p>
                <p className="text-3xl font-bold text-green-600">{appointments.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Média por Cliente</p>
                <p className="text-3xl font-bold text-purple-600">
                  {uniqueClients.length > 0 ? (appointments.length / uniqueClients.length).toFixed(1) : "0"}
                </p>
              </div>
              <User className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar cliente por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-600">{client.email}</p>
                    {client.phone && <p className="text-sm text-gray-600">{client.phone}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-blue-100 text-blue-800">
                    {client.totalVisits} {client.totalVisits === 1 ? "visita" : "visitas"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
