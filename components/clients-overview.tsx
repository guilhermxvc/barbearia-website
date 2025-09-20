"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Gift, TrendingUp, Phone, Mail } from "lucide-react"

interface Client {
  id: string
  full_name: string
  email: string
  phone: string
  created_at: string
  birth_date?: string
  last_appointment?: string
  total_appointments: number
}

interface ClientStats {
  total: number
  newThisMonth: number
  activeClients: number
  birthdaysToday: number
  birthdaysThisWeek: number
}

export function ClientsOverview() {
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<ClientStats>({
    total: 0,
    newThisMonth: 0,
    activeClients: 0,
    birthdaysToday: 0,
    birthdaysThisWeek: 0,
  })
  const [birthdayClients, setBirthdayClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const mockClients: Client[] = [
    {
      id: "1",
      full_name: "João Silva",
      email: "joao@email.com",
      phone: "(11) 99999-9999",
      created_at: "2024-01-10",
      birth_date: "1990-01-20",
      last_appointment: "2024-01-15",
      total_appointments: 5,
    },
    {
      id: "2",
      full_name: "Pedro Santos",
      email: "pedro@email.com",
      phone: "(11) 88888-8888",
      created_at: "2024-01-05",
      birth_date: "1985-01-22",
      last_appointment: "2024-01-14",
      total_appointments: 3,
    },
    {
      id: "3",
      full_name: "Carlos Costa",
      email: "carlos@email.com",
      phone: "(11) 77777-7777",
      created_at: "2023-12-20",
      birth_date: "1992-01-25",
      last_appointment: "2024-01-13",
      total_appointments: 8,
    },
    {
      id: "4",
      full_name: "Roberto Lima",
      email: "roberto@email.com",
      phone: "(11) 66666-6666",
      created_at: "2024-01-12",
      birth_date: "1988-06-15",
      last_appointment: "2024-01-16",
      total_appointments: 2,
    },
  ]

  useEffect(() => {
    fetchClientsData()
  }, [])

  const fetchClientsData = async () => {
    try {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const clientsWithStats = mockClients

      setClients(clientsWithStats)

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const newThisMonth = clientsWithStats.filter((client) => new Date(client.created_at) >= startOfMonth).length

      const activeClients = clientsWithStats.filter((client) => client.total_appointments > 0).length

      const todayBirthdays = clientsWithStats.filter((client) => {
        if (!client.birth_date) return false
        const birthDate = new Date(client.birth_date)
        return birthDate.getMonth() === now.getMonth() && birthDate.getDate() === now.getDate()
      })

      const weekBirthdays = clientsWithStats.filter((client) => {
        if (!client.birth_date) return false
        const birthDate = new Date(client.birth_date)
        const thisYearBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate())
        return thisYearBirthday >= now && thisYearBirthday <= weekFromNow
      })

      setStats({
        total: clientsWithStats.length,
        newThisMonth,
        activeClients,
        birthdaysToday: todayBirthdays.length,
        birthdaysThisWeek: weekBirthdays.length,
      })

      setBirthdayClients(weekBirthdays)
    } catch (error) {
      console.error("Erro ao buscar dados dos clientes:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const getBirthdayMessage = (birthDate: string) => {
    const birth = new Date(birthDate)
    const now = new Date()
    const thisYearBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())

    if (thisYearBirthday.toDateString() === now.toDateString()) {
      return "Hoje!"
    } else {
      const daysUntil = Math.ceil((thisYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return `Em ${daysUntil} dia${daysUntil > 1 ? "s" : ""}`
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Novos Este Mês</p>
                <p className="text-2xl font-bold text-green-600">{stats.newThisMonth}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes Ativos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeClients}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aniversários Hoje</p>
                <p className="text-2xl font-bold text-purple-600">{stats.birthdaysToday}</p>
              </div>
              <Gift className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {birthdayClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="h-5 w-5 mr-2 text-purple-600" />
              Aniversariantes da Semana
            </CardTitle>
            <CardDescription>Clientes que fazem aniversário nos próximos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {birthdayClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg bg-purple-50">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Gift className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{client.full_name}</h4>
                      <p className="text-sm text-gray-600">
                        {client.total_appointments} agendamento{client.total_appointments !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-purple-600 hover:bg-purple-700">
                      {getBirthdayMessage(client.birth_date!)}
                    </Badge>
                    <div className="flex space-x-2">
                      {client.phone && (
                        <Button variant="outline" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                      {client.email && (
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Todos os Clientes</CardTitle>
          <CardDescription>Lista completa de clientes cadastrados na barbearia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clients.slice(0, 10).map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{client.full_name}</h4>
                    <p className="text-sm text-gray-600">{client.email}</p>
                    <p className="text-xs text-gray-500">Cliente desde {formatDate(client.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {client.total_appointments} agendamento{client.total_appointments !== 1 ? "s" : ""}
                    </div>
                    {client.last_appointment && (
                      <div className="text-xs text-gray-500">Último: {formatDate(client.last_appointment)}</div>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            ))}

            {clients.length > 10 && (
              <div className="text-center pt-4">
                <Button variant="outline">Ver Todos os {clients.length} Clientes</Button>
              </div>
            )}

            {clients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum cliente cadastrado ainda.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
