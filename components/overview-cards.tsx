"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Calendar, TrendingUp } from "lucide-react"
import { barbershopsApi } from "@/lib/api/barbershops"

interface OverviewData {
  revenue: string
  appointments: number
  completedAppointments: number
  activeBarbers: number
  newClients: number
}

export function OverviewCards() {
  const [data, setData] = useState<OverviewData>({
    revenue: "R$ 0",
    appointments: 0,
    completedAppointments: 0,
    activeBarbers: 0,
    newClients: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Buscar ID da barbearia do localStorage (salvo no login)
      const barbershopId = localStorage.getItem('barbershopId')
      
      if (barbershopId) {
        const response = await barbershopsApi.getStats(barbershopId, 1) // 1 dia para "hoje"
        
        if (response.success && response.data) {
          const stats = response.data.stats
          setData({
            revenue: `R$ ${parseFloat(stats.revenue.total).toFixed(2)}`,
            appointments: stats.appointments.total,
            completedAppointments: stats.appointments.completed,
            activeBarbers: stats.barbers.active,
            newClients: stats.clients.new,
          })
        }
      } else {
        // Usuário não tem barbershopId - mostrar dados vazios
        console.warn("barbershopId não encontrado - usuário pode não ter barbearia")
        setData({
          revenue: "R$ 0",
          appointments: 0,
          completedAppointments: 0,
          activeBarbers: 0,
          newClients: 0,
        })
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
      // Mostrar dados vazios em caso de erro
      setData({
        revenue: "R$ 0",
        appointments: 0,
        completedAppointments: 0,
        activeBarbers: 0,
        newClients: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      title: "Faturamento Hoje",
      value: loading ? "..." : data.revenue,
      change: "+12%", // Calcular mudança real depois
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Agendamentos Hoje",
      value: loading ? "..." : data.appointments.toString(),
      change: `${data.completedAppointments} concluídos`,
      changeType: "positive" as const,
      icon: Calendar,
    },
    {
      title: "Barbeiros Ativos",
      value: loading ? "..." : data.activeBarbers.toString(),
      change: "Online agora",
      changeType: "neutral" as const,
      icon: Users,
    },
    {
      title: "Novos Clientes",
      value: loading ? "..." : data.newClients.toString(),
      change: "Hoje",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
              <IconComponent className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <p className={`text-xs ${
                card.changeType === "positive" 
                  ? "text-green-600" 
                  : card.changeType === "negative" 
                  ? "text-red-600" 
                  : "text-gray-600"
              }`}>
                {card.change}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
