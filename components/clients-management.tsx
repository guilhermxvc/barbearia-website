"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Calendar, 
  Download, 
  Mail, 
  Phone, 
  Plus, 
  Search, 
  Upload, 
  User, 
  UserCheck,
  Filter,
  FileX,
  Edit,
  Trash2,
  Users
} from "lucide-react"
import { clientsApi, Client } from "@/lib/api/clients"
import { useAuth } from "@/contexts/AuthContext"

export function ClientsManagement() {
  const { user } = useAuth()
  const barbershopId = user?.barbershop?.id
  
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    if (barbershopId) {
      loadClients()
    }
  }, [barbershopId])

  const loadClients = async () => {
    if (!barbershopId) {
      setError("ID da barbearia não encontrado")
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      const response = await clientsApi.getAll(barbershopId, searchTerm || undefined)
      
      if (response.success && response.data) {
        setClients(response.data)
      } else {
        setError(response.error || "Erro ao carregar clientes")
      }
    } catch (err) {
      setError("Erro ao carregar clientes")
      console.error("Load clients error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClient = async (clientData: { name: string; email: string; phone?: string }) => {
    if (!barbershopId) {
      setError("ID da barbearia não encontrado")
      return
    }
    
    try {
      setLoading(true)

      const response = await clientsApi.create({
        barbershopId,
        ...clientData,
      })

      if (response.success) {
        await loadClients()
        setShowCreateForm(false)
      } else {
        setError(response.error || "Erro ao criar cliente")
      }
    } catch (err) {
      setError("Erro ao criar cliente")
      console.error("Create client error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateClient = async (clientId: string, updates: { name?: string; phone?: string }) => {
    try {
      setLoading(true)
      
      const response = await clientsApi.update(clientId, updates)
      
      if (response.success) {
        await loadClients()
        setEditingClient(null)
      } else {
        setError(response.error || "Erro ao atualizar cliente")
      }
    } catch (err) {
      setError("Erro ao atualizar cliente")
      console.error("Update client error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivateClient = async (clientId: string) => {
    if (!confirm("Tem certeza que deseja desativar este cliente?")) return
    
    try {
      setLoading(true)
      
      const response = await clientsApi.deactivate(clientId)
      
      if (response.success) {
        await loadClients()
      } else {
        setError(response.error || "Erro ao desativar cliente")
      }
    } catch (err) {
      setError("Erro ao desativar cliente")
      console.error("Deactivate client error:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm)

    return matchesSearch
  })

  const handleExportClients = () => {
    const csvContent = [
      ["Nome", "Email", "Telefone", "Total Visitas", "Total Gasto", "Última Visita"],
      ...filteredClients.map((client) => [
        client.name || "",
        client.email || "",
        client.phone || "",
        client.totalVisits || 0,
        `R$ ${client.totalSpent || '0.00'}`,
        client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('pt-BR') : "",
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const newThisMonth = clients.filter(c => 
    new Date(c.createdAt).getMonth() === new Date().getMonth() &&
    new Date(c.createdAt).getFullYear() === new Date().getFullYear()
  ).length

  const activeClients = clients.filter(c => c.totalVisits > 0).length

  const totalRevenue = clients.reduce((sum, c) => sum + parseFloat(c.totalSpent || '0'), 0)

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Este Mês</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{newThisMonth}</div>
            <p className="text-xs text-muted-foreground">este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Calendar className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{activeClients}</div>
            <p className="text-xs text-muted-foreground">com visitas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <Download className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">acumulada</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações e filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Gerenciar Clientes</CardTitle>
              <CardDescription>Visualize e gerencie todos os seus clientes</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportClients}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={() => setShowCreateForm(true)} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Busca */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={loadClients}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          <div className="divide-y">
            {filteredClients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">Nenhum cliente encontrado</h3>
                <p className="text-sm text-gray-500">
                  {clients.length === 0 
                    ? "Ainda não há clientes cadastrados." 
                    : "Tente ajustar os filtros de busca."}
                </p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 bg-blue-100 text-blue-700 flex items-center justify-center rounded-full font-semibold shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-gray-900">{client.name}</h4>
                        <Badge variant={client.totalVisits > 0 ? "default" : "secondary"} className="text-xs">
                          {client.totalVisits > 0 ? "Ativo" : "Novo"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {client.email && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </span>
                        )}
                        {client.phone && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="text-sm text-gray-500">{client.totalVisits || 0} visitas</span>
                        <span className="text-sm font-semibold text-green-600">R$ {client.totalSpent || '0.00'}</span>
                        {client.lastVisit && (
                          <span className="text-sm text-gray-400">
                            Última: {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingClient(client)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeactivateClient(client.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de criação de cliente */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>Adicione um novo cliente à sua base</DialogDescription>
          </DialogHeader>
          <ClientForm
            onClose={() => setShowCreateForm(false)}
            onSave={handleCreateClient}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de edição de cliente */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Modifique os dados do cliente</DialogDescription>
          </DialogHeader>
          {editingClient && (
            <ClientForm
              client={editingClient}
              onClose={() => setEditingClient(null)}
              onSave={(updates) => handleUpdateClient(editingClient.id, updates)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ClientForm({ client, onClose, onSave }: { 
  client?: Client; 
  onClose: () => void; 
  onSave: (data: any) => void 
}) {
  const [formData, setFormData] = useState({
    name: client?.name || "",
    email: client?.email || "",
    phone: client?.phone || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (client) {
      // Edição - não permite alterar email
      onSave({
        name: formData.name,
        phone: formData.phone,
      })
    } else {
      // Criação
      onSave(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome Completo</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: João Silva"
          required
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="joao@email.com"
          disabled={!!client} // Não permite alterar email em edição
          required={!client}
        />
      </div>

      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="(11) 99999-9999"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
          {client ? "Atualizar" : "Criar"} Cliente
        </Button>
      </div>
    </form>
  )
}