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
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="p-4 lg:p-6">
          <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{sectionTitles[activeSection as keyof typeof sectionTitles]?.title || "Dashboard"}</h1>
              <p className="text-sm lg:text-base text-gray-600">{sectionTitles[activeSection as keyof typeof sectionTitles]?.description || "Gerencie sua conta"}</p>
            </div>
            <NotificationsSystem userType="client" />
          </div>
          {renderContent()}
        </div>
      </main>
      <div className="hidden lg:block">
        <AIAssistant userType="client" userName={user.name} />
      </div>
    </div>
  )
}

function BarbershopLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const [imageError, setImageError] = useState(false)
  const initial = name?.charAt(0)?.toUpperCase() || 'B'
  
  return (
    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 flex-shrink-0 flex items-center justify-center border border-amber-200">
      {logoUrl && !imageError ? (
        <img 
          src={logoUrl} 
          alt={`Logo ${name}`}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-2xl font-bold text-amber-600">{initial}</span>
      )}
    </div>
  )
}

function SearchSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBarbershop, setSelectedBarbershop] = useState<any>(null)
  const [barbershops, setBarbershops] = useState<any[]>([])
  const [filteredBarbershops, setFilteredBarbershops] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  useEffect(() => {
    loadBarbershops()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [barbershops, searchQuery, activeFilter])

  const loadBarbershops = async () => {
    try {
      setIsLoading(true)
      setError("")

      const response = await apiClient.get<{ success: boolean; barbershops: any[]; error?: string }>('/barbershops')

      if (response.success && response.data) {
        const apiData = response.data as { success: boolean; barbershops: any[]; error?: string }
        if (apiData.success && apiData.barbershops) {
          setBarbershops(apiData.barbershops)
          setFilteredBarbershops(apiData.barbershops)
        } else {
          setError(apiData.error || "Erro ao carregar barbearias")
        }
      } else {
        setError(response.error || "Erro ao carregar barbearias")
      }
    } catch (error) {
      console.error("Erro ao carregar barbearias:", error)
      setError("Erro ao carregar barbearias")
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...barbershops]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(b => 
        b.name?.toLowerCase().includes(query) ||
        b.address?.toLowerCase().includes(query) ||
        b.services?.some((s: any) => s.name?.toLowerCase().includes(query))
      )
    }

    if (activeFilter === 'maisBarbers') {
      filtered = filtered.sort((a, b) => (b.barbers?.length || 0) - (a.barbers?.length || 0))
    } else if (activeFilter === 'menorPreco') {
      filtered = filtered.sort((a, b) => {
        const minA = a.services?.length > 0 ? Math.min(...a.services.map((s: any) => Number(s.price))) : Infinity
        const minB = b.services?.length > 0 ? Math.min(...b.services.map((s: any) => Number(s.price))) : Infinity
        return minA - minB
      })
    } else if (activeFilter === 'maisServicos') {
      filtered = filtered.sort((a, b) => (b.services?.length || 0) - (a.services?.length || 0))
    }

    setFilteredBarbershops(filtered)
  }

  const handleFilterClick = (filter: string) => {
    if (activeFilter === filter) {
      setActiveFilter(null)
    } else {
      setActiveFilter(filter)
    }
  }

  if (selectedBarbershop) {
    return <BookingFlow barbershop={selectedBarbershop} onBack={() => setSelectedBarbershop(null)} />
  }

  return (
    <div className="space-y-6">
      {/* Busca por Nome/Serviço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-amber-600" />
            Encontrar Barbearias
          </CardTitle>
          <CardDescription>Pesquise por nome, endereço ou serviço</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, endereço ou serviço..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => { setSearchQuery(""); setActiveFilter(null); }}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros Rápidos */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={activeFilter === 'maisBarbers' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handleFilterClick('maisBarbers')}
          className={activeFilter === 'maisBarbers' ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          Mais Barbeiros
        </Button>
        <Button 
          variant={activeFilter === 'menorPreco' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handleFilterClick('menorPreco')}
          className={activeFilter === 'menorPreco' ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          Menor Preço
        </Button>
        <Button 
          variant={activeFilter === 'maisServicos' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handleFilterClick('maisServicos')}
          className={activeFilter === 'maisServicos' ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          Mais Serviços
        </Button>
      </div>

      {/* Contador de Resultados */}
      {!isLoading && !error && (
        <p className="text-sm text-gray-600">
          {filteredBarbershops.length} {filteredBarbershops.length === 1 ? 'barbearia encontrada' : 'barbearias encontradas'}
          {searchQuery && ` para "${searchQuery}"`}
        </p>
      )}

      {/* Lista de Barbearias */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      ) : filteredBarbershops.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma barbearia encontrada</h3>
            <p className="text-gray-600">
              {searchQuery 
                ? `Não encontramos resultados para "${searchQuery}". Tente outra pesquisa.`
                : "Não encontramos barbearias cadastradas no momento. Volte mais tarde!"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredBarbershops.map((barbershop) => {
            const priceRange = barbershop.services.length > 0
              ? `R$ ${Math.min(...barbershop.services.map((s: any) => Number(s.price)))} - R$ ${Math.max(...barbershop.services.map((s: any) => Number(s.price)))}`
              : 'Preços sob consulta'

            return (
              <Card key={barbershop.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <BarbershopLogo name={barbershop.name} logoUrl={barbershop.logoUrl} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{barbershop.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{barbershop.address || 'Endereço não informado'}</p>
                      <div className="flex items-center space-x-4 mb-3">
                        {barbershop.phone && (
                          <span className="text-sm text-gray-500">{barbershop.phone}</span>
                        )}
                        <span className="text-sm text-amber-600 font-medium">{priceRange}</span>
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
                    <div className="text-right flex-shrink-0">
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
