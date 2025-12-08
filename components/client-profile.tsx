"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, Loader2, TrendingUp, Clock, DollarSign } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

function ProfilePhoto({ photoUrl, name }: { photoUrl?: string; name?: string }) {
  const [imageError, setImageError] = useState(false)
  const initial = name?.charAt(0)?.toUpperCase() || 'C'
  
  return (
    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-200 flex items-center justify-center">
      {photoUrl && !imageError ? (
        <img 
          src={photoUrl} 
          alt="Foto de perfil" 
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-3xl font-bold text-amber-600">{initial}</span>
      )}
    </div>
  )
}

export function ClientProfile() {
  const { user, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    photoUrl: "",
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        photoUrl: user.photoUrl || "",
      })
      loadAppointments()
    }
  }, [user])

  const loadAppointments = async () => {
    if (!user?.client?.id) return

    try {
      const response = await apiClient.get<{ success: boolean; appointments: any[] }>(`/appointments?clientId=${user.client.id}`)

      if (response.success && response.data) {
        const apiData = response.data as { success: boolean; appointments: any[] }
        if (apiData.appointments) {
          setAppointments(apiData.appointments)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const response = await apiClient.put<{ success: boolean; message?: string; error?: string }>('/clients/profile', {
        phone: profileData.phone,
        photoUrl: profileData.photoUrl,
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

  if (!user?.client) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  const completedAppointments = appointments.filter((a) => a.status === "completed")
  const totalSpent = completedAppointments.reduce((sum, a) => sum + (Number(a.totalPrice) || 0), 0)
  const upcomingAppointments = appointments.filter(
    (a) => new Date(a.scheduledAt) > new Date() && a.status !== "cancelled"
  )

  const memberSince = (user as any).createdAt ? new Date((user as any).createdAt) : new Date()

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
              <Button onClick={() => setIsEditing(true)} className="bg-amber-600 hover:bg-amber-700">
                Editar
              </Button>
            ) : (
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              <ProfilePhoto photoUrl={profileData.photoUrl} name={profileData.name} />
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                Cliente desde {format(memberSince, "MMM yyyy", { locale: ptBR })}
              </Badge>
            </div>
            <div className="flex-1 space-y-4">
              {isEditing && (
                <div className="space-y-2">
                  <Label>URL da Foto de Perfil</Label>
                  <Input 
                    value={profileData.photoUrl} 
                    onChange={(e) => setProfileData({ ...profileData, photoUrl: e.target.value })}
                    placeholder="https://exemplo.com/sua-foto.jpg"
                  />
                  <p className="text-xs text-gray-500">Cole a URL de uma imagem para sua foto de perfil</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input value={profileData.name} disabled />
            <p className="text-xs text-gray-500">O nome não pode ser alterado</p>
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
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Agendamentos Realizados</p>
                <p className="text-3xl font-bold text-amber-800">{completedAppointments.length}</p>
              </div>
              <div className="p-3 bg-amber-200 rounded-full">
                <Calendar className="h-6 w-6 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Investido</p>
                <p className="text-3xl font-bold text-green-800">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSpent)}
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <DollarSign className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total de Agendamentos</p>
                <p className="text-3xl font-bold text-blue-800">{appointments.length}</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Próximos Agendamentos
          </CardTitle>
          <CardDescription>Seus agendamentos futuros</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Nenhum agendamento futuro</p>
              <p className="text-sm text-gray-400 mt-1">Agende um serviço na aba de busca</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 3).map((appointment) => (
                <div 
                  key={appointment.id} 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {appointment.barbershop?.name || "Barbearia"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.service?.name || "Serviço"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-700">
                      {format(new Date(appointment.scheduledAt), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-green-600">
                      às {format(new Date(appointment.scheduledAt), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
              {upcomingAppointments.length > 3 && (
                <p className="text-center text-sm text-gray-500 pt-2">
                  +{upcomingAppointments.length - 3} mais agendamentos
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
