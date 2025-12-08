"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { User, Loader2, Building2, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

export function BarberProfile() {
  const { user, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [linkLoading, setLinkLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialties: "",
  })
  const [linkData, setLinkData] = useState({
    barbershopCode: "",
    message: "",
  })
  const [pendingRequest, setPendingRequest] = useState<any>(null)
  const [wasEverApproved, setWasEverApproved] = useState(false)

  useEffect(() => {
    if (user?.barber) {
      const nameParts = (user.name || "").split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""
      const specialtiesStr = Array.isArray(user.barber.specialties) 
        ? user.barber.specialties.join(", ") 
        : (user.barber.specialties || "")
      
      setProfileData({
        firstName,
        lastName,
        email: user.email || "",
        phone: user.phone || "",
        specialties: specialtiesStr,
      })
      loadPendingRequest()
    }
  }, [user])

  const loadPendingRequest = async () => {
    try {
      const response = await apiClient.get<{ success: boolean; data: any; wasEverApproved: boolean }>('/barbers/requests/pending')
      if (response.success && response.data) {
        const apiData = response.data as { success: boolean; data: any; wasEverApproved: boolean }
        setPendingRequest(apiData.data)
        setWasEverApproved(apiData.wasEverApproved || false)
      } else {
        setPendingRequest(null)
        setWasEverApproved(false)
      }
    } catch (error) {
      console.error('Error loading pending request:', error)
      setPendingRequest(null)
      setWasEverApproved(false)
    }
  }

  const handleLinkBarbershop = async () => {
    if (!linkData.barbershopCode.trim()) {
      toast.error("Digite o código da barbearia")
      return
    }

    try {
      setLinkLoading(true)
      const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>('/barbers/link', {
        barbershopCode: linkData.barbershopCode,
        message: linkData.message || undefined,
      })

      if (response.success && response.data) {
        const apiData = response.data as { success: boolean; message?: string; error?: string }
        if (apiData.success) {
          toast.success(apiData.message || "Solicitação enviada com sucesso!")
          setLinkData({ barbershopCode: "", message: "" })
          await loadPendingRequest()
          await refreshUser()
        } else {
          toast.error(apiData.error || "Erro ao enviar solicitação")
        }
      } else {
        toast.error(response.error || "Erro ao enviar solicitação")
      }
    } catch (error: any) {
      console.error("Error linking barbershop:", error)
      toast.error(error.message || "Erro ao enviar solicitação")
    } finally {
      setLinkLoading(false)
    }
  }

  const handleCancelRequest = async () => {
    try {
      setLinkLoading(true)
      const response = await apiClient.delete<{ success: boolean; message?: string; error?: string }>('/barbers/link')

      if (response.success && response.data) {
        const apiData = response.data as { success: boolean; message?: string; error?: string }
        if (apiData.success) {
          toast.success(apiData.message || "Solicitação cancelada com sucesso")
          setPendingRequest(null)
          await refreshUser()
        } else {
          toast.error(apiData.error || "Erro ao cancelar solicitação")
        }
      } else {
        toast.error(response.error || "Erro ao cancelar solicitação")
      }
    } catch (error) {
      console.error("Error canceling request:", error)
      toast.error("Erro ao cancelar solicitação")
    } finally {
      setLinkLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const response = await apiClient.put<{ success: boolean; message?: string; error?: string }>('/barbers/profile', {
        phone: profileData.phone,
        specialties: profileData.specialties,
      })

      if (response.success && response.data) {
        const apiData = response.data as { success: boolean; message?: string; error?: string }
        if (apiData.success) {
          setIsEditing(false)
          toast.success(apiData.message || "Perfil atualizado com sucesso!")
          await refreshUser()
        } else {
          toast.error(apiData.error || "Erro ao atualizar perfil")
        }
      } else {
        toast.error(response.error || "Erro ao atualizar perfil")
      }
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      toast.error("Erro ao salvar perfil")
    } finally {
      setLoading(false)
    }
  }

  if (!user?.barber) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Gerencie suas informações de perfil</CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Editar</Button>
            ) : (
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={profileData.firstName} disabled />
            </div>
            <div className="space-y-2">
              <Label>Sobrenome</Label>
              <Input value={profileData.lastName} disabled />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profileData.email} disabled />
              <p className="text-xs text-gray-500">O email não pode ser alterado</p>
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input 
                value={profileData.phone} 
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                disabled={!isEditing}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Especialidades</Label>
            <Textarea
              value={profileData.specialties}
              onChange={(e) => setProfileData({ ...profileData, specialties: e.target.value })}
              disabled={!isEditing}
              placeholder="Ex: Cortes clássicos, degradê, barba, etc."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Barbearia Vinculada
          </CardTitle>
          <CardDescription>
            {user.barber.barbershop ? "Informações da barbearia" : "Vincule-se a uma barbearia"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.barber.isApproved && user.barber.isActive && user.barber.barbershop ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Nome da Barbearia</p>
                  <p className="text-lg font-semibold">{user.barber.barbershop.name}</p>
                </div>
                <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Aprovado
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Endereço</p>
                <p className="text-base">{user.barber.barbershop.address || "Não informado"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Telefone</p>
                <p className="text-base">{user.barber.barbershop.phone || "Não informado"}</p>
              </div>
            </div>
          ) : pendingRequest && pendingRequest.status === 'pending' ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900 mb-1">Solicitação Pendente</p>
                    <p className="text-sm text-amber-800">
                      Sua solicitação está aguardando aprovação do dono da barbearia.
                    </p>
                    {pendingRequest.barbershop?.name && (
                      <p className="text-sm text-amber-700 mt-2">
                        <strong>Barbearia:</strong> {pendingRequest.barbershop.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleCancelRequest}
                disabled={linkLoading}
                className="w-full"
              >
                {linkLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar Solicitação
                  </>
                )}
              </Button>
            </div>
          ) : pendingRequest && pendingRequest.status === 'rejected' ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-900 mb-1">Solicitação Rejeitada</p>
                    <p className="text-sm text-red-800">
                      Sua solicitação de vínculo foi rejeitada pelo dono da barbearia.
                    </p>
                    {pendingRequest.barbershop?.name && (
                      <p className="text-sm text-red-700 mt-2">
                        <strong>Barbearia:</strong> {pendingRequest.barbershop.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setPendingRequest(null)}
                className="w-full"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Tentar Outra Barbearia
              </Button>
            </div>
          ) : wasEverApproved && !user.barber.isApproved && !user.barber.isActive && !user.barber.barbershopId ? (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Desvinculado</p>
                    <p className="text-sm text-gray-700">
                      Você foi desvinculado da barbearia anterior. Você pode solicitar vínculo com outra barbearia.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="barbershopCode">Código da Barbearia</Label>
                  <Input
                    id="barbershopCode"
                    placeholder="Ex: ABC123"
                    value={linkData.barbershopCode}
                    onChange={(e) => setLinkData({ ...linkData, barbershopCode: e.target.value.toUpperCase() })}
                    disabled={linkLoading}
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem (Opcional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Apresente-se ao dono da barbearia..."
                    value={linkData.message}
                    onChange={(e) => setLinkData({ ...linkData, message: e.target.value })}
                    disabled={linkLoading}
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleLinkBarbershop}
                  disabled={linkLoading || !linkData.barbershopCode.trim()}
                  className="w-full"
                >
                  {linkLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 mr-2" />
                      Enviar Solicitação
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">Não vinculado</p>
                    <p className="text-sm text-blue-800">
                      Você ainda não está vinculado a nenhuma barbearia. Digite o código fornecido pelo dono da barbearia para enviar uma solicitação.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="barbershopCode">Código da Barbearia</Label>
                  <Input
                    id="barbershopCode"
                    placeholder="Ex: ABC123"
                    value={linkData.barbershopCode}
                    onChange={(e) => setLinkData({ ...linkData, barbershopCode: e.target.value.toUpperCase() })}
                    disabled={linkLoading}
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem (Opcional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Apresente-se ao dono da barbearia..."
                    value={linkData.message}
                    onChange={(e) => setLinkData({ ...linkData, message: e.target.value })}
                    disabled={linkLoading}
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleLinkBarbershop}
                  disabled={linkLoading || !linkData.barbershopCode.trim()}
                  className="w-full"
                >
                  {linkLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 mr-2" />
                      Enviar Solicitação
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
