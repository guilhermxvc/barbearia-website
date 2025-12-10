"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Calendar, Users, User, BarChart3, LogOut, Bell, Settings, Scissors, Menu, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

interface BarberSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function BarberSidebar({ activeSection, onSectionChange }: BarberSidebarProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const menuItems = [
    { id: "stats", label: "Estatísticas", icon: TrendingUp },
    { id: "schedule", label: "Minha Agenda", icon: Calendar },
    { id: "clients", label: "Meus Clientes", icon: Users },
    { id: "reports", label: "Relatórios", icon: BarChart3 },
    { id: "profile", label: "Meu Perfil", icon: User },
  ]

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const handleSectionChange = (section: string) => {
    onSectionChange(section)
    setMobileOpen(false)
  }

  const barberName = user?.name || "Barbeiro"
  const barbershopName = user?.barber?.barbershop?.name || "Barbearia"

  const SidebarContent = () => (
    <>
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Scissors className="h-6 w-6 lg:h-8 lg:w-8 text-amber-600" />
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-gray-900 truncate text-sm lg:text-base">{barberName}</h2>
            <Badge className="bg-blue-600 text-xs">Barbeiro</Badge>
          </div>
        </div>
        <div className="mt-2 lg:mt-3 text-xs lg:text-sm text-gray-600">
          <p className="truncate">{barbershopName}</p>
          <div className="flex items-center mt-1">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            <span>Online</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 lg:p-4">
        <ul className="space-y-1 lg:space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <li key={item.id}>
                <Button
                  variant={activeSection === item.id ? "default" : "ghost"}
                  className={`w-full justify-start text-sm ${
                    activeSection === item.id
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleSectionChange(item.id)}
                >
                  <IconComponent className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-3 lg:p-4 border-t border-gray-200">
        <div className="space-y-1 lg:space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 text-sm">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
            <Badge className="ml-auto bg-red-500 text-white text-xs">3</Badge>
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 text-sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 text-sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Scissors className="h-6 w-6 text-amber-600" />
          <span className="font-bold text-gray-900">BarberPro</span>
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
