"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { User, Search, Phone, Calendar, Star } from "lucide-react"

export function BarberClients() {
  const [searchTerm, setSearchTerm] = useState("")

  const clients = [
    {
      id: 1,
      name: "Carlos Silva",
      phone: "(11) 99999-1111",
      email: "carlos@email.com",
      lastVisit: "2024-01-10",
      totalVisits: 15,
      preferredService: "Corte Clássico",
      notes: "Cliente prefere conversa moderada, gosta de café",
      rating: 5,
      nextAppointment: "2024-01-20",
    },
    {
      id: 2,
      name: "Pedro Santos",
      phone: "(11) 99999-2222",
      email: "pedro@email.com",
      lastVisit: "2024-01-08",
      totalVisits: 8,
      preferredService: "Combo Corte + Barba",
      notes: "Primeira vez na barbearia, muito simpático",
      rating: 5,
      nextAppointment: null,
    },
    {
      id: 3,
      name: "João Costa",
      phone: "(11) 99999-3333",
      email: "joao@email.com",
      lastVisit: "2024-01-05",
      totalVisits: 22,
      preferredService: "Barba Completa",
      notes: "Cliente regular, sempre pontual, gosta de óleo premium",
      rating: 5,
      nextAppointment: "2024-01-18",
    },
    {
      id: 4,
      name: "Lucas Oliveira",
      phone: "(11) 99999-4444",
      email: "lucas@email.com",
      lastVisit: "2024-01-03",
      totalVisits: 5,
      preferredService: "Degradê Moderno",
      notes: "Jovem, gosta de cortes modernos e desenhos",
      rating: 4,
      nextAppointment: "2024-01-22",
    },
  ]

  const filteredClients = clients.filter((client) => client.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{client.name}</h3>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < client.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {client.phone}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Última visita: {new Date(client.lastVisit).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p>
                          Total de visitas: <span className="font-medium">{client.totalVisits}</span>
                        </p>
                        <p>
                          Serviço preferido: <span className="font-medium">{client.preferredService}</span>
                        </p>
                      </div>
                    </div>
                    {client.notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Observações:</strong> {client.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {client.nextAppointment && (
                    <Badge className="bg-green-100 text-green-800">
                      Próximo: {new Date(client.nextAppointment).toLocaleDateString("pt-BR")}
                    </Badge>
                  )}
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4 mr-1" />
                      Ligar
                    </Button>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                      Agendar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cliente encontrado</h3>
            <p className="text-gray-600">Tente ajustar sua busca ou aguarde novos agendamentos.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
