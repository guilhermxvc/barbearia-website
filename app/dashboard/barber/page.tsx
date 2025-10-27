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
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadAppointments()
  }, [user])

  const loadAppointments = async () => {
    try {
      setIsLoading(true)
      setError("")

      if (!user?.barber?.id) {
        setError("Perfil de barbeiro não encontrado")
        return
      }

      // Buscar todos os agendamentos do barbeiro
      const response = await apiClient.get(`/api/appointments?barberId=${user.barber.id}`)

      if (response.success && response.appointments) {
        setAppointments(response.appointments)
      } else {
        setError("Erro ao carregar agendamentos")
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error)
      setError("Erro ao carregar agendamentos")
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar agendamentos de hoje
  const todayAppointments = appointments.filter(apt => 
    isToday(new Date(apt.scheduledAt)) && apt.status !== 'cancelled'
  )

  // Calcular estatísticas
  const confirmedToday = todayAppointments.filter(apt => apt.status === 'confirmed' || apt.status === 'in_progress')
  const totalRevenue = todayAppointments.reduce((sum, apt) => sum + (Number(apt.totalPrice) || 0), 0)
  const nextAppointment = todayAppointments
    .filter(apt => new Date(apt.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      confirmed: "Confirmado",
      in_progress: "Em Andamento",
      completed: "Concluído",
      cancelled: "Cancelado",
      pending: "Pendente",
    }
    return labels[status] || status
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Agendamentos Hoje</p>
                <p className="text-2xl font-bold text-gray-900">{confirmedToday.length}</p>
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
                <p className="text-lg font-semibold text-gray-900">
                  {nextAppointment ? format(new Date(nextAppointment.scheduledAt), 'HH:mm', { locale: ptBR }) : '--:--'}
                </p>
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
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalRevenue.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Agendamentos</p>
                <div className="flex items-center">
                  <p className="text-lg font-semibold text-gray-900">{appointments.length}</p>
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
            <Badge className="bg-amber-600">{confirmedToday.length} agendamentos</Badge>
          </CardTitle>
          <CardDescription>
            Seus agendamentos para hoje, {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento para hoje</h3>
              <p className="text-gray-600">Você não tem agendamentos marcados para hoje.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-600">
                        {format(new Date(appointment.scheduledAt), 'HH:mm', { locale: ptBR })}
                      </p>
                      <p className="text-xs text-gray-500">{appointment.duration}min</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{appointment.client.name}</h4>
                      <p className="text-sm text-gray-600">{appointment.service.name}</p>
                      {appointment.client.phone && (
                        <p className="text-xs text-gray-500">{appointment.client.phone}</p>
                      )}
                      {appointment.notes && (
                        <p className="text-xs text-blue-600 mt-1">{appointment.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right mr-3">
                      <p className="text-sm font-semibold text-gray-900">
                        R$ {Number(appointment.totalPrice).toFixed(2)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {getStatusLabel(appointment.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {appointments.length > todayAppointments.length && (
        <Card>
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>Agendamentos futuros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments
                .filter(apt => !isToday(new Date(apt.scheduledAt)) && new Date(apt.scheduledAt) > new Date())
                .slice(0, 5)
                .map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{appointment.client.name}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(appointment.scheduledAt), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {getStatusLabel(appointment.status)}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
