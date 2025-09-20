"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Search, Download, Upload, Calendar, Phone, Mail, Gift, Plus, MoreHorizontal, Cake } from "lucide-react"

interface Client {
  id: string
  name: string
  email: string
  phone: string
  birth_date?: string
  address?: string
  total_appointments: number
  last_appointment?: string
  total_spent: number
  status: "active" | "inactive"
  created_at: string
}

export function ClientsManagement() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [birthdayClients, setBirthdayClients] = useState<Client[]>([])

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)

      // Simular delay de carregamento
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Usar apenas dados mock
      setClients(mockClients)
      setBirthdayClients(getMockBirthdayClients())
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
      setClients(mockClients)
      setBirthdayClients(getMockBirthdayClients())
    } finally {
      setLoading(false)
    }
  }

  const getBirthdayClients = (clientsList: Client[]) => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentDay = today.getDate()

    return clientsList.filter((client) => {
      if (!client.birth_date) return false
      const birthDate = new Date(client.birth_date)
      const birthMonth = birthDate.getMonth()
      const birthDay = birthDate.getDate()

      // Aniversariantes de hoje ou próximos 7 dias
      const daysDiff = Math.abs(currentDay - birthDay)
      return birthMonth === currentMonth && daysDiff <= 7
    })
  }

  const getMockBirthdayClients = () => {
    return mockClients.filter((client) => client.birth_date).slice(0, 3)
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)

    const matchesFilter = filterStatus === "all" || client.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const handleExportClients = () => {
    const csvContent = [
      [
        "Nome",
        "Email",
        "Telefone",
        "Data Nascimento",
        "Endereço",
        "Total Agendamentos",
        "Último Agendamento",
        "Total Gasto",
        "Status",
      ],
      ...filteredClients.map((client) => [
        client.name,
        client.email,
        client.phone,
        client.birth_date || "",
        client.address || "",
        client.total_appointments,
        client.last_appointment || "",
        `R$ ${client.total_spent.toFixed(2)}`,
        client.status === "active" ? "Ativo" : "Inativo",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `clientes_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImportClients = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".csv"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const csv = e.target?.result as string
          // Aqui você implementaria a lógica de parsing do CSV
          alert("Funcionalidade de importação será implementada em breve!")
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const clientStats = {
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    inactive: clients.filter((c) => c.status === "inactive").length,
    newThisMonth: clients.filter((c) => {
      const created = new Date(c.created_at)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length,
    birthdays: birthdayClients.length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
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
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{clientStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes Ativos</p>
                <p className="text-2xl font-bold text-green-600">{clientStats.active}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Novos Este Mês</p>
                <p className="text-2xl font-bold text-blue-600">{clientStats.newThisMonth}</p>
              </div>
              <Plus className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aniversariantes</p>
                <p className="text-2xl font-bold text-purple-600">{clientStats.birthdays}</p>
              </div>
              <Cake className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inativos</p>
                <p className="text-2xl font-bold text-red-600">{clientStats.inactive}</p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-red-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aniversariantes da Semana */}
      {birthdayClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="h-5 w-5 mr-2 text-purple-600" />
              Aniversariantes da Semana
            </CardTitle>
            <CardDescription>Clientes fazendo aniversário nos próximos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {birthdayClients.map((client) => (
                <div key={client.id} className="p-4 border rounded-lg bg-purple-50 border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-purple-900">{client.name}</h4>
                    <Cake className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-sm text-purple-700 mb-2">
                    {client.birth_date ? new Date(client.birth_date).toLocaleDateString("pt-BR") : "Data não informada"}
                  </p>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="text-purple-700 border-purple-300 bg-transparent">
                      <Phone className="h-3 w-3 mr-1" />
                      Ligar
                    </Button>
                    <Button size="sm" variant="outline" className="text-purple-700 border-purple-300 bg-transparent">
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Clientes</CardTitle>
              <CardDescription>Lista completa de clientes da barbearia</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleImportClients}>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button variant="outline" onClick={handleExportClients}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{client.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {client.email}
                      </span>
                      <span className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {client.phone}
                      </span>
                      {client.birth_date && (
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(client.birth_date).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{client.total_appointments} agendamentos</div>
                    <div className="font-semibold text-green-600">R$ {client.total_spent.toFixed(2)}</div>
                  </div>
                  <Badge
                    className={client.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {client.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredClients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum cliente encontrado para os filtros selecionados.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Mock data para fallback
const mockClients: Client[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@email.com",
    phone: "(11) 99999-1111",
    birth_date: "1990-03-15",
    address: "Rua A, 123",
    total_appointments: 15,
    last_appointment: "2024-01-10",
    total_spent: 675.0,
    status: "active",
    created_at: "2023-12-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Pedro Santos",
    email: "pedro@email.com",
    phone: "(11) 99999-2222",
    birth_date: "1985-01-20",
    address: "Rua B, 456",
    total_appointments: 8,
    last_appointment: "2024-01-08",
    total_spent: 320.0,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Carlos Lima",
    email: "carlos@email.com",
    phone: "(11) 99999-3333",
    birth_date: "1992-01-18",
    address: "Rua C, 789",
    total_appointments: 22,
    last_appointment: "2023-12-20",
    total_spent: 990.0,
    status: "inactive",
    created_at: "2023-11-15T00:00:00Z",
  },
]
