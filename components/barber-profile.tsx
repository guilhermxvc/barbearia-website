"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { User, Loader2, Building2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api"

export function BarberProfile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialties: "",
    commissionRate: 0,
  })

  useEffect(() => {
    if (user?.barber) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        specialties: user.barber.specialties || "",
        commissionRate: user.barber.commissionRate || 0,
      })
    }
  }, [user])

  const handleSave = async () => {
    try {
      setLoading(true)
      const response = await apiClient.put(`/barbers/${user?.barber?.id}`, {
        specialties: profileData.specialties,
        commissionRate: profileData.commissionRate,
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
              type="number"
              value={profileData.commissionRate}
              onChange={(e) =>
                setProfileData({ ...profileData, commissionRate: Number(e.target.value) })
              }
              disabled={!isEditing}
              min="0"
              max="100"
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
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Nome da Barbearia</p>
              <p className="text-lg font-semibold">{user.barber.barbershop?.name || "Não vinculado"}</p>
            </div>
            {user.barber.barbershop && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Endereço</p>
                  <p className="text-lg">{user.barber.barbershop.address || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className="bg-green-100 text-green-800">
                    {user.barber.isApproved ? "Aprovado" : "Pendente"}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
