"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Star, TrendingUp, Loader2 } from "lucide-react"
import { BarberSidebar } from "@/components/barber-sidebar"
import { BarberClients } from "@/components/barber-clients"
import { BarberProfile } from "@/components/barber-profile"
import { BarberStats } from "@/components/barber-stats"
import { AIAssistant } from "@/components/ai-assistant"
import { NotificationsSystem } from "@/components/notifications-system"
import { BarberReports } from "@/components/barber-reports"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { format, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarView } from "@/components/calendar-view"
import { TimeBlockManager } from "@/components/time-block-manager"

export default function BarberDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("schedule")

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
    if (!isLoading && user && user.userType !== 'barber') {
      router.push(`/dashboard/${user.userType}`)
    }
  }, [isLoading, isAuthenticated, user, router])

  const sectionTitles = {
    schedule: {
      title: "Minha Agenda",
      description: "Gerencie seus agendamentos e horários",
    },
    clients: {
      title: "Meus Clientes",
      description: "Histórico e informações dos seus clientes",
    },
    reports: {
      title: "Relatórios",
      description: "Acompanhe seus ganhos e performance financeira",
    },
    stats: {
      title: "Estatísticas",
      description: "Acompanhe seu desempenho e métricas",
    },
    profile: {
      title: "Meu Perfil",
      description: "Gerencie suas informações e especialidades",
    },
    ai: {
      title: "Assistente IA",
      description: "Seu assistente inteligente para ajudar no dia a dia",
    },
  }

  const renderContent = () => {
    switch (activeSection) {
      case "schedule":
        return <ScheduleSection />
      case "clients":
        return <BarberClients />
      case "reports":
        return <BarberReports />
      case "stats":
        return <BarberStats />
      case "profile":
        return <BarberProfile />
      case "ai":
        return <AIAssistant userType="barber" userName={user?.name || "Barbeiro"} embedded />
      default:
        return <ScheduleSection />
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
      <BarberSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="p-4 lg:p-6">
          <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{sectionTitles[activeSection as keyof typeof sectionTitles]?.title || "Dashboard"}</h1>
              <p className="text-sm lg:text-base text-gray-600">{sectionTitles[activeSection as keyof typeof sectionTitles]?.description || "Gerencie sua conta"}</p>
            </div>
            <NotificationsSystem userType="barber" />
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

function ScheduleSection() {
  const { user } = useAuth()
  const [showTimeBlocks, setShowTimeBlocks] = useState(false)

  if (!user?.barber?.barbershopId || !user?.barber?.id) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={() => setShowTimeBlocks(!showTimeBlocks)}
          className="border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <Clock className="h-4 w-4 mr-2" />
          {showTimeBlocks ? 'Ver Calendário' : 'Bloquear Horário'}
        </Button>
      </div>

      {showTimeBlocks ? (
        <TimeBlockManager 
          barbershopId={user.barber.barbershopId} 
          barberId={user.barber.id}
        />
      ) : (
        <CalendarView 
          barbershopId={user.barber.barbershopId} 
          barberId={user.barber.id}
        />
      )}
    </div>
  )
}
