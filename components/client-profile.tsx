"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, MapPin, Calendar, Star } from "lucide-react"

export function ClientProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "João Cliente",
    email: "joao@email.com",
    phone: "(11) 99999-0000",
    address: "Rua das Palmeiras, 456 - Vila Nova",
    city: "São Paulo",
    preferences: {
      favoriteServices: ["Corte Clássico", "Barba"],
      preferredTime: "Manhã",
      notifications: true,
    },
  })

  const stats = {
    totalAppointments: 15,
    totalSpent: 420,
    favoriteBarbershop: "Barbearia Premium",
    memberSince: "2023-06-15",
    averageRating: 4.8,
  }

  const handleSave = () => {
    setIsEditing(false)
    console.log("Dados salvos:", profileData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <Button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className={isEditing ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
        >
          {isEditing ? "Salvar" : "Editar Perfil"}
        </Button>
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
                  <h3 className="text-xl font-semibold text-gray-900">{profileData.name}</h3>
                  <p className="text-gray-600">
                    Cliente desde {new Date(stats.memberSince).toLocaleDateString("pt-BR")}
                  </p>
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm font-medium">{stats.averageRating}</span>
                    <span className="ml-2 text-sm text-gray-500">avaliação média dada</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferências */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Preferências</CardTitle>
              <CardDescription>Configure suas preferências de agendamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Serviços Favoritos</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profileData.preferences.favoriteServices.map((service, index) => (
                    <Badge key={index} variant="outline">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="preferredTime">Horário Preferido</Label>
                <select
                  id="preferredTime"
                  className="w-full mt-1 p-2 border rounded-md"
                  disabled={!isEditing}
                  value={profileData.preferences.preferredTime}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      preferences: { ...profileData.preferences, preferredTime: e.target.value },
                    })
                  }
                >
                  <option value="Manhã">Manhã (8h - 12h)</option>
                  <option value="Tarde">Tarde (12h - 18h)</option>
                  <option value="Noite">Noite (18h - 20h)</option>
                  <option value="Qualquer">Qualquer horário</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={profileData.preferences.notifications}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        preferences: { ...profileData.preferences, notifications: e.target.checked },
                      })
                    }
                    disabled={!isEditing}
                  />
                  <span className="text-sm">Receber notificações de lembretes e promoções</span>
                </label>
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
                <p className="text-2xl font-bold text-purple-600">{stats.totalAppointments}</p>
                <p className="text-sm text-gray-600">Agendamentos Realizados</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">R$ {stats.totalSpent}</p>
                <p className="text-sm text-gray-600">Total Investido</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-lg font-bold text-amber-600">{stats.favoriteBarbershop}</p>
                <p className="text-sm text-gray-600">Barbearia Favorita</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cidade:</span>
                  <span className="font-medium">{profileData.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Barbearias próximas:</span>
                  <span className="font-medium">12 encontradas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Raio de busca:</span>
                  <span className="font-medium">5 km</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-800">Barbearia Premium</p>
                  <p className="text-sm text-green-600">18/01 às 14:30</p>
                  <p className="text-sm text-green-600">Corte Clássico</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-800">Barbearia Moderna</p>
                  <p className="text-sm text-blue-600">22/01 às 10:00</p>
                  <p className="text-sm text-blue-600">Combo Corte + Barba</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
