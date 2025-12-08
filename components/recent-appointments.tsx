"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, User, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface Appointment {
  id: string
  client: string
  service: string
  barber: string
  time: string
  status: string
  value: string
}

export function RecentAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAppointments = async () => {
      if (!user?.barbershop?.id) {
        setLoading(false)
        return
      }

      try {
        const today = new Date().toISOString().split("T")[0]
        const response = await fetch(
          `/api/appointments?barbershopId=${user.barbershop.id}&date=${today}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        )

        if (!response.ok) {
          setError("Erro ao carregar agendamentos")
          setAppointments([])
          return
        }

        const data = await response.json()

        if (data.success && data.appointments) {
          const formattedAppointments = data.appointments
            .slice(0, 5)
            .map((apt: any) => {
              const scheduledTime = new Date(apt.scheduledAt)
              const hours = scheduledTime.getHours().toString().padStart(2, "0")
              const minutes = scheduledTime.getMinutes().toString().padStart(2, "0")

              const statusMap: Record<string, string> = {
                pending: "pendente",
                confirmed: "confirmado",
                in_progress: "em-andamento",
                completed: "concluido",
                cancelled: "cancelado",
                no_show: "no-show",
              }

              const price = apt.totalPrice || apt.service?.price || 0
              const formattedPrice = new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(price)

              return {
                id: apt.id,
                client: apt.client?.name || "Cliente",
                service: apt.service?.name || "Serviço",
                barber: apt.barber?.name || "Barbeiro",
                time: `${hours}:${minutes}`,
                status: statusMap[apt.status] || apt.status,
                value: formattedPrice,
              }
            })

          setAppointments(formattedAppointments)
        } else {
          setAppointments([])
        }
      } catch (err) {
        console.error("Erro ao carregar agendamentos:", err)
        setError("Erro ao carregar agendamentos")
        setAppointments([])
      } finally {
        setLoading(false)
      }
    }

    loadAppointments()
  }, [user?.barbershop?.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "bg-green-100 text-green-800"
      case "em-andamento":
        return "bg-blue-100 text-blue-800"
      case "concluido":
        return "bg-gray-100 text-gray-800"
      case "cancelado":
        return "bg-red-100 text-red-800"
      case "pendente":
        return "bg-yellow-100 text-yellow-800"
      case "no-show":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmado":
        return "Confirmado"
      case "em-andamento":
        return "Em Andamento"
      case "concluido":
        return "Concluído"
      case "cancelado":
        return "Cancelado"
      case "pendente":
        return "Pendente"
      case "no-show":
        return "Não Compareceu"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        <span className="ml-2 text-gray-600">Carregando agendamentos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Tentar Novamente
        </Button>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhum agendamento para hoje.</p>
        <p className="text-sm mt-2">Os agendamentos aparecerão aqui quando forem criados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{appointment.client}</p>
              <p className="text-sm text-gray-500">{appointment.service}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {appointment.time} - {appointment.barber}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">{appointment.value}</p>
            <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
              {getStatusLabel(appointment.status)}
            </Badge>
          </div>
        </div>
      ))}
      <Button variant="outline" className="w-full bg-transparent">
        Ver Todos os Agendamentos
      </Button>
    </div>
  )
}
