"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, Calendar, Package, Settings, Scissors, LogOut, Bell, User, Bot } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface ManagerSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function ManagerSidebar({ activeSection, onSectionChange }: ManagerSidebarProps) {
  const router = useRouter()
  const [currentPlan, setCurrentPlan] = useState("Profissional")
  const [barbershopName, setBarbershopName] = useState("Barbearia Premium")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const userEmail = localStorage.getItem("userEmail")

    if (userEmail) {
      let plan = "Profissional"
      let barbershop = "Barbearia Premium"

      if (userEmail.includes("basico")) {
        plan = "Básico"
        barbershop = "Barbearia Essencial"
      } else if (userEmail.includes("premium")) {
        plan = "Premium"
        barbershop = "Barbearia Elite"
      }

      setCurrentPlan(plan)
      setBarbershopName(barbershop)
    }
  }, [])

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
    localStorage.removeItem("userType")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userPlan")
    router.push("/")
  }

  const handleSectionChange = (sectionId: string) => {
    const section = menuItems.find((item) => item.id === sectionId)

    if (section?.premium && currentPlan !== "Premium") {
      // Mostrar modal de upgrade ou mensagem
      alert("Esta funcionalidade está disponível apenas no plano Premium. Faça upgrade para acessar o Assistente IA.")
      return
    }

    onSectionChange(sectionId)
  }

  if (!isClient) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
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
    )
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Scissors className="h-8 w-8 text-amber-600" />
          <div>
            <h2 className="font-bold text-gray-900">{barbershopName}</h2>
            <Badge className="bg-amber-600 text-xs">Plano {currentPlan}</Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            const isLocked = item.premium && currentPlan !== "Premium"

            return (
              <li key={item.id}>
                <Button
                  variant={activeSection === item.id ? "default" : "ghost"}
                  className={`w-full justify-start relative ${
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
                  {item.label}
                  {isLocked && <Badge className="ml-auto bg-amber-100 text-amber-800 text-xs">Premium</Badge>}
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">João Manager</p>
            <p className="text-sm text-gray-500">Proprietário</p>
          </div>
        </div>
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-red-600" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  )
}
