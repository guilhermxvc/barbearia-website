"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { User, Star, Award, Building2, AlertTriangle, CheckCircle } from "lucide-react"

export function BarberProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [newBarbershopCode, setNewBarbershopCode] = useState("")
  const [isChangingBarbershop, setIsChangingBarbershop] = useState(false)
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false)

  const [profileData, setProfileData] = useState({
    name: "Carlos Silva",
    email: "carlos@barberpro.com",
    phone: "(11) 99999-1111",
    bio: "Barbeiro profissional com mais de 8 anos de experiência. Especialista em cortes clássicos e modernos.",
    specialties: ["Corte Clássico", "Barba", "Degradê", "Desenhos"],
    workingHours: "Segunda a Sábado: 8h às 18h",
  })

  const stats = {
    totalClients: 156,
    totalAppointments: 1240,
    averageRating: 4.9,
    monthlyEarnings: 4250,
    joinDate: "2023-01-15",
  }

  const recentReviews = [
    {
      id: 1,
      client: "João Silva",
      rating: 5,
      comment: "Excelente profissional! Corte perfeito e atendimento impecável.",
      date: "2024-01-10",
    },
    {
      id: 2,
      client: "Pedro Costa",
      rating: 5,
      comment: "Sempre saio satisfeito. Carlos é muito atencioso e caprichoso.",
      date: "2024-01-08",
    },
    {
      id: 3,
      client: "Lucas Santos",
      rating: 4,
      comment: "Ótimo barbeiro, ambiente agradável. Recomendo!",
      date: "2024-01-05",
    },
  ]

  const handleSave = () => {
    setIsEditing(false)
    // Aqui seria implementada a lógica para salvar os dados
    console.log("Dados salvos:", profileData)
  }

  const handleUnlinkBarbershop = () => {
    // Remove o barbeiro da lista de barbeiros da barbearia no localStorage
    const pendingRequests = JSON.parse(localStorage.getItem("pendingBarberRequests") || "[]")
    const approvedBarbers = JSON.parse(localStorage.getItem("approvedBarbers") || "[]")

    // Remove das listas se existir
    const updatedApproved = approvedBarbers.filter((barber: any) => barber.email !== profileData.email)
    localStorage.setItem("approvedBarbers", JSON.stringify(updatedApproved))

    // Limpa dados de vinculação do barbeiro
    localStorage.removeItem("barberBarbershopCode")
    localStorage.removeItem("barberBarbershopName")

    setShowUnlinkConfirm(false)
    alert("Desvinculação realizada com sucesso! Você não está mais vinculado a nenhuma barbearia.")
  }

  const handleLinkNewBarbershop = () => {
    if (!newBarbershopCode.trim()) {
      alert("Por favor, insira o código da barbearia.")
      return
    }

    // Simula validação do código (em um sistema real, seria uma consulta ao backend)
    const validCodes = {
      BB001: "Barbearia Básica",
      BP002: "Barbearia Premium",
      BPR003: "Barbearia Profissional",
    }

    const barbershopName = validCodes[newBarbershopCode as keyof typeof validCodes]

    if (!barbershopName) {
      alert("Código de barbearia inválido. Verifique com o proprietário da barbearia.")
      return
    }

    // Cria solicitação de vinculação
    const newRequest = {
      id: Date.now(),
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      specialties: profileData.specialties,
      barbershopCode: newBarbershopCode,
      barbershopName: barbershopName,
      requestDate: new Date().toISOString(),
      status: "pending",
    }

    // Adiciona à lista de solicitações pendentes
    const pendingRequests = JSON.parse(localStorage.getItem("pendingBarberRequests") || "[]")
    pendingRequests.push(newRequest)
    localStorage.setItem("pendingBarberRequests", JSON.stringify(pendingRequests))

    // Armazena dados temporários do barbeiro
    localStorage.setItem("barberBarbershopCode", newBarbershopCode)
    localStorage.setItem("barberBarbershopName", barbershopName)

    setNewBarbershopCode("")
    setIsChangingBarbershop(false)
    alert(`Solicitação enviada para ${barbershopName}! Aguarde a aprovação do proprietário.`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meu Perfil</h2>
          <p className="text-gray-600">Gerencie suas informações pessoais e profissionais</p>
        </div>
        <Button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className={isEditing ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
        >
          {isEditing ? "Salvar" : "Editar Perfil"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Informações Pessoais */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Seus dados básicos e informações de contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{profileData.name}</h3>
                  <p className="text-gray-600">Barbeiro Profissional</p>
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm font-medium">{stats.averageRating}</span>
                    <span className="ml-2 text-sm text-gray-500">({stats.totalAppointments} avaliações)</span>
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
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div>
                <Label>Especialidades</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profileData.specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="workingHours">Horário de Trabalho</Label>
                <Input
                  id="workingHours"
                  value={profileData.workingHours}
                  onChange={(e) => setProfileData({ ...profileData, workingHours: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-amber-600" />
                Vinculação com Barbearia
              </CardTitle>
              <CardDescription>Gerencie sua vinculação com barbearias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Barbearia Atual</p>
                    <p className="text-sm text-gray-600">Barbearia Premium</p>
                    <Badge className="mt-1 bg-green-100 text-green-800">Vinculado</Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUnlinkConfirm(true)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Desvincular
                  </Button>
                </div>
              </div>

              {showUnlinkConfirm && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900">Confirmar Desvinculação</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Tem certeza que deseja se desvincular desta barbearia? Você perderá acesso ao sistema e
                        precisará solicitar nova vinculação.
                      </p>
                      <div className="flex space-x-2 mt-3">
                        <Button size="sm" onClick={handleUnlinkBarbershop} className="bg-red-600 hover:bg-red-700">
                          Confirmar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowUnlinkConfirm(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Vincular a Nova Barbearia</h4>
                  <Button variant="outline" size="sm" onClick={() => setIsChangingBarbershop(!isChangingBarbershop)}>
                    {isChangingBarbershop ? "Cancelar" : "Alterar Barbearia"}
                  </Button>
                </div>

                {isChangingBarbershop && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="barbershopCode">Código da Nova Barbearia</Label>
                      <Input
                        id="barbershopCode"
                        placeholder="Ex: BB001, BP002, BPR003"
                        value={newBarbershopCode}
                        onChange={(e) => setNewBarbershopCode(e.target.value.toUpperCase())}
                      />
                      <p className="text-xs text-gray-500 mt-1">Solicite o código com o proprietário da barbearia</p>
                    </div>
                    <Button onClick={handleLinkNewBarbershop} className="w-full bg-amber-600 hover:bg-amber-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Solicitar Vinculação
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-amber-600" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{stats.totalClients}</p>
                <p className="text-sm text-gray-600">Clientes Atendidos</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.totalAppointments}</p>
                <p className="text-sm text-gray-600">Total de Serviços</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">R$ {stats.monthlyEarnings}</p>
                <p className="text-sm text-gray-600">Faturamento Mensal</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <p className="text-2xl font-bold text-purple-600 ml-1">{stats.averageRating}</p>
                </div>
                <p className="text-sm text-gray-600">Avaliação Média</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Membro desde:</span>
                <span className="font-medium">{new Date(stats.joinDate).toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge className="bg-green-100 text-green-800">Ativo</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Barbearia:</span>
                <span className="font-medium">Barbearia Premium</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Avaliações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliações Recentes</CardTitle>
          <CardDescription>Feedback dos seus clientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReviews.map((review) => (
              <div key={review.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{review.client}</span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString("pt-BR")}</span>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
