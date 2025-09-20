"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Clock, User, Calendar } from "lucide-react"
import { appointmentsApi, Appointment } from "@/lib/api/appointments"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function BarberSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30"
  ]

  useEffect(() => {
    loadAppointments()
  }, [currentDate])

  const loadAppointments = async () => {
    setLoading(true)
    setError("")
    
    try {
      const barbershopId = localStorage.getItem('barbershopId')
      const barberId = localStorage.getItem('barberId') // Para barbeiros
      
      if (!barbershopId) {
        setError("ID da barbearia não encontrado")
        return
      }

      // Buscar agendamentos da semana atual
      const weekStart = getWeekStart(currentDate)
      const weekEnd = getWeekEnd(currentDate)
      
      const filters: any = {
        barbershopId,
        status: 'confirmed'
      }
      
      // Se for barbeiro, filtrar apenas seus agendamentos
      if (barberId) {
        filters.barberId = barberId
      }

      const response = await appointmentsApi.list(filters)
      
      if (response.success && response.data) {
        // Filtrar agendamentos da semana atual
        const weekAppointments = response.data.appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.scheduledAt)
          return appointmentDate >= weekStart && appointmentDate <= weekEnd
        })
        
        setAppointments(weekAppointments)
      } else {
        setError(response.error || "Erro ao carregar agendamentos")
      }
    } catch (err) {
      setError("Erro ao carregar agendamentos")
      console.error("Load appointments error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getWeekStart = (date: Date) => {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    start.setHours(0, 0, 0, 0)
    return start
  }

  const getWeekEnd = (date: Date) => {
    const end = new Date(date)
    end.setDate(date.getDate() + (6 - date.getDay()))
    end.setHours(23, 59, 59, 999)
    return end
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const formatTime = (date: Date) => {
    return date.toTimeString().slice(0, 5)
  }

  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }

  const getAppointmentForSlot = (date: Date, time: string) => {
    const dateStr = formatDate(date)
    return appointments.find(appointment => {
      const appointmentDate = formatDate(new Date(appointment.scheduledAt))
      const appointmentTime = formatTime(new Date(appointment.scheduledAt))
      return appointmentDate === dateStr && appointmentTime === time
    })
  }

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      setLoading(true)
      
      const response = await appointmentsApi.updateStatus(appointmentId, newStatus)
      
      if (response.success) {
        await loadAppointments()
        setSelectedAppointment(null)
      } else {
        setError(response.error || "Erro ao atualizar agendamento")
      }
    } catch (err) {
      setError("Erro ao atualizar agendamento")
      console.error("Update appointment error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return "bg-blue-100 border-blue-200 text-blue-800"
      case 'in_progress':
        return "bg-yellow-100 border-yellow-200 text-yellow-800"
      case 'completed':
        return "bg-green-100 border-green-200 text-green-800"
      case 'cancelled':
        return "bg-red-100 border-red-200 text-red-800"
      default:
        return "bg-gray-100 border-gray-200 text-gray-800"
    }
  }

  const weekDates = getWeekDates(currentDate)

  if (loading && appointments.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg">Carregando agenda...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(currentDate)
                  newDate.setDate(currentDate.getDate() - 7)
                  setCurrentDate(newDate)
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(currentDate)
                  newDate.setDate(currentDate.getDate() + 7)
                  setCurrentDate(newDate)
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-600" />
              <span className="font-medium">Agenda da Semana</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-2">
            {/* Header com dias da semana */}
            <div className="text-center font-medium text-gray-600 p-2">Horário</div>
            {weekDates.map((date, index) => (
              <div key={index} className="text-center p-2">
                <div className="text-sm font-medium text-gray-900">{weekDays[date.getDay()]}</div>
                <div className="text-xs text-gray-600">{date.getDate()}</div>
              </div>
            ))}

            {/* Grade de horários */}
            {timeSlots.map((time) => (
              <div key={time} className="contents">
                <div className="text-center text-sm text-gray-600 p-2 border-r">{time}</div>
                {weekDates.map((date, dayIndex) => {
                  const appointment = getAppointmentForSlot(date, time)
                  const isToday = formatDate(date) === formatDate(new Date())

                  return (
                    <div
                      key={`${formatDate(date)}-${time}`}
                      className={`p-1 border border-gray-100 min-h-[60px] ${
                        isToday ? "bg-amber-50" : "bg-white"
                      } hover:bg-gray-50`}
                    >
                      {appointment && (
                        <div 
                          className={`${getStatusColor(appointment.status)} rounded p-2 text-xs cursor-pointer hover:opacity-80`}
                          onClick={() => setSelectedAppointment(appointment)}
                        >
                          <div className="font-medium truncate">{appointment.client.name}</div>
                          <div className="text-xs truncate">{appointment.service.name}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{appointment.duration}min</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalhes do agendamento */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>Visualize e gerencie o agendamento</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Cliente</label>
                  <p className="text-lg font-semibold">{selectedAppointment.client.name}</p>
                  {selectedAppointment.client.phone && (
                    <p className="text-sm text-gray-600">{selectedAppointment.client.phone}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Serviço</label>
                  <p className="text-lg font-semibold">{selectedAppointment.service.name}</p>
                  <p className="text-sm text-gray-600">R$ {selectedAppointment.service.price}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Data e Hora</label>
                  <p className="text-lg font-semibold">
                    {new Date(selectedAppointment.scheduledAt).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedAppointment.scheduledAt).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Duração</label>
                  <p className="text-lg font-semibold">{selectedAppointment.duration} minutos</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="mt-2">
                  <Badge className={getStatusColor(selectedAppointment.status)}>
                    {selectedAppointment.status === 'confirmed' && 'Confirmado'}
                    {selectedAppointment.status === 'in_progress' && 'Em Andamento'}
                    {selectedAppointment.status === 'completed' && 'Concluído'}
                    {selectedAppointment.status === 'cancelled' && 'Cancelado'}
                  </Badge>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Observações</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Ações do agendamento */}
              <div className="flex gap-2 pt-4">
                {selectedAppointment.status === 'confirmed' && (
                  <>
                    <Button
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'in_progress')}
                      className="bg-yellow-600 hover:bg-yellow-700"
                      disabled={loading}
                    >
                      Iniciar Atendimento
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'cancelled')}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  </>
                )}
                {selectedAppointment.status === 'in_progress' && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedAppointment.id, 'completed')}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    Finalizar Atendimento
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}