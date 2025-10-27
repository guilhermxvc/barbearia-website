"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function ClientProfile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      })
      loadAppointments()
    }
  }, [user])

  const loadAppointments = async () => {
    if (!user?.client?.id) return

    try {
      const response = await apiClient.get(`/appointments?clientId=${user.client.id}`)

      if (response.success && response.data?.appointments) {
        setAppointments(response.data.appointments)
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const response = await apiClient.put(`/clients/${user?.client?.id}`, {
        phone: profileData.phone,
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

  const memberSince = user.createdAt ? new Date(user.createdAt) : new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-amber-600 hover:bg-amber-700">
            Editar Perfil
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Informações Pessoais */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Seus dados básicos e informações de contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {profileData.firstName} {profileData.lastName}
                  </h3>
                  <p className="text-gray-600">
                    Cliente desde {format(memberSince, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    disabled
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profileData.email}
                  disabled
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{completedAppointments.length}</p>
                <p className="text-sm text-gray-600">Agendamentos Realizados</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">R$ {totalSpent.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Investido</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{appointments.length}</p>
                <p className="text-sm text-gray-600">Total de Agendamentos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">Nenhum agendamento futuro</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.slice(0, 2).map((appointment) => (
                    <div key={appointment.id} className="p-3 bg-green-50 rounded-lg">
                      <p className="font-medium text-green-800">
                        {appointment.barbershop?.name || "Barbearia"}
                      </p>
                      <p className="text-sm text-green-600">
                        {format(new Date(appointment.scheduledAt), "dd/MM 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                      <p className="text-sm text-green-600">{appointment.service?.name || "Serviço"}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
