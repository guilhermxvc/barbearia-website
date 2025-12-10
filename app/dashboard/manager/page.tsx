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
import { CalendarView } from "@/components/calendar-view"
import { WorkScheduleConfig } from "@/components/work-schedule-config"

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
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="p-4 lg:p-6">
          <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {sectionTitles[activeSection as keyof typeof sectionTitles]?.title || "Dashboard"}
              </h1>
              <p className="text-sm lg:text-base text-gray-600">
                {sectionTitles[activeSection as keyof typeof sectionTitles]?.description || "Gerencie sua barbearia"}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-600">Plano Atual</p>
                <Badge variant={userPlan === "Premium" ? "default" : "secondary"} className="font-semibold text-xs sm:text-sm">
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
    logoUrl: barbershop?.logoUrl || '',
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
        logoUrl: barbershop.logoUrl || '',
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Logo da Barbearia (URL)</label>
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <input 
                  type="url" 
                  className="w-full p-2 border rounded-md" 
                  placeholder="https://exemplo.com/logo.png"
                  value={formData.logoUrl}
                  onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Cole a URL de uma imagem (PNG, JPG) para usar como logo</p>
              </div>
              {formData.logoUrl && (
                <div className="w-20 h-20 border rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                  <img 
                    src={formData.logoUrl} 
                    alt="Preview da logo" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
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

function AppointmentsSection({ userPlan }: { userPlan: string }) {
  const { user } = useAuth()

  if (!user?.barbershop?.id) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CalendarView 
        barbershopId={user.barbershop.id} 
        isManager={true}
      />
    </div>
  )
}
