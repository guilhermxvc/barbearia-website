"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, User, BarChart3, LogOut, Bell, Settings, Scissors } from "lucide-react"
import { useRouter } from "next/navigation"

interface BarberSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function BarberSidebar({ activeSection, onSectionChange }: BarberSidebarProps) {
  const router = useRouter()

  const menuItems = [
    { id: "schedule", label: "Minha Agenda", icon: Calendar },
    { id: "clients", label: "Meus Clientes", icon: Users },
    { id: "stats", label: "Estatísticas", icon: BarChart3 },
    { id: "profile", label: "Meu Perfil", icon: User },
  ]

  const handleLogout = () => {
    localStorage.removeItem("userType")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("isLoggedIn")
    router.push("/")
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Scissors className="h-8 w-8 text-amber-600" />
          <div>
            <h2 className="font-bold text-gray-900">Carlos Silva</h2>
            <Badge className="bg-blue-600 text-xs">Barbeiro</Badge>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          <p>Barbearia Premium</p>
          <div className="flex items-center mt-1">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            <span>Online</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <li key={item.id}>
                <Button
                  variant={activeSection === item.id ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    activeSection === item.id
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => onSectionChange(item.id)}
                >
                  <IconComponent className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
            <Badge className="ml-auto bg-red-500 text-white text-xs">3</Badge>
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
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
