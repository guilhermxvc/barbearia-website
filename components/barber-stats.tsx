import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Calendar, DollarSign, Star, Clock } from "lucide-react"

export function BarberStats() {
  const monthlyStats = [
    { month: "Jan", appointments: 89, earnings: 3250, rating: 4.8 },
    { month: "Fev", appointments: 95, earnings: 3680, rating: 4.9 },
    { month: "Mar", appointments: 102, earnings: 4120, rating: 4.9 },
    { month: "Abr", appointments: 87, earnings: 3890, rating: 4.8 },
    { month: "Mai", appointments: 110, earnings: 4250, rating: 4.9 },
    { month: "Jun", appointments: 98, earnings: 3950, rating: 4.9 },
  ]

  const topServices = [
    { name: "Corte Clássico", count: 45, percentage: 35 },
    { name: "Combo Corte + Barba", count: 32, percentage: 25 },
    { name: "Barba Completa", count: 28, percentage: 22 },
    { name: "Degradê Moderno", count: 23, percentage: 18 },
  ]

  const currentMonth = monthlyStats[monthlyStats.length - 1]

  return (
    <div className="space-y-6">
      {/* Resumo do Mês Atual */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Agendamentos</p>
                <p className="text-2xl font-bold text-gray-900">{currentMonth.appointments}</p>
                <p className="text-xs text-green-600">+12% vs mês anterior</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Faturamento</p>
                <p className="text-2xl font-bold text-gray-900">R$ {currentMonth.earnings}</p>
                <p className="text-xs text-green-600">+8% vs mês anterior</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avaliação Média</p>
                <p className="text-2xl font-bold text-gray-900">{currentMonth.rating}</p>
                <p className="text-xs text-green-600">Mantida</p>
              </div>
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold text-gray-900">35min</p>
                <p className="text-xs text-blue-600">Por serviço</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-amber-600" />
            Evolução dos Últimos 6 Meses
          </CardTitle>
          <CardDescription>Agendamentos e faturamento mensal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between space-x-4">
            {monthlyStats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div className="flex flex-col items-center space-y-1">
                  <div
                    className="w-12 bg-amber-600 rounded-t"
                    style={{ height: `${(stat.earnings / 5000) * 150}px` }}
                  />
                  <div
                    className="w-12 bg-blue-400 rounded-t"
                    style={{ height: `${(stat.appointments / 150) * 80}px` }}
                  />
                </div>
                <span className="text-xs text-gray-600">{stat.month}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-amber-600 rounded mr-2" />
              <span className="text-sm text-gray-600">Faturamento</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-400 rounded mr-2" />
              <span className="text-sm text-gray-600">Agendamentos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Serviços Mais Realizados */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Serviços Mais Realizados</CardTitle>
            <CardDescription>Distribuição dos serviços no mês atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topServices.map((service, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{service.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{service.count}</span>
                      <Badge variant="outline">{service.percentage}%</Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${service.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Metas e Conquistas */}
        <Card>
          <CardHeader>
            <CardTitle>Metas do Mês</CardTitle>
            <CardDescription>Acompanhe seu progresso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Agendamentos (Meta: 120)</span>
                  <span className="text-sm text-gray-600">98/120</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: "82%" }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Faturamento (Meta: R$ 4.500)</span>
                  <span className="text-sm text-gray-600">R$ 3.950/4.500</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: "88%" }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Avaliação (Meta: 4.8)</span>
                  <span className="text-sm text-gray-600">4.9/5.0</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "98%" }} />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Conquistas Recentes</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 100+ agendamentos no mês</li>
                <li>• Avaliação 4.9+ por 3 meses consecutivos</li>
                <li>• Cliente mais fiel: João Costa (22 visitas)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
