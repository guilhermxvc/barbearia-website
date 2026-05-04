"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Search, Star, Loader2, Users, Scissors, Quote } from "lucide-react"
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
    ai: {
      title: "Assistente IA",
      description: "Seu assistente inteligente para ajudar no dia a dia",
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
      case "ai":
        return <AIAssistant userType="client" userName={user?.name || "Cliente"} embedded />
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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {sectionTitles[activeSection as keyof typeof sectionTitles]?.title || "Dashboard"}
              </h1>
              <p className="text-sm lg:text-base text-gray-600">
                {sectionTitles[activeSection as keyof typeof sectionTitles]?.description || "Gerencie sua conta"}
              </p>
            </div>
            <NotificationsSystem userType="client" />
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

// ─── Logo da barbearia ────────────────────────────────────────
function BarbershopLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const [imageError, setImageError] = useState(false)
  const initial = name?.charAt(0)?.toUpperCase() || 'B'

  return (
    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 flex-shrink-0 flex items-center justify-center border border-amber-200">
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

// ─── Estrelas de avaliação ────────────────────────────────────
function StarRating({ rating, total }: { rating: number; total: number }) {
  if (total === 0) {
    return <span className="text-xs text-gray-400">Sem avaliações</span>
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}`}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-gray-700">{rating.toFixed(1)}</span>
      <span className="text-xs text-gray-400">({total})</span>
    </div>
  )
}

// ─── Seção de busca ───────────────────────────────────────────
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
        const apiData = response.data as { success: boolean; barbershops: any[] }
        if (apiData.success && apiData.barbershops) {
          setBarbershops(apiData.barbershops)
          setFilteredBarbershops(apiData.barbershops)
        } else {
          setError("Erro ao carregar barbearias")
        }
      } else {
        setError(response.error || "Erro ao carregar barbearias")
      }
    } catch {
      setError("Erro ao carregar barbearias")
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...barbershops]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(b =>
        b.name?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q)
      )
    }
    if (activeFilter === 'maisBarbers') {
      filtered = filtered.sort((a, b) => (b.barbers?.length || 0) - (a.barbers?.length || 0))
    } else if (activeFilter === 'melhorAvaliacao') {
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else if (activeFilter === 'menorPreco') {
      filtered = filtered.sort((a, b) => {
        const minA = a.services?.length > 0 ? Math.min(...a.services.map((s: any) => Number(s.price))) : Infinity
        const minB = b.services?.length > 0 ? Math.min(...b.services.map((s: any) => Number(s.price))) : Infinity
        return minA - minB
      })
    }
    setFilteredBarbershops(filtered)
  }

  const toggleFilter = (filter: string) => {
    setActiveFilter(prev => prev === filter ? null : filter)
  }

  if (selectedBarbershop) {
    return <BookingFlow barbershop={selectedBarbershop} onBack={() => setSelectedBarbershop(null)} />
  }

  return (
    <div className="space-y-5">
      {/* Barra de busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, endereço ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Limpar
              </Button>
            )}
          </div>
          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { key: 'melhorAvaliacao', label: 'Melhor Avaliados' },
              { key: 'maisBarbers', label: 'Mais Barbeiros' },
              { key: 'menorPreco', label: 'Menor Preço' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => toggleFilter(f.key)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  activeFilter === f.key
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contador */}
      {!isLoading && !error && (
        <p className="text-sm text-gray-500 px-1">
          {filteredBarbershops.length}{' '}
          {filteredBarbershops.length === 1 ? 'barbearia encontrada' : 'barbearias encontradas'}
          {searchQuery && ` para "${searchQuery}"`}
        </p>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      ) : filteredBarbershops.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma barbearia encontrada</h3>
            <p className="text-gray-500 text-sm">
              {searchQuery
                ? `Nenhum resultado para "${searchQuery}". Tente outra busca.`
                : "Nenhuma barbearia cadastrada no momento. Volte em breve!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBarbershops.map((shop) => {
            const priceRange = shop.services?.length > 0
              ? `R$ ${Math.min(...shop.services.map((s: any) => Number(s.price)))} – R$ ${Math.max(...shop.services.map((s: any) => Number(s.price)))}`
              : null

            return (
              <Card key={shop.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <BarbershopLogo name={shop.name} logoUrl={shop.logoUrl} />

                    <div className="flex-1 min-w-0">
                      {/* Nome + avaliação */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{shop.name}</h3>
                      </div>

                      <StarRating rating={shop.rating || 0} total={shop.totalRatings || 0} />

                      {/* Endereço */}
                      {shop.address && (
                        <div className="flex items-center gap-1.5 mt-2 text-gray-500 text-sm">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                          <span className="truncate">{shop.address}</span>
                        </div>
                      )}

                      {/* Sobre nós */}
                      {shop.description ? (
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Quote className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Sobre nós</span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{shop.description}</p>
                        </div>
                      ) : (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs text-gray-400 italic">Esta barbearia ainda não adicionou uma descrição.</p>
                        </div>
                      )}

                      {/* Rodapé: barbeiros + preço */}
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          <span>{shop.barbers?.length || 0} {shop.barbers?.length === 1 ? 'barbeiro' : 'barbeiros'}</span>
                        </div>
                        {priceRange && (
                          <div className="flex items-center gap-1 text-xs text-amber-700 font-medium">
                            <Scissors className="h-3.5 w-3.5" />
                            <span>{priceRange}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botão */}
                    <div className="flex-shrink-0">
                      <Button
                        onClick={() => setSelectedBarbershop(shop)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-sm"
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

// ─── Favoritos ────────────────────────────────────────────────
function FavoritesSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-12 text-center">
          <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Funcionalidade em breve</h3>
          <p className="text-gray-500 mb-4">
            Em breve você poderá salvar suas barbearias favoritas e ter acesso rápido a elas.
          </p>
          <Button className="bg-amber-600 hover:bg-amber-700">Encontrar Barbearias</Button>
        </CardContent>
      </Card>
    </div>
  )
}
