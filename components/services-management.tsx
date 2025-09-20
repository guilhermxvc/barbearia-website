"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { servicesApi } from "@/lib/api/services"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Scissors, Clock, DollarSign, Eye, Search } from "lucide-react"

interface Service {
  id: string
  name: string
  description: string
  price: string
  duration: number
  category: string
  isActive: boolean
  barbershopId: string
  createdAt: string
  updatedAt: string
}

export function ServicesManagement() {
  const [services, setServices] = useState<Service[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("todos")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)


  useEffect(() => {
    loadServices()
  }, [])

  const handleDeleteService = async (serviceId: string) => {
    try {
      setDeleting(serviceId)
      const response = await servicesApi.delete(serviceId)
      
      if (response.success) {
        // Recarregar lista de serviços
        loadServices()
      } else {
        console.error("Erro ao excluir serviço:", response.error)
        alert("Erro ao excluir serviço. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro ao excluir serviço:", error)
      alert("Erro de conexão. Tente novamente.")
    } finally {
      setDeleting(null)
    }
  }

  const loadServices = async () => {
    try {
      setLoading(true)
      
      // Buscar ID da barbearia do localStorage
      const barbershopId = localStorage.getItem('barbershopId')
      
      if (barbershopId) {
        const response = await servicesApi.list(barbershopId)
        
        if (response.success && response.data) {
          // Mapear os dados da API para a interface local
          const mappedServices = response.data.services.map(service => ({
            ...service,
            category: "Corte", // Adicionar categoria padrão já que não temos no schema
          }))
          setServices(mappedServices)
        } else {
          console.error("Erro ao carregar serviços:", response.error)
          setServices([])
        }
      } else {
        // Usuário não tem barbershopId - mostrar estado vazio
        console.warn("barbershopId não encontrado no localStorage")
        setServices([])
      }
    } catch (error) {
      console.error("Erro ao carregar serviços:", error)
      setServices([]) // Mostrar estado vazio em vez de mock
    } finally {
      setLoading(false)
    }
  }

  const categories = ["Corte", "Barba", "Combo", "Especial", "Tratamento"]

  const getCategoryColor = (category: string) => {
    const colors = {
      Corte: "bg-blue-100 text-blue-800",
      Barba: "bg-green-100 text-green-800",
      Combo: "bg-purple-100 text-purple-800",
      Especial: "bg-orange-100 text-orange-800",
      Tratamento: "bg-pink-100 text-pink-800",
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "todos" || service.category === categoryFilter
    const matchesStatus =
      statusFilter === "todos" || 
      (statusFilter === "ativo" && service.isActive) ||
      (statusFilter === "inativo" && !service.isActive)

    return matchesSearch && matchesCategory && matchesStatus
  })

  const serviceStats = {
    total: services.length,
    active: services.filter((s) => s.isActive).length,
    inactive: services.filter((s) => !s.isActive).length,
    avgPrice: services.length > 0 ? services.reduce((sum, s) => sum + parseFloat(s.price || '0'), 0) / services.length : 0,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Serviços</p>
                <p className="text-3xl font-bold text-gray-900">{serviceStats.total}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Scissors className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Serviços Ativos</p>
                <p className="text-3xl font-bold text-green-600">{serviceStats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <div className="h-6 w-6 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Serviços Inativos</p>
                <p className="text-3xl font-bold text-red-600">{serviceStats.inactive}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <div className="h-6 w-6 bg-red-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Preço Médio</p>
                <p className="text-3xl font-bold text-amber-600">R$ {serviceStats.avgPrice.toFixed(0)}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Serviços</CardTitle>
              <CardDescription>Configure e gerencie todos os serviços da barbearia</CardDescription>
            </div>
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Serviço
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Serviço</DialogTitle>
                  <DialogDescription>Preencha os dados do novo serviço</DialogDescription>
                </DialogHeader>
                <ServiceForm onClose={() => setShowAddForm(false)} onSave={loadServices} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar serviços..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                className={`transition-all hover:shadow-md ${!service.isActive ? "opacity-60" : ""}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-amber-100 rounded-full">
                        <Scissors className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                          <Badge className={getCategoryColor(service.category)}>{service.category}</Badge>
                          <Badge variant={service.isActive ? "default" : "secondary"}>
                            {service.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{service.description}</p>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">R$ {parseFloat(service.price || '0').toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-600">{service.duration} min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detalhes do Serviço</DialogTitle>
                          </DialogHeader>
                          <ServiceDetails service={service} />
                        </DialogContent>
                      </Dialog>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Editar Serviço</DialogTitle>
                            <DialogDescription>Modifique os dados do serviço</DialogDescription>
                          </DialogHeader>
                          <ServiceForm service={service} onClose={() => setEditingService(null)} onSave={loadServices} />
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 bg-transparent"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este serviço?")) {
                            handleDeleteService(service.id)
                          }
                        }}
                        disabled={deleting === service.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredServices.length === 0 && (
              <div className="text-center py-12">
                <Scissors className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum serviço encontrado</h3>
                <p className="text-gray-600">Tente ajustar os filtros ou adicione um novo serviço.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ServiceForm({ service, onClose, onSave }: { service?: Service; onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    price: service?.price || "0",
    duration: service?.duration || 30,
    category: service?.category || "",
    isActive: service?.isActive ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const categories = ["Corte", "Barba", "Combo", "Especial", "Tratamento"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const barbershopId = localStorage.getItem('barbershopId')
      
      if (!barbershopId) {
        setError("Erro: ID da barbearia não encontrado")
        return
      }

      const serviceData = {
        barbershopId,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        duration: formData.duration,
        isActive: formData.isActive
      }

      let response

      if (service) {
        // Editando serviço existente
        response = await servicesApi.update(service.id, serviceData)
      } else {
        // Criando novo serviço
        response = await servicesApi.create(serviceData)
      }

      if (response.success) {
        onSave() // Recarrega a lista
        onClose() // Fecha o modal
      } else {
        setError(response.error || "Erro ao salvar serviço")
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.")
      console.error("Service save error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Serviço</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Corte Clássico"
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva o serviço oferecido..."
          rows={3}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Preço (R$)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0,00"
            required
          />
        </div>
        <div>
          <Label htmlFor="duration">Duração (minutos)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: Number.parseInt(e.target.value) })}
            placeholder="30"
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="active"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
        />
        <Label htmlFor="active">Serviço ativo</Label>
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-amber-600 hover:bg-amber-700"
          disabled={loading}
        >
          {loading ? "Salvando..." : (service ? "Atualizar" : "Adicionar")} Serviço
        </Button>
      </div>
    </form>
  )
}

function ServiceDetails({ service }: { service: Service }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-600">Nome</Label>
          <p className="text-lg font-semibold">{service.name}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600">Categoria</Label>
          <Badge className="mt-1">{service.category}</Badge>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-600">Descrição</Label>
        <p className="text-gray-900 mt-1">{service.description}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-600">Preço</Label>
          <p className="text-lg font-semibold text-green-600">R$ {parseFloat(service.price || '0').toFixed(2)}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600">Duração</Label>
          <p className="text-lg font-semibold text-blue-600">{service.duration} min</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600">Status</Label>
          <Badge variant={service.isActive ? "default" : "secondary"} className="mt-1">
            {service.isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </div>
    </div>
  )
}
