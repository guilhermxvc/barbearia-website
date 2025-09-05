"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, User, Star, Phone } from "lucide-react"

export function ClientAppointments() {
  const upcomingAppointments = [
    {
      id: 1,
      barbershop: "Barbearia Premium",
      address: "Rua das Flores, 123",
      service: "Corte Clássico",
      barber: "Carlos Silva",
      date: "2024-01-18",
      time: "14:30",
      price: 25,
      status: "confirmado",
      phone: "(11) 99999-1111",
    },
    {
      id: 2,
      barbershop: "Barbearia Moderna",
      address: "Av. Principal, 456",
      service: "Combo Corte + Barba",
      barber: "João Santos",
      date: "2024-01-22",
      time: "10:00",
      price: 40,
      status: "confirmado",
      phone: "(11) 99999-2222",
    },
  ]

  const pastAppointments = [
    {
      id: 3,
      barbershop: "Barbearia Premium",
      address: "Rua das Flores, 123",
      service: "Barba Completa",
      barber: "Carlos Silva",
      date: "2024-01-10",
      time: "15:00",
      price: 20,
      status: "concluido",
      rating: 5,
      review: "Excelente atendimento! Carlos é muito profissional.",
    },
    {
      id: 4,
      barbershop: "Barbearia Clássica",
      address: "Rua Antiga, 789",
      service: "Corte Tradicional",
      barber: "Pedro Costa",
      date: "2024-01-05",
      time: "16:30",
      price: 22,
      status: "concluido",
      rating: 4,
      review: "Bom serviço, ambiente agradável.",
    },
    {
      id: 5,
      barbershop: "Barbearia Moderna",
      address: "Av. Principal, 456",
      service: "Degradê Moderno",
      barber: "João Santos",
      date: "2023-12-28",
      time: "11:00",
      price: 35,
      status: "concluido",
      rating: 5,
      review: "Adorei o resultado! João entende muito do que faz.",
    },
  ]

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
          {upcomingAppointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{appointment.barbershop}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {appointment.address}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {appointment.barber} - {appointment.service}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {new Date(appointment.date).toLocaleDateString("pt-BR")} às {appointment.time}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {appointment.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                    <p className="text-lg font-semibold text-green-600 mt-2">R$ {appointment.price}</p>
                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" variant="outline">
                        Reagendar
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 bg-transparent">
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
          {pastAppointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{appointment.barbershop}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {appointment.address}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {appointment.barber} - {appointment.service}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {new Date(appointment.date).toLocaleDateString("pt-BR")} às {appointment.time}
                        </div>
                      </div>
                      {appointment.review && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center mb-1">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < appointment.rating! ? "text-yellow-400 fill-current" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">Sua avaliação</span>
                          </div>
                          <p className="text-sm text-blue-800">{appointment.review}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                    <p className="text-lg font-semibold text-gray-600 mt-2">R$ {appointment.price}</p>
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
