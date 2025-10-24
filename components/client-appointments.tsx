"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, User, Star, Phone } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { appointmentsApi, Appointment } from "@/lib/api/appointments"
import { format } from "date-fns"

export function ClientAppointments() {
  const { user } = useAuth()
  const clientId = user?.client?.id
  
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (clientId) {
      loadAppointments()
    }
  }, [clientId])

  const loadAppointments = async () => {
    if (!clientId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await appointmentsApi.list({ clientId })
      
      if (response.success && response.data) {
        setAppointments(response.data.appointments)
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

  const now = new Date()
  const upcomingAppointments = appointments.filter(apt => new Date(apt.scheduledAt) >= now)
  const pastAppointments = appointments.filter(apt => new Date(apt.scheduledAt) < now)

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return

    try {
      const response = await appointmentsApi.updateStatus(appointmentId, "cancelled")
      
      if (response.success) {
        loadAppointments()
      } else {
        alert("Erro ao cancelar agendamento")
      }
    } catch (err) {
      alert("Erro ao cancelar agendamento")
      console.error("Cancel appointment error:", err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "bg-green-100 text-green-800"
      case "concluido":
        return "bg-gray-100 text-gray-800"
      case "cancelado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">Próximos ({upcomingAppointments.length})</TabsTrigger>
          <TabsTrigger value="past">Histórico ({pastAppointments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-600">Carregando agendamentos...</p>
              </CardContent>
            </Card>
          ) : upcomingAppointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {appointment.barbershop?.name || "Barbearia"}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {appointment.barber.name} - {appointment.service.name}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {format(new Date(appointment.scheduledAt), "dd/MM/yyyy 'às' HH:mm")}
                        </div>
                        {appointment.client.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {appointment.client.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                    <p className="text-lg font-semibold text-green-600 mt-2">
                      R$ {parseFloat(appointment.totalPrice).toFixed(2)}
                    </p>
                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" variant="outline">
                        Reagendar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700 bg-transparent"
                        onClick={() => handleCancelAppointment(appointment.id)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {upcomingAppointments.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento próximo</h3>
                <p className="text-gray-600 mb-4">Que tal agendar um novo serviço?</p>
                <Button className="bg-amber-600 hover:bg-amber-700">Agendar Serviço</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-600">Carregando histórico...</p>
              </CardContent>
            </Card>
          ) : pastAppointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {appointment.barbershop?.name || "Barbearia"}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {appointment.barber.name} - {appointment.service.name}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {format(new Date(appointment.scheduledAt), "dd/MM/yyyy 'às' HH:mm")}
                        </div>
                      </div>
                      {appointment.notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                    <p className="text-lg font-semibold text-gray-600 mt-2">
                      R$ {parseFloat(appointment.totalPrice).toFixed(2)}
                    </p>
                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                        Agendar Novamente
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
