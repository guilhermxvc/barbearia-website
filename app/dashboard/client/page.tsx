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

  const nearbyBarbershops = [
    {
      id: 1,
      name: "Barbearia Premium",
      address: "Rua das Flores, 123 - Centro",
      distance: "0.5 km",
      rating: 4.9,
      reviewCount: 156,
      image: "/modern-barbershop.png",
      services: ["Corte Clássico", "Barba", "Combo"],
      priceRange: "R$ 25 - R$ 45",
      openNow: true,
      nextAvailable: "09:30",
    },
    {
      id: 2,
      name: "Barbearia Moderna",
      address: "Av. Principal, 456 - Vila Nova",
      distance: "1.2 km",
      rating: 4.7,
      reviewCount: 89,
      image: "/stylish-barbershop.png",
      services: ["Degradê", "Desenhos", "Coloração"],
      priceRange: "R$ 30 - R$ 60",
      openNow: true,
      nextAvailable: "10:00",
    },
    {
      id: 3,
      name: "Barbearia Clássica",
      address: "Rua Antiga, 789 - Centro Histórico",
      distance: "2.1 km",
      rating: 4.8,
      reviewCount: 234,
      image: "/placeholder-21zig.png",
      services: ["Corte Tradicional", "Barba", "Relaxamento"],
      priceRange: "R$ 20 - R$ 40",
      openNow: false,
      nextAvailable: "14:00",
    },
  ]

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
      <div className="grid gap-6">
        {nearbyBarbershops.map((barbershop) => (
          <Card key={barbershop.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-0">
              <div className="flex">
                <img
                  src={barbershop.image || "/placeholder.svg"}
                  alt={barbershop.name}
                  className="w-48 h-32 object-cover rounded-l-lg"
                />
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{barbershop.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{barbershop.address}</p>
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm font-medium">{barbershop.rating}</span>
                          <span className="ml-1 text-sm text-gray-500">({barbershop.reviewCount})</span>
                        </div>
                        <span className="text-sm text-gray-500">{barbershop.distance}</span>
                        <span className="text-sm text-gray-500">{barbershop.priceRange}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {barbershop.services.slice(0, 3).map((service, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center mb-2">
                        {barbershop.openNow ? (
                          <Badge className="bg-green-100 text-green-800">Aberto</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Fechado</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Próximo horário: {barbershop.nextAvailable}</p>
                      <Button
                        onClick={() => setSelectedBarbershop(barbershop)}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Agendar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function FavoritesSection() {
  const favoriteBarbershops = [
    {
      id: 1,
      name: "Barbearia Premium",
      lastVisit: "2024-01-10",
      totalVisits: 8,
      favoriteBarber: "Carlos Silva",
      favoriteService: "Corte Clássico",
      rating: 5,
    },
    {
      id: 2,
      name: "Barbearia Moderna",
      lastVisit: "2023-12-15",
      totalVisits: 3,
      favoriteBarber: "João Santos",
      favoriteService: "Degradê Moderno",
      rating: 4,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Minhas Barbearias Favoritas</h2>
        <p className="text-gray-600">Suas barbearias mais visitadas e preferidas</p>
      </div>

      <div className="grid gap-6">
        {favoriteBarbershops.map((barbershop) => (
          <Card key={barbershop.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{barbershop.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Última visita: {new Date(barbershop.lastVisit).toLocaleDateString("pt-BR")}</p>
                    <p>Total de visitas: {barbershop.totalVisits}</p>
                    <p>Barbeiro preferido: {barbershop.favoriteBarber}</p>
                    <p>Serviço preferido: {barbershop.favoriteService}</p>
                  </div>
                  <div className="flex items-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < barbershop.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline">Ver Detalhes</Button>
                  <Button className="bg-amber-600 hover:bg-amber-700">Agendar Novamente</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {favoriteBarbershops.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma barbearia favorita ainda</h3>
            <p className="text-gray-600 mb-4">
              Comece agendando seus primeiros serviços para criar sua lista de favoritos.
            </p>
            <Button className="bg-amber-600 hover:bg-amber-700">Encontrar Barbearias</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
