"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Search, Star, Loader2 } from "lucide-react"
import { ClientSidebar } from "@/components/client-sidebar"
import { BookingFlow } from "@/components/booking-flow"
import { ClientAppointments } from "@/components/client-appointments"
import { ClientProfile } from "@/components/client-profile"
import { AIAssistant } from "@/components/ai-assistant"
import { NotificationsSystem } from "@/components/notifications-system"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"

export default function ClientDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("search")

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
    if (!isLoading && user && user.userType !== 'client') {
      router.push(`/dashboard/${user.userType}`)
    }
  }, [isLoading, isAuthenticated, user, router])

  const sectionTitles = {
    search: {
      title: "Encontre sua Barbearia",
      description: "Agende seus serviços com os melhores profissionais",
    },
    appointments: {
      title: "Meus Agendamentos",
      description: "Gerencie seus agendamentos e histórico",
    },
    profile: {
      title: "Meu Perfil",
      description: "Gerencie suas informações pessoais",
    },
    favorites: {
      title: "Barbearias Favoritas",
      description: "Suas barbearias mais visitadas e preferidas",
    },
  }

  const renderContent = () => {
    switch (activeSection) {
      case "search":
        return <SearchSection />
      case "appointments":
        return <ClientAppointments />
      case "profile":
        return <ClientProfile />
      case "favorites":
        return <FavoritesSection />
      default:
        return <SearchSection />
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ClientSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{sectionTitles[activeSection as keyof typeof sectionTitles]?.title || "Dashboard"}</h1>
              <p className="text-gray-600">{sectionTitles[activeSection as keyof typeof sectionTitles]?.description || "Gerencie sua conta"}</p>
            </div>
            <NotificationsSystem userType="client" />
          </div>
          {renderContent()}
        </div>
      </main>
      <AIAssistant userType="client" userName={user.name} />
    </div>
  )
}

function SearchSection() {
  const [searchLocation, setSearchLocation] = useState("")
  const [selectedBarbershop, setSelectedBarbershop] = useState<any>(null)
  const [barbershops, setBarbershops] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadBarbershops()
  }, [])

  const loadBarbershops = async () => {
    try {
      setIsLoading(true)
      setError("")

      const response = await apiClient.get('/barbershops')

      if (response.success && response.barbershops) {
        setBarbershops(response.barbershops)
      } else {
        setError("Erro ao carregar barbearias")
      }
    } catch (error) {
      console.error("Erro ao carregar barbearias:", error)
      setError("Erro ao carregar barbearias")
    } finally {
      setIsLoading(false)
    }
  }

  if (selectedBarbershop) {
    return <BookingFlow barbershop={selectedBarbershop} onBack={() => setSelectedBarbershop(null)} />
  }

  return (
    <div className="space-y-6">
      {/* Busca por Localização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-amber-600" />
            Encontrar Barbearias Próximas
          </CardTitle>
          <CardDescription>Digite seu endereço ou permita acesso à localização</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Digite seu endereço ou bairro..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="bg-amber-600 hover:bg-amber-700">Buscar</Button>
            <Button variant="outline">Usar Minha Localização</Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros Rápidos */}
      <div className="flex space-x-4">
        <Button variant="outline" size="sm">
          Aberto Agora
        </Button>
        <Button variant="outline" size="sm">
          Melhor Avaliado
        </Button>
        <Button variant="outline" size="sm">
          Mais Próximo
        </Button>
        <Button variant="outline" size="sm">
          Menor Preço
        </Button>
      </div>

      {/* Lista de Barbearias */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      ) : barbershops.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma barbearia encontrada</h3>
            <p className="text-gray-600">
              Não encontramos barbearias cadastradas no momento. Volte mais tarde!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {barbershops.map((barbershop) => {
            const priceRange = barbershop.services.length > 0
              ? `R$ ${Math.min(...barbershop.services.map((s: any) => Number(s.price)))} - R$ ${Math.max(...barbershop.services.map((s: any) => Number(s.price)))}`
              : 'Preços sob consulta'

            return (
              <Card key={barbershop.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{barbershop.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{barbershop.address || 'Endereço não informado'}</p>
                      <div className="flex items-center space-x-4 mb-3">
                        {barbershop.phone && (
                          <span className="text-sm text-gray-500">{barbershop.phone}</span>
                        )}
                        <span className="text-sm text-gray-500">{priceRange}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {barbershop.services.slice(0, 3).map((service: any) => (
                          <Badge key={service.id} variant="outline" className="text-xs">
                            {service.name}
                          </Badge>
                        ))}
                        {barbershop.services.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{barbershop.services.length - 3} serviços
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {barbershop.barbers.length} {barbershop.barbers.length === 1 ? 'barbeiro' : 'barbeiros'}
                        </Badge>
                        <Badge className={`text-xs ${barbershop.subscriptionPlan === 'premium' ? 'bg-purple-100 text-purple-800' : barbershop.subscriptionPlan === 'profissional' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          Plano {barbershop.subscriptionPlan}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <Button
                        onClick={() => setSelectedBarbershop(barbershop)}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Agendar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FavoritesSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Minhas Barbearias Favoritas</h2>
        <p className="text-gray-600">Suas barbearias mais visitadas e preferidas</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Funcionalidade em breve</h3>
          <p className="text-gray-600 mb-4">
            Em breve você poderá salvar suas barbearias favoritas e ter acesso rápido a elas.
          </p>
          <Button className="bg-amber-600 hover:bg-amber-700">Encontrar Barbearias</Button>
        </CardContent>
      </Card>
    </div>
  )
}
