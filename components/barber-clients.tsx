"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Search, Phone, Calendar, Star, Users, TrendingUp, Clock, Filter } from "lucide-react"

export function BarberClients() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock data - replace with real API call
  useEffect(() => {
    const mockClients = [
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
        status: "active",
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
        status: "active",
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
        status: "vip",
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
        status: "active",
      },
    ]

    setTimeout(() => {
      setClients(mockClients)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || client.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const totalClients = clients.length
  const activeClients = clients.filter((c) => c.status === "active" || c.status === "vip").length
  const vipClients = clients.filter((c) => c.status === "vip").length
  const avgRating =
    clients.length > 0 ? (clients.reduce((sum, c) => sum + c.rating, 0) / clients.length).toFixed(1) : "0"

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "vip":
        return <Badge className="bg-purple-100 text-purple-800">VIP</Badge>
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                <p className="text-3xl font-bold text-gray-900">{totalClients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
                <p className="text-3xl font-bold text-green-600">{activeClients}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes VIP</p>
                <p className="text-3xl font-bold text-purple-600">{vipClients}</p>
              </div>
              <Star className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avaliação Média</p>
                <div className="flex items-center">
                  <p className="text-3xl font-bold text-yellow-600">{avgRating}</p>
                  <Star className="h-6 w-6 text-yellow-400 fill-current ml-1" />
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Meus Clientes</span>
            <Badge variant="outline">{filteredClients.length} clientes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {client.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{client.name}</h4>
                      {getStatusBadge(client.status)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {client.phone}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {client.totalVisits} visitas
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(client.lastVisit).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">{client.preferredService}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < client.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4 mr-1" />
                    Contato
                  </Button>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                    Agendar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cliente encontrado</h3>
              <p className="text-gray-600">Tente ajustar sua busca ou aguarde novos agendamentos.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
