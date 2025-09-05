"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Trash2, User, Star, Calendar, Users, UserCheck } from "lucide-react"

interface BarbersManagementProps {
  userPlan: string
  barberLimit: number
}

export function BarbersManagement({ userPlan, barberLimit }: BarbersManagementProps) {
  const [pendingRequests, setPendingRequests] = useState([
    {
      id: 1,
      name: "Maria Silva",
      email: "maria@email.com",
      phone: "(11) 98765-4321",
      requestDate: "2024-01-15",
      specialties: ["Corte Feminino", "Escova"],
    },
    {
      id: 2,
      name: "João Santos",
      email: "joao@email.com",
      phone: "(11) 97654-3210",
      requestDate: "2024-01-14",
      specialties: ["Barba", "Degradê"],
    },
  ])

  const [currentBarbers, setCurrentBarbers] = useState([
    {
      id: 1,
      name: "Carlos Silva",
      email: "carlos@barberpro.com",
      phone: "(11) 99999-1111",
      specialties: ["Corte Clássico", "Barba", "Degradê"],
      rating: 4.9,
      appointmentsToday: 8,
      status: "ativo",
      joinDate: "2023-01-15",
    },
    {
      id: 2,
      name: "João Santos",
      email: "joao@barberpro.com",
      phone: "(11) 99999-2222",
      specialties: ["Corte Moderno", "Desenhos", "Coloração"],
      rating: 4.7,
      appointmentsToday: 6,
      status: "ativo",
      joinDate: "2023-03-20",
    },
    {
      id: 3,
      name: "Pedro Costa",
      email: "pedro@barberpro.com",
      phone: "(11) 99999-3333",
      specialties: ["Barba Completa", "Tratamentos", "Relaxamento"],
      rating: 4.8,
      appointmentsToday: 5,
      status: "inativo",
      joinDate: "2023-06-10",
    },
  ])

  const canAddMoreBarbers = () => {
    if (barberLimit === -1) return true // Premium - ilimitado
    return currentBarbers.filter((b) => b.status === "ativo").length < barberLimit
  }

  const handleBarberRequest = (requestId: number, action: "approve" | "reject") => {
    const request = pendingRequests.find((r) => r.id === requestId)
    if (!request) return

    if (action === "approve") {
      if (!canAddMoreBarbers()) {
        alert(`Limite de barbeiros atingido para o plano ${userPlan}. Faça upgrade para adicionar mais barbeiros.`)
        return
      }

      const newBarber = {
        id: Date.now(),
        name: request.name,
        email: request.email,
        phone: request.phone,
        specialties: request.specialties,
        rating: 0,
        appointmentsToday: 0,
        status: "ativo" as const,
        joinDate: new Date().toISOString().split("T")[0],
      }

      setCurrentBarbers((prev) => [...prev, newBarber])
      alert(`Barbeiro ${request.name} foi aprovado e vinculado à barbearia!`)
    } else {
      alert(`Solicitação de ${request.name} foi rejeitada.`)
    }

    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
  }

  const getBarberLimitText = () => {
    if (barberLimit === -1) return "Barbeiros ilimitados"
    const activeBarbers = currentBarbers.filter((b) => b.status === "ativo").length
    return `${activeBarbers}/${barberLimit} barbeiros`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="outline" className="mt-2">
            {getBarberLimitText()}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="barbers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="barbers" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Barbeiros Ativos
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center">
            <UserCheck className="h-4 w-4 mr-2" />
            Solicitações ({pendingRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="barbers" className="space-y-4">
          {currentBarbers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum barbeiro cadastrado</p>
                <p className="text-sm text-gray-400 mt-1">
                  Compartilhe o código da barbearia para que barbeiros possam se vincular
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {currentBarbers.map((barber) => (
                <Card key={barber.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{barber.name}</h3>
                          <p className="text-gray-600">{barber.email}</p>
                          <p className="text-gray-600">{barber.phone}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="ml-1 text-sm font-medium">{barber.rating}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="ml-1 text-sm text-gray-600">{barber.appointmentsToday} hoje</span>
                            </div>
                            <Badge variant={barber.status === "ativo" ? "default" : "secondary"}>{barber.status}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Especialidades:</p>
                      <div className="flex flex-wrap gap-2">
                        {barber.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Solicitações Pendentes
                <Badge variant="secondary">{pendingRequests.length} pendentes</Badge>
              </CardTitle>
              <CardDescription>
                Aprove ou rejeite solicitações de barbeiros que usaram seu código da barbearia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p>Nenhuma solicitação pendente</p>
                  <p className="text-sm mt-1">Barbeiros aparecerão aqui quando usarem seu código</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{request.name}</h4>
                          <p className="text-sm text-gray-600">{request.email}</p>
                          <p className="text-sm text-gray-600">{request.phone}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {request.specialties.map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Solicitação enviada em {new Date(request.requestDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleBarberRequest(request.id, "approve")}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={!canAddMoreBarbers()}
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBarberRequest(request.id, "reject")}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                      {!canAddMoreBarbers() && (
                        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                          Limite de barbeiros atingido para o plano {userPlan}. Faça upgrade para adicionar mais
                          barbeiros.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
