"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp, Star, Lock, Loader2 } from "lucide-react"
import { ManagerSidebar } from "@/components/manager-sidebar"
import { OverviewCards } from "@/components/overview-cards"
import { RecentAppointments } from "@/components/recent-appointments"
import { BarbersManagement } from "@/components/barbers-management"
import { ServicesManagement } from "@/components/services-management"
import { ProductsManagement } from "@/components/products-management"
import { AIAssistantPremium } from "@/components/ai-assistant-premium"
import { NotificationsSystem } from "@/components/notifications-system"
import { ClientsManagement } from "@/components/clients-management"
import { FinancialManagement } from "@/components/financial-management"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

export default function ManagerDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("overview")

  // Verificar autenticação
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
    
    if (!isLoading && user && user.userType !== 'manager') {
      // Redirecionar para dashboard correto baseado no tipo de usuário
      router.push(`/dashboard/${user.userType}`)
    }
  }, [isLoading, isAuthenticated, user, router])

  const sectionTitles = {
    overview: {
      title: `Dashboard - ${user?.barbershop?.name || 'Barbearia'}`,
      description: "Visão geral da sua barbearia",
    },
    appointments: {
      title: "Agendamentos",
      description: "Gerencie todos os agendamentos da barbearia",
    },
    clients: {
      title: "Gestão de Clientes",
      description: "Gerencie todos os clientes da barbearia",
    },
    barbers: {
      title: "Gestão de Barbeiros",
      description: "Gerencie sua equipe de barbeiros",
    },
    services: {
      title: "Gestão de Serviços",
      description: "Configure os serviços oferecidos",
    },
    products: {
      title: "Gestão de Produtos",
      description: "Controle seu estoque e vendas",
    },
    financial: {
      title: "Financeiro",
      description: "Relatórios, comissões e histórico de vendas",
    },
    ai: {
      title: "Assistente IA",
      description: "Inteligência artificial para otimizar sua barbearia",
    },
    settings: {
      title: "Configurações",
      description: "Gerencie as configurações da barbearia",
    },
  }

  // Função para normalizar nome do plano
  const normalizePlanName = (plan?: string) => {
    if (!plan) return "Profissional"
    
    const normalizedPlan = plan.toLowerCase()
    if (normalizedPlan.includes('basico') || normalizedPlan.includes('básico')) return "Básico"
    if (normalizedPlan.includes('premium')) return "Premium"
    return "Profissional"
  }

  const userPlan = normalizePlanName(user?.barbershop?.subscriptionPlan)

  const isFeatureAvailable = (feature: string) => {
    const planFeatures = {
      Básico: ["overview", "barbers", "services", "settings"],
      Profissional: ["overview", "barbers", "services", "products", "financial", "settings"],
      Premium: ["overview", "barbers", "services", "products", "financial", "settings", "ai", "analytics"],
    }
    return planFeatures[userPlan as keyof typeof planFeatures]?.includes(feature) || false
  }

  const getBarberLimit = () => {
    const limits = {
      Básico: 3,
      Profissional: 8,
      Premium: -1, // ilimitado
    }
    return limits[userPlan as keyof typeof limits] || 8
  }

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection userPlan={userPlan} />
      case "appointments":
        return <AppointmentsSection userPlan={userPlan} />
      case "clients":
        return <ClientsManagement />
      case "barbers":
        return <BarbersManagement userPlan={userPlan} barberLimit={getBarberLimit()} />
      case "services":
        return <ServicesManagement />
      case "products":
        return isFeatureAvailable("products") ? <ProductsManagement /> : <UpgradePrompt feature="Gestão de Estoque" />
      case "financial":
        return isFeatureAvailable("financial") ? (
          <FinancialManagement />
        ) : (
          <UpgradePrompt feature="Sistema Financeiro" />
        )
      case "ai":
        return <AIAssistantPremium userPlan={userPlan} />
      case "settings":
        return <SettingsSection userPlan={userPlan} />
      default:
        return <OverviewSection userPlan={userPlan} />
    }
  }

  // Mostrar loading enquanto carrega dados
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados da barbearia...</p>
        </div>
      </div>
    )
  }

  // Se não estiver autenticado ou não tiver dados do usuário, não renderizar nada
  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {sectionTitles[activeSection as keyof typeof sectionTitles]?.title || "Dashboard"}
              </h1>
              <p className="text-gray-600">
                {sectionTitles[activeSection as keyof typeof sectionTitles]?.description || "Gerencie sua barbearia"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Plano Atual</p>
                <Badge variant={userPlan === "Premium" ? "default" : "secondary"} className="font-semibold">
                  {userPlan}
                </Badge>
              </div>
              <NotificationsSystem userType="manager" />
            </div>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

function UpgradePrompt({ feature }: { feature: string }) {
  return (
    <div className="flex items-center justify-center h-96">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 p-3 bg-amber-100 rounded-full w-fit">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle>Funcionalidade Premium</CardTitle>
          <CardDescription>{feature} está disponível nos planos Profissional e Premium</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Faça upgrade do seu plano para acessar esta funcionalidade e muito mais.
          </p>
          <Button className="bg-amber-600 hover:bg-amber-700">Fazer Upgrade</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function OverviewSection({ userPlan }: { userPlan: string }) {
  const { user } = useAuth()
  const [barbersList, setBarbersList] = useState<any[]>([])
  const [loadingBarbers, setLoadingBarbers] = useState(true)

  useEffect(() => {
    const loadBarbers = async () => {
      if (!user?.barbershop?.id) return
      
      try {
        const response = await fetch(`/api/barbers?barbershopId=${user.barbershop.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        })
        const data = await response.json()
        if (data.success) {
          setBarbersList(data.barbers || [])
        }
      } catch (error) {
        console.error('Erro ao carregar barbeiros:', error)
      } finally {
        setLoadingBarbers(false)
      }
    }
    
    loadBarbers()
  }, [user?.barbershop?.id])

  return (
    <div className="space-y-6">
      <OverviewCards />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-amber-600" />
              Agendamentos Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentAppointments />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-amber-600" />
              Resumo da Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Barbeiros Ativos</span>
                <span className="font-semibold text-green-600">{barbersList.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Plano Atual</span>
                <Badge className="bg-amber-600">{userPlan}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Limite de Barbeiros</span>
                <span className="font-semibold">
                  {userPlan === "Premium" ? "Ilimitado" : userPlan === "Profissional" ? "8" : "3"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Barbearia</span>
                <span className="font-semibold text-amber-600">{user?.barbershop?.name || "-"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Barbeiros Ativos</CardTitle>
          <CardDescription>
            Status atual da equipe
            {userPlan === "Básico" && " (Limite: 3 barbeiros)"}
            {userPlan === "Profissional" && " (Limite: 8 barbeiros)"}
            {userPlan === "Premium" && " (Barbeiros ilimitados)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBarbers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
              <span className="ml-2 text-gray-600">Carregando barbeiros...</span>
            </div>
          ) : barbersList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum barbeiro cadastrado ainda.</p>
              <p className="text-sm mt-2">Os barbeiros aparecerão aqui após serem aprovados.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {barbersList.map((barber, index) => (
                <div key={barber.id || index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{barber.name}</h4>
                    <Badge variant={barber.isActive ? "default" : "secondary"}>
                      {barber.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{barber.email}</p>
                  {barber.phone && (
                    <p className="text-sm text-gray-500">{barber.phone}</p>
                  )}
                  {barber.specialties && barber.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {barber.specialties.slice(0, 2).map((spec: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsSection({ userPlan }: { userPlan: string }) {
  const { user, refreshProfile } = useAuth()
  const barbershop = user?.barbershop
  
  const [formData, setFormData] = useState({
    name: barbershop?.name || '',
    phone: barbershop?.phone || '',
    address: barbershop?.address || '',
    email: barbershop?.email || '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (barbershop) {
      setFormData({
        name: barbershop.name || '',
        phone: barbershop.phone || '',
        address: barbershop.address || '',
        email: barbershop.email || '',
      })
    }
  }, [barbershop])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!barbershop?.id) return
    
    setIsSaving(true)
    setSaveSuccess(false)
    
    try {
      const response = await fetch(`/api/barbershops/${barbershop.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSaveSuccess(true)
        await refreshProfile()
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePlanChange = async (newPlan: string) => {
    if (newPlan === userPlan || !barbershop?.id) return

    const confirmMessage = `Tem certeza que deseja mudar para o plano ${newPlan}?`

    if (confirm(confirmMessage)) {
      try {
        const response = await fetch(`/api/barbershops/${barbershop.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({ subscriptionPlan: newPlan.toLowerCase() }),
        })

        if (response.ok) {
          await refreshProfile()
        }
      } catch (error) {
        console.error('Erro ao mudar plano:', error)
      }
    }
  }

  const getPlanInfo = () => {
    const plans = {
      Básico: { name: "Básico", price: "R$ 99" },
      Profissional: { name: "Profissional", price: "R$ 125" },
      Premium: { name: "Premium", price: "R$ 199" },
    }
    return plans[userPlan as keyof typeof plans] || plans.Profissional
  }

  const planInfo = getPlanInfo()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Barbearia</CardTitle>
          <CardDescription>Gerencie os dados básicos da sua barbearia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nome da Barbearia</label>
              <input 
                type="text" 
                className="w-full mt-1 p-2 border rounded-md" 
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Telefone</label>
              <input 
                type="text" 
                className="w-full mt-1 p-2 border rounded-md" 
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Endereço</label>
              <input
                type="text"
                className="w-full mt-1 p-2 border rounded-md"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">E-mail</label>
              <input
                type="email"
                className="w-full mt-1 p-2 border rounded-md"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Código da Barbearia</label>
              <div className="mt-1 p-2 border rounded-md bg-gray-100 font-mono font-semibold text-amber-700">
                {barbershop?.code || 'N/A'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Plano Atual</label>
              <div className="mt-1 p-2 border rounded-md bg-gray-50 flex items-center justify-between">
                <Badge className="bg-amber-600 hover:bg-amber-700 text-white capitalize">{planInfo.name}</Badge>
                <span className="text-sm font-medium text-gray-700">{planInfo.price}/mês</span>
              </div>
            </div>
          </div>
          
          {saveSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
              ✓ Alterações salvas com sucesso!
            </div>
          )}
          
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Plano</CardTitle>
          <CardDescription>Faça upgrade ou downgrade do seu plano conforme suas necessidades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div
              className={`p-4 border-2 rounded-lg ${userPlan === "Básico" ? "border-amber-500 bg-amber-50" : "border-gray-200"}`}
            >
              <div className="text-center">
                <h3 className="font-semibold text-lg">Básico</h3>
                <p className="text-2xl font-bold text-amber-600 mt-2">
                  R$ 99<span className="text-sm font-normal">/mês</span>
                </p>
                {userPlan === "Básico" && <Badge className="mt-2 bg-amber-600">Plano Atual</Badge>}
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                <li>• Agendamento online</li>
                <li>• Gestão básica de clientes</li>
                <li>• Até 3 barbeiros</li>
                <li>• Suporte por email</li>
                <li>• Dashboard básico</li>
              </ul>
              {userPlan !== "Básico" && (
                <Button
                  variant="outline"
                  className="w-full mt-4 bg-transparent"
                  onClick={() => handlePlanChange("Básico")}
                >
                  Selecionar
                </Button>
              )}
            </div>

            <div
              className={`p-4 border-2 rounded-lg ${userPlan === "Profissional" ? "border-amber-500 bg-amber-50" : "border-gray-200"}`}
            >
              <div className="text-center">
                <h3 className="font-semibold text-lg">Profissional</h3>
                <p className="text-2xl font-bold text-amber-600 mt-2">
                  R$ 125<span className="text-sm font-normal">/mês</span>
                </p>
                {userPlan === "Profissional" && <Badge className="mt-2 bg-amber-600">Plano Atual</Badge>}
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                <li>• Todas as funcionalidades básicas</li>
                <li>• Gestão de estoque</li>
                <li>• Relatórios avançados</li>
                <li>• Marketing integrado</li>
                <li>• Até 8 barbeiros</li>
                <li>• Suporte prioritário</li>
              </ul>
              {userPlan !== "Profissional" && (
                <Button
                  variant="outline"
                  className="w-full mt-4 bg-transparent"
                  onClick={() => handlePlanChange("Profissional")}
                >
                  Selecionar
                </Button>
              )}
            </div>

            <div
              className={`p-4 border-2 rounded-lg ${userPlan === "Premium" ? "border-amber-500 bg-amber-50" : "border-gray-200"}`}
            >
              <div className="text-center">
                <h3 className="font-semibold text-lg">Premium</h3>
                <p className="text-2xl font-bold text-amber-600 mt-2">
                  R$ 199<span className="text-sm font-normal">/mês</span>
                </p>
                {userPlan === "Premium" && <Badge className="mt-2 bg-amber-600">Plano Atual</Badge>}
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                <li>• Todas as funcionalidades profissionais</li>
                <li>• IA avançada para recomendações</li>
                <li>• Integrações personalizadas</li>
                <li>• Barbeiros ilimitados</li>
                <li>• Suporte 24/7</li>
                <li>• Análises preditivas</li>
              </ul>
              {userPlan !== "Premium" && (
                <Button
                  variant="outline"
                  className="w-full mt-4 bg-transparent"
                  onClick={() => handlePlanChange("Premium")}
                >
                  Selecionar
                </Button>
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> As mudanças de plano entram em vigor imediatamente. Para downgrades, você manterá o
              acesso às funcionalidades até o final do período de cobrança atual.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Políticas de Agendamento</CardTitle>
          <CardDescription>Configure as regras para agendamentos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Antecedência mínima</label>
              <select className="w-full mt-1 p-2 border rounded-md">
                <option>30 minutos</option>
                <option>1 hora</option>
                <option>2 horas</option>
                <option>1 dia</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Cancelamento até</label>
              <select className="w-full mt-1 p-2 border rounded-md">
                <option>2 horas antes</option>
                <option>4 horas antes</option>
                <option>1 dia antes</option>
              </select>
            </div>
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked />
              <span className="text-sm">Permitir reagendamento pelo cliente</span>
            </label>
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked />
              <span className="text-sm">Enviar lembretes automáticos</span>
            </label>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700">Salvar Configurações</Button>
        </CardContent>
      </Card>
    </div>
  )
}

interface AppointmentData {
  id: string
  time: string
  client: string
  barber: string
  barberId: string
  service: string
  status: string
  duration: string
  price: string
}

function AppointmentsSection({ userPlan }: { userPlan: string }) {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedBarber, setSelectedBarber] = useState("todos")
  const [selectedStatus, setSelectedStatus] = useState("todos")
  const [appointments, setAppointments] = useState<AppointmentData[]>([])
  const [barbersList, setBarbersList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!user?.barbershop?.id) return
      
      setLoading(true)
      setError(null)
      try {
        const [appointmentsRes, barbersRes] = await Promise.all([
          fetch(`/api/appointments?barbershopId=${user.barbershop.id}&date=${selectedDate}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
          }),
          fetch(`/api/barbers?barbershopId=${user.barbershop.id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
          }),
        ])

        if (!appointmentsRes.ok || !barbersRes.ok) {
          setError('Erro ao carregar dados. Verifique sua conexão.')
          setAppointments([])
          setBarbersList([])
          return
        }

        const appointmentsData = await appointmentsRes.json()
        const barbersData = await barbersRes.json()

        if (barbersData.success) {
          setBarbersList(barbersData.barbers || [])
        }

        if (appointmentsData.success && appointmentsData.appointments) {
          const formattedAppointments = appointmentsData.appointments.map((apt: any) => {
            const scheduledTime = new Date(apt.scheduledAt)
            const hours = scheduledTime.getHours().toString().padStart(2, '0')
            const minutes = scheduledTime.getMinutes().toString().padStart(2, '0')
            
            const statusMap: { [key: string]: string } = {
              'pending': 'pendente',
              'confirmed': 'confirmado',
              'in_progress': 'em-andamento',
              'completed': 'concluido',
              'cancelled': 'cancelado',
              'no_show': 'no-show',
            }

            const durationValue = apt.duration || 30
            const priceValue = parseFloat(String(apt.totalPrice || apt.service?.price || 0))
            const formattedPrice = new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            }).format(priceValue)

            return {
              id: apt.id,
              time: `${hours}:${minutes}`,
              client: apt.client?.name || 'Cliente',
              barber: apt.barber?.name || 'Barbeiro',
              barberId: apt.barber?.id || '',
              service: apt.service?.name || 'Serviço',
              status: statusMap[apt.status] || apt.status || 'pendente',
              duration: `${durationValue}min`,
              price: formattedPrice,
            }
          })
          setAppointments(formattedAppointments)
        } else {
          setAppointments([])
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        setError('Erro ao carregar dados. Tente novamente.')
        setAppointments([])
        setBarbersList([])
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [user?.barbershop?.id, selectedDate])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "bg-green-100 text-green-800"
      case "em-andamento":
        return "bg-blue-100 text-blue-800"
      case "pendente":
        return "bg-yellow-100 text-yellow-800"
      case "cancelado":
        return "bg-red-100 text-red-800"
      case "concluido":
        return "bg-gray-100 text-gray-800"
      case "aguardando":
        return "bg-orange-100 text-orange-800"
      case "reagendado":
        return "bg-purple-100 text-purple-800"
      case "no-show":
        return "bg-pink-100 text-pink-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmado":
        return "Confirmado"
      case "em-andamento":
        return "Em Andamento"
      case "pendente":
        return "Pendente"
      case "cancelado":
        return "Cancelado"
      case "concluido":
        return "Concluído"
      case "aguardando":
        return "Aguardando"
      case "reagendado":
        return "Reagendado"
      case "no-show":
        return "Não Compareceu"
      default:
        return status
    }
  }

  const filteredAppointments = appointments.filter((appointment) => {
    if (selectedBarber !== "todos" && appointment.barberId !== selectedBarber) return false
    if (selectedStatus !== "todos" && appointment.status !== selectedStatus) return false
    return true
  })

  const todayStats = {
    total: appointments.length,
    confirmados: appointments.filter((a) => a.status === "confirmado").length,
    emAndamento: appointments.filter((a) => a.status === "em-andamento").length,
    pendentes: appointments.filter((a) => a.status === "pendente").length,
    concluidos: appointments.filter((a) => a.status === "concluido").length,
    cancelados: appointments.filter((a) => a.status === "cancelado").length,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Hoje</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmados</p>
                <p className="text-2xl font-bold text-green-600">{todayStats.confirmados}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold text-blue-600">{todayStats.emAndamento}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{todayStats.pendentes}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-yellow-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Concluídos</p>
                <p className="text-2xl font-bold text-gray-600">{todayStats.concluidos}</p>
              </div>
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-gray-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Data</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Barbeiro</label>
              <select
                value={selectedBarber}
                onChange={(e) => setSelectedBarber(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="todos">Todos os Barbeiros</option>
                {barbersList.map((barber) => (
                  <option key={barber.id} value={barber.id}>{barber.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="todos">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="confirmado">Confirmado</option>
                <option value="em-andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
                <option value="no-show">Não Compareceu</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Agendamentos do Dia</CardTitle>
          <CardDescription>
            {loading ? "Carregando..." : `${filteredAppointments.length} agendamento(s) encontrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
              <span className="ml-2 text-gray-600">Carregando agendamentos...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Tentar Novamente
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-600">{appointment.time}</div>
                      <div className="text-xs text-gray-500">{appointment.duration}</div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{appointment.client}</h4>
                      <p className="text-sm text-gray-600">{appointment.service}</p>
                      <p className="text-xs text-gray-500">Barbeiro: {appointment.barber}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{appointment.price}</div>
                      <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      Detalhes
                    </Button>
                  </div>
                </div>
              ))}

              {filteredAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum agendamento encontrado para a data selecionada.</p>
                  <p className="text-sm mt-2">Os agendamentos aparecerão aqui quando forem criados.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
