"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp, Star, Lock } from "lucide-react"
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

export default function ManagerDashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [userPlan, setUserPlan] = useState("Profissional")
  const [isClient, setIsClient] = useState(false)

  const sectionTitles = {
    overview: {
      title: "Dashboard da Barbearia",
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

  useEffect(() => {
    setIsClient(true)
    const userEmail = localStorage.getItem("userEmail")

    if (userEmail) {
      let plan = "Profissional"

      if (userEmail.includes("basico")) {
        plan = "Básico"
      } else if (userEmail.includes("premium")) {
        plan = "Premium"
      }

      setUserPlan(plan)
    }
  }, [])

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
            <NotificationsSystem userType="manager" />
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
              Performance Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Faturamento</span>
                <span className="font-semibold text-green-600">+12%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Agendamentos</span>
                <span className="font-semibold text-blue-600">+8%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Novos Clientes</span>
                <span className="font-semibold text-purple-600">+15%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avaliação Média</span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 font-semibold">4.8</span>
                </div>
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
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Carlos Silva", status: "Ocupado", nextFree: "14:30", rating: 4.9 },
              { name: "João Santos", status: "Livre", nextFree: "Agora", rating: 4.7 },
              { name: "Pedro Costa", status: "Almoço", nextFree: "13:00", rating: 4.8 },
            ].map((barber, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{barber.name}</h4>
                  <Badge
                    variant={
                      barber.status === "Livre" ? "default" : barber.status === "Ocupado" ? "destructive" : "secondary"
                    }
                  >
                    {barber.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">Próximo livre: {barber.nextFree}</p>
                <div className="flex items-center mt-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm">{barber.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsSection({ userPlan }: { userPlan: string }) {
  const [showPlanChange, setShowPlanChange] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(userPlan)
  const [barbershopCode, setBarbershopCode] = useState("")

  useEffect(() => {
    let code = localStorage.getItem("barbershopCode")
    if (!code) {
      code = generateBarbershopCode()
      localStorage.setItem("barbershopCode", code)
    }
    setBarbershopCode(code)
  }, [])

  const generateBarbershopCode = () => {
    return "BB" + Math.random().toString(36).substr(2, 6).toUpperCase()
  }

  const regenerateCode = () => {
    const newCode = generateBarbershopCode()
    setBarbershopCode(newCode)
    localStorage.setItem("barbershopCode", newCode)
  }

  const getPlanInfo = () => {
    const plans = {
      Básico: { name: "Básico", price: "R$ 99" },
      Profissional: { name: "Profissional", price: "R$ 125" },
      Premium: { name: "Premium", price: "R$ 199" },
    }
    return plans[userPlan as keyof typeof plans] || plans.Profissional
  }

  const handlePlanChange = (newPlan: string) => {
    if (newPlan === userPlan) return

    const confirmMessage = `Tem certeza que deseja ${getPlanUpgradeText(userPlan, newPlan)} para o plano ${getPlanName(newPlan)}?`

    if (confirm(confirmMessage)) {
      localStorage.setItem("userPlan", newPlan)
      window.location.reload()
    }
  }

  const getPlanUpgradeText = (currentPlan: string, newPlan: string) => {
    const planOrder = { Básico: 1, Profissional: 2, Premium: 3 }
    const current = planOrder[currentPlan as keyof typeof planOrder]
    const target = planOrder[newPlan as keyof typeof planOrder]
    return target > current ? "fazer upgrade" : "fazer downgrade"
  }

  const getPlanName = (plan: string) => {
    const names = { Básico: "Básico", Profissional: "Profissional", Premium: "Premium" }
    return names[plan as keyof typeof names]
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
              <input type="text" className="w-full mt-1 p-2 border rounded-md" defaultValue="Barbearia Premium" />
            </div>
            <div>
              <label className="text-sm font-medium">Telefone</label>
              <input type="text" className="w-full mt-1 p-2 border rounded-md" defaultValue="(11) 99999-9999" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Endereço</label>
            <input
              type="text"
              className="w-full mt-1 p-2 border rounded-md"
              defaultValue="Rua das Flores, 123 - Centro"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Horário de Funcionamento</label>
              <select className="w-full mt-1 p-2 border rounded-md">
                <option>Segunda a Sábado: 8h às 18h</option>
                <option>Segunda a Sexta: 8h às 18h</option>
                <option>Personalizado</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Plano Atual</label>
              <div className="mt-1 p-2 border rounded-md bg-gray-50 flex items-center justify-between">
                <Badge className="bg-amber-600 hover:bg-amber-700 text-white capitalize">{planInfo.name}</Badge>
                <span className="text-sm font-medium text-gray-700">{planInfo.price}/mês</span>
              </div>
            </div>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700">Salvar Alterações</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Código da Barbearia</CardTitle>
          <CardDescription>Código único para vinculação de barbeiros à sua barbearia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-amber-800">Código Atual</label>
                <div className="text-2xl font-bold text-amber-900 mt-1 font-mono">{barbershopCode}</div>
                <p className="text-sm text-amber-700 mt-1">
                  Compartilhe este código com barbeiros que desejam se vincular à sua barbearia
                </p>
              </div>
              <Button
                variant="outline"
                onClick={regenerateCode}
                className="border-amber-300 text-amber-700 hover:bg-amber-100 bg-transparent"
              >
                Gerar Novo Código
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Como funciona:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Barbeiros usam este código ao criar suas contas</li>
              <li>• Você receberá solicitações de vinculação para aprovar</li>
              <li>• Apenas barbeiros aprovados terão acesso ao sistema</li>
              <li>• Você pode gerar um novo código a qualquer momento</li>
            </ul>
          </div>
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedBarber, setSelectedBarber] = useState("todos")
  const [selectedStatus, setSelectedStatus] = useState("todos")

  const mockAppointments = [
    {
      id: 1,
      time: "09:00",
      client: "João Silva",
      barber: "Carlos Silva",
      service: "Corte + Barba",
      status: "confirmado",
      duration: "45min",
      price: "R$ 45,00",
    },
    {
      id: 2,
      time: "10:00",
      client: "Pedro Santos",
      barber: "João Santos",
      service: "Corte Clássico",
      status: "em-andamento",
      duration: "30min",
      price: "R$ 25,00",
    },
    {
      id: 3,
      time: "11:30",
      client: "Lucas Costa",
      barber: "Carlos Silva",
      service: "Barba Completa",
      status: "pendente",
      duration: "30min",
      price: "R$ 20,00",
    },
    {
      id: 4,
      time: "14:00",
      client: "Rafael Lima",
      barber: "Pedro Costa",
      service: "Corte + Barba",
      status: "confirmado",
      duration: "45min",
      price: "R$ 45,00",
    },
    {
      id: 5,
      time: "15:30",
      client: "André Oliveira",
      barber: "João Santos",
      service: "Corte Social",
      status: "cancelado",
      duration: "30min",
      price: "R$ 30,00",
    },
    {
      id: 6,
      time: "16:00",
      client: "Marcos Ferreira",
      barber: "Carlos Silva",
      service: "Degradê Moderno",
      status: "aguardando",
      duration: "40min",
      price: "R$ 35,00",
    },
    {
      id: 7,
      time: "16:30",
      client: "Roberto Alves",
      barber: "Pedro Costa",
      service: "Barba + Bigode",
      status: "reagendado",
      duration: "35min",
      price: "R$ 30,00",
    },
    {
      id: 8,
      time: "17:00",
      client: "Felipe Rocha",
      barber: "João Santos",
      service: "Corte Infantil",
      status: "no-show",
      duration: "25min",
      price: "R$ 20,00",
    },
  ]

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

  const filteredAppointments = mockAppointments.filter((appointment) => {
    if (selectedBarber !== "todos" && appointment.barber !== selectedBarber) return false
    if (selectedStatus !== "todos" && appointment.status !== selectedStatus) return false
    return true
  })

  const todayStats = {
    total: mockAppointments.length,
    confirmados: mockAppointments.filter((a) => a.status === "confirmado").length,
    emAndamento: mockAppointments.filter((a) => a.status === "em-andamento").length,
    pendentes: mockAppointments.filter((a) => a.status === "pendente").length,
    aguardando: mockAppointments.filter((a) => a.status === "aguardando").length,
    cancelados: mockAppointments.filter((a) => a.status === "cancelado").length,
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
                <p className="text-sm text-gray-600">Aguardando</p>
                <p className="text-2xl font-bold text-orange-600">{todayStats.aguardando}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-orange-600 rounded-full"></div>
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
                <option value="Carlos Silva">Carlos Silva</option>
                <option value="João Santos">João Santos</option>
                <option value="Pedro Costa">Pedro Costa</option>
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
                <option value="confirmado">Confirmado</option>
                <option value="em-andamento">Em Andamento</option>
                <option value="pendente">Pendente</option>
                <option value="aguardando">Aguardando</option>
                <option value="reagendado">Reagendado</option>
                <option value="cancelado">Cancelado</option>
                <option value="concluido">Concluído</option>
                <option value="no-show">Não Compareceu</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Agendamentos de Hoje</CardTitle>
          <CardDescription>{filteredAppointments.length} agendamento(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
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
                <p>Nenhum agendamento encontrado para os filtros selecionados.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
