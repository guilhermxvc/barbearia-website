"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { BarChart3, Users, Calendar, Package, Settings, Scissors, LogOut, Bell, User, Bot, Menu } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface ManagerSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const planDisplayNames: { [key: string]: string } = {
  basico: "Básico",
  profissional: "Profissional",
  premium: "Premium",
}

export function ManagerSidebar({ activeSection, onSectionChange }: ManagerSidebarProps) {
  const { user, isLoading, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  
  const barbershopName = user?.barbershop?.name || "Carregando..."
  const ownerName = user?.name || "Carregando..."
  const subscriptionPlan = user?.barbershop?.subscriptionPlan || "basico"
  const currentPlanDisplay = planDisplayNames[subscriptionPlan] || "Básico"
  const isPremium = subscriptionPlan === "premium"

  const menuItems = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    { id: "appointments", label: "Agendamentos", icon: Calendar },
    { id: "clients", label: "Clientes", icon: Users },
    { id: "barbers", label: "Barbeiros", icon: Users },
    { id: "services", label: "Serviços", icon: Scissors },
    { id: "products", label: "Produtos", icon: Package },
    { id: "financial", label: "Financeiro", icon: BarChart3 },
    { id: "ai", label: "Assistente IA", icon: Bot, premium: true },
    { id: "settings", label: "Configurações", icon: Settings },
  ]

  const handleLogout = () => {
    logout()
  }

  const handleSectionChange = (sectionId: string) => {
    const section = menuItems.find((item) => item.id === sectionId)

    if (section?.premium && !isPremium) {
      alert("Esta funcionalidade está disponível apenas no plano Premium. Faça upgrade para acessar o Assistente IA.")
      return
    }

    onSectionChange(sectionId)
    setMobileOpen(false)
  }

  const SidebarContent = () => (
    <>
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Scissors className="h-6 w-6 lg:h-8 lg:w-8 text-amber-600" />
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-gray-900 truncate text-sm lg:text-base">{barbershopName}</h2>
            <Badge className="bg-amber-600 text-xs">Plano {currentPlanDisplay}</Badge>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 lg:p-4 overflow-y-auto">
        <ul className="space-y-1 lg:space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            const isLocked = item.premium && !isPremium

            return (
              <li key={item.id}>
                <Button
                  variant={activeSection === item.id ? "default" : "ghost"}
                  className={`w-full justify-start relative text-sm ${
                    activeSection === item.id
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : isLocked
                        ? "text-gray-400 hover:bg-gray-50 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleSectionChange(item.id)}
                  disabled={isLocked}
                >
                  <IconComponent className="h-4 w-4 mr-3" />
                  <span className="truncate">{item.label}</span>
                  {isLocked && <Badge className="ml-auto bg-amber-100 text-amber-800 text-xs flex-shrink-0">Premium</Badge>}
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-3 lg:p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3 lg:mb-4">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 lg:h-5 lg:w-5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate text-sm">{ownerName}</p>
            <p className="text-xs lg:text-sm text-gray-500">Proprietário</p>
          </div>
        </div>
        <div className="space-y-1 lg:space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 text-sm">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 text-sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </>
  )

  if (isLoading) {
    return (
      <>
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scissors className="h-6 w-6 text-amber-600" />
            <span className="font-bold text-gray-900">BarberPro</span>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Scissors className="h-8 w-8 text-amber-600" />
              <div>
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
            </div>
          </div>
          <div className="flex-1 p-4">
            <div className="space-y-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Scissors className="h-6 w-6 text-amber-600" />
          <span className="font-bold text-gray-900 truncate">{barbershopName}</span>
        </div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex flex-col h-full">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col">
        <SidebarContent />
      </div>
    </>
  )
}
