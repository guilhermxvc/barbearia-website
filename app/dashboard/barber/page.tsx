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
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{sectionTitles[activeSection as keyof typeof sectionTitles]?.title || "Dashboard"}</h1>
              <p className="text-gray-600">{sectionTitles[activeSection as keyof typeof sectionTitles]?.description || "Gerencie sua conta"}</p>
            </div>
            <NotificationsSystem userType="barber" />
          </div>
          {renderContent()}
        </div>
      </main>
      <AIAssistant userType="barber" userName={user.name} />
    </div>
  )
}

function ScheduleSection() {
  const todayAppointments = [
    {
      id: 1,
      client: "Carlos Silva",
      service: "Corte Clássico",
      time: "09:00",
      duration: 30,
      status: "confirmado",
      phone: "(11) 99999-1111",
      notes: "Cliente prefere conversa moderada",
    },
    {
      id: 2,
      client: "Pedro Santos",
      service: "Combo Corte + Barba",
      time: "09:30",
      duration: 50,
      status: "em-andamento",
      phone: "(11) 99999-2222",
      notes: "Primeira vez na barbearia",
    },
    {
      id: 3,
      client: "João Costa",
      service: "Barba Completa",
      time: "10:30",
      duration: 25,
      status: "confirmado",
      phone: "(11) 99999-3333",
      notes: "Cliente regular, gosta de óleo de barba premium",
    },
    {
      id: 4,
      client: "Lucas Oliveira",
      service: "Degradê Moderno",
      time: "11:00",
      duration: 40,
      status: "confirmado",
      phone: "(11) 99999-4444",
      notes: "",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "bg-green-100 text-green-800"
      case "em-andamento":
        return "bg-blue-100 text-blue-800"
      case "concluido":
        return "bg-gray-100 text-gray-800"
      case "cancelado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Agendamentos Hoje</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
              <Calendar className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Próximo Cliente</p>
                <p className="text-lg font-semibold text-gray-900">09:00</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Faturamento Hoje</p>
                <p className="text-2xl font-bold text-green-600">R$ 280</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avaliação</p>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <p className="text-lg font-semibold text-gray-900 ml-1">4.9</p>
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Agenda de Hoje</span>
            <Badge className="bg-amber-600">8 agendamentos</Badge>
          </CardTitle>
          <CardDescription>Seus agendamentos para hoje, 15 de Janeiro de 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-600">{appointment.time}</p>
                    <p className="text-xs text-gray-500">{appointment.duration}min</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{appointment.client}</h4>
                    <p className="text-sm text-gray-600">{appointment.service}</p>
                    <p className="text-xs text-gray-500">{appointment.phone}</p>
                    {appointment.notes && <p className="text-xs text-blue-600 mt-1">{appointment.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(appointment.status)}>{appointment.status.replace("-", " ")}</Badge>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline">
                      Iniciar
                    </Button>
                    <Button size="sm" variant="outline">
                      Contato
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horários Livres Hoje</CardTitle>
          <CardDescription>Horários disponíveis para novos agendamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["12:00", "12:30", "14:00", "14:30", "15:00", "16:30", "17:00"].map((time) => (
              <Badge key={time} variant="outline" className="px-3 py-1">
                {time}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
