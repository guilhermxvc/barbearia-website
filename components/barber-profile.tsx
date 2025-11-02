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

  useEffect(() => {
    if (user?.barber) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        specialties: user.barber.specialties || "",
      })
      loadPendingRequest()
    }
  }, [user])

  const loadPendingRequest = async () => {
    try {
      const response = await apiClient.get('/barbers/requests/pending')
      if (response.success && response.data) {
        setPendingRequest(response.data)
      } else {
        setPendingRequest(null)
      }
    } catch (error) {
      console.error('Error loading pending request:', error)
      setPendingRequest(null)
    }
  }

  const handleLinkBarbershop = async () => {
    if (!linkData.barbershopCode.trim()) {
      toast.error("Digite o código da barbearia")
      return
    }

    try {
      setLinkLoading(true)
      const response = await apiClient.post('/barbers/link', {
        barbershopCode: linkData.barbershopCode,
        message: linkData.message || undefined,
      })

      if (response.success) {
        toast.success(response.message || "Solicitação enviada com sucesso!")
        setLinkData({ barbershopCode: "", message: "" })
        await loadPendingRequest()
        await refreshUser()
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
      const response = await apiClient.delete('/barbers/link')

      if (response.success) {
        toast.success("Solicitação cancelada com sucesso")
        setPendingRequest(null)
        await refreshUser()
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
      const response = await apiClient.put(`/barbers/${user?.barber?.id}`, {
        specialties: profileData.specialties,
      })

      if (response.success) {
        setIsEditing(false)
        alert("Perfil atualizado com sucesso! Recarregue a página para ver as alterações.")
      } else {
        alert("Erro ao atualizar perfil")
      }
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      alert("Erro ao salvar perfil")
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
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={profileData.phone} disabled />
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

          <div className="space-y-2">
            <Label>Taxa de Comissão (%)</Label>
            <Input
              type="text"
              value={`${user?.barber?.commissionRate || 0}%`}
              disabled
            />
            <p className="text-xs text-gray-500">
              A taxa de comissão é definida pelo dono da barbearia
            </p>
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
          {user.barber.isApproved && user.barber.barbershop ? (
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
          ) : pendingRequest ? (
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
