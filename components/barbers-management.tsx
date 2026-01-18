"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Trash2, User, Users, UserCheck } from "lucide-react"
import { barbersApi, Barber, BarberRequest } from "@/lib/api/barbers"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"

interface BarbersManagementProps {
  userPlan: string
  barberLimit: number
}

export function BarbersManagement({ userPlan, barberLimit }: BarbersManagementProps) {
  const { user } = useAuth()
  const barbershopId = user?.barbershop?.id
  
  const [pendingRequests, setPendingRequests] = useState<BarberRequest[]>([])
  const [currentBarbers, setCurrentBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null)

  // Carregar dados
  useEffect(() => {
    if (barbershopId) {
      loadData()
    }
  }, [barbershopId])

  const loadData = async () => {
    if (!barbershopId) {
      setError("ID da barbearia não encontrado")
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      // Carregar barbeiros ativos
      const barbersResponse = await barbersApi.getAll(barbershopId)
      if (barbersResponse.success && barbersResponse.data) {
        setCurrentBarbers(barbersResponse.data)
      }

      // Carregar solicitações pendentes
      const requestsResponse = await barbersApi.getRequests(barbershopId)
      if (requestsResponse.success && requestsResponse.data) {
        setPendingRequests(requestsResponse.data.filter(req => req.status === 'pending'))
      }
    } catch (err) {
      setError("Erro ao carregar dados")
      console.error("Load barbers error:", err)
    } finally {
      setLoading(false)
    }
  }

  const canAddMoreBarbers = () => {
    if (barberLimit === -1) return true // Premium - ilimitado
    return currentBarbers.filter((b) => b.isActive).length < barberLimit
  }

  const handleBarberRequest = async (requestId: string, action: "approve" | "reject") => {
    try {
      setLoading(true)
      
      if (action === "approve" && !canAddMoreBarbers()) {
        setError("Limite de barbeiros atingido para o plano atual")
        setLoading(false)
        return
      }

      const response = await barbersApi.handleRequest(requestId, action)
      
      if (response.success) {
        await loadData()
      } else {
        setError(response.error || "Erro ao processar solicitação")
      }
    } catch (err) {
      setError("Erro ao processar solicitação")
      console.error("Handle request error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBarber = async (barberId: string, updates: Partial<Barber>) => {
    try {
      setLoading(true)
      
      const response = await barbersApi.update(barberId, updates)
      
      if (response.success) {
        await loadData()
        setEditingBarber(null)
      } else {
        setError(response.error || "Erro ao atualizar barbeiro")
      }
    } catch (err) {
      setError("Erro ao atualizar barbeiro")
      console.error("Update barber error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivateBarber = async (barberId: string) => {
    if (!confirm("Tem certeza que deseja desativar este barbeiro?")) return
    
    try {
      setLoading(true)
      
      const response = await barbersApi.deactivate(barberId)
      
      if (response.success) {
        await loadData()
      } else {
        setError(response.error || "Erro ao desativar barbeiro")
      }
    } catch (err) {
      setError("Erro ao desativar barbeiro")
      console.error("Deactivate barber error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg">Carregando barbeiros...</div>
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

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Barbeiros Ativos</TabsTrigger>
          <TabsTrigger value="requests">
            Solicitações ({pendingRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Barbeiros Ativos ({currentBarbers.filter((b) => b.isActive).length}/
                {barberLimit === -1 ? "∞" : barberLimit})
              </CardTitle>
              <CardDescription>
                Gerencie os barbeiros da sua equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentBarbers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum barbeiro encontrado</h3>
                  <p className="text-gray-600">Ainda não há barbeiros cadastrados na sua barbearia.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {currentBarbers.map((barber) => (
                    <div key={barber.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{barber.name}</h3>
                              <p className="text-sm text-gray-600">{barber.email}</p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {Array.isArray(barber.specialties) && barber.specialties.map((specialty, index) => (
                              <Badge key={index} variant="outline">
                                {specialty}
                              </Badge>
                            ))}
                          </div>

                          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                            <Badge variant={barber.isActive ? "default" : "secondary"}>
                              {barber.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingBarber(barber)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeactivateBarber(barber.id)}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Solicitações Pendentes ({pendingRequests.length})
              </CardTitle>
              <CardDescription>
                Aprove ou rejeite solicitações de novos barbeiros
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma solicitação pendente</h3>
                  <p className="text-gray-600">Todas as solicitações foram processadas.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{request.name}</h3>
                              <p className="text-sm text-gray-600">{request.email}</p>
                              {request.phone && (
                                <p className="text-sm text-gray-600">{request.phone}</p>
                              )}
                            </div>
                          </div>

                          {request.message && (
                            <div className="mt-3 p-3 bg-gray-50 rounded">
                              <p className="text-sm">{request.message}</p>
                            </div>
                          )}

                          <p className="text-sm text-gray-500 mt-2">
                            Solicitado em: {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleBarberRequest(request.id, "approve")}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={loading}
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBarberRequest(request.id, "reject")}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                            disabled={loading}
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

      {/* Modal de edição de barbeiro */}
      <Dialog open={!!editingBarber} onOpenChange={() => setEditingBarber(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Barbeiro</DialogTitle>
            <DialogDescription>Modifique os dados do barbeiro</DialogDescription>
          </DialogHeader>
          {editingBarber && (
            <BarberForm
              barber={editingBarber}
              onClose={() => setEditingBarber(null)}
              onSave={(updates) => handleUpdateBarber(editingBarber.id, updates)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BarberForm({ barber, onClose, onSave }: { 
  barber: Barber; 
  onClose: () => void; 
  onSave: (updates: Partial<Barber>) => void 
}) {
  const [formData, setFormData] = useState({
    specialties: Array.isArray(barber.specialties) ? barber.specialties : [],
    isActive: barber.isActive,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const addSpecialty = () => {
    setFormData({
      ...formData,
      specialties: [...formData.specialties, ""]
    })
  }

  const updateSpecialty = (index: number, value: string) => {
    const newSpecialties = [...formData.specialties]
    newSpecialties[index] = value
    setFormData({
      ...formData,
      specialties: newSpecialties
    })
  }

  const removeSpecialty = (index: number) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter((_, i) => i !== index)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Especialidades</Label>
        <div className="space-y-2">
          {formData.specialties.map((specialty, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={specialty}
                onChange={(e) => updateSpecialty(index, e.target.value)}
                placeholder="Ex: Corte Clássico"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeSpecialty(index)}
              >
                Remover
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addSpecialty}>
            Adicionar Especialidade
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
        />
        <Label htmlFor="isActive">Barbeiro ativo</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
          Atualizar Barbeiro
        </Button>
      </div>
    </form>
  )
}