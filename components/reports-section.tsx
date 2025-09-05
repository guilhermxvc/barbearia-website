import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, DollarSign, Download, Calendar } from "lucide-react"

export function ReportsSection() {
  const monthlyData = [
    { month: "Jan", revenue: 12500, appointments: 245, newClients: 32 },
    { month: "Fev", revenue: 13200, appointments: 268, newClients: 28 },
    { month: "Mar", revenue: 14800, appointments: 289, newClients: 45 },
    { month: "Abr", revenue: 13900, appointments: 275, newClients: 38 },
    { month: "Mai", revenue: 15600, appointments: 312, newClients: 52 },
    { month: "Jun", revenue: 16200, appointments: 324, newClients: 41 },
  ]

  const topServices = [
    { name: "Corte Clássico", count: 156, revenue: 3900 },
    { name: "Combo Corte + Barba", count: 89, revenue: 3560 },
    { name: "Barba Completa", count: 124, revenue: 2480 },
    { name: "Degradê Moderno", count: 67, revenue: 2345 },
  ]

  const topBarbers = [
    { name: "Carlos Silva", appointments: 89, revenue: 4250, rating: 4.9 },
    { name: "João Santos", appointments: 76, revenue: 3680, rating: 4.7 },
    { name: "Pedro Costa", appointments: 65, revenue: 3120, rating: 4.8 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Período
          </Button>
          <Button className="bg-amber-600 hover:bg-amber-700">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Resumo Mensal */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Faturamento Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">R$ 16.200</div>
            <p className="text-sm text-gray-600">
              <span className="text-green-600">+12%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">324</div>
            <p className="text-sm text-gray-600">
              <span className="text-blue-600">+8%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Novos Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">41</div>
            <p className="text-sm text-gray-600">
              <span className="text-red-600">-8%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução dos Últimos 6 Meses</CardTitle>
          <CardDescription>Faturamento e agendamentos por mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between space-x-2">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-8 bg-amber-600 rounded-t" style={{ height: `${(data.revenue / 20000) * 200}px` }} />
                  <div
                    className="w-8 bg-blue-400 rounded-t"
                    style={{ height: `${(data.appointments / 400) * 100}px` }}
                  />
                </div>
                <span className="text-xs text-gray-600">{data.month}</span>
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
        {/* Serviços Mais Populares */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços Mais Populares</CardTitle>
            <CardDescription>Ranking dos serviços mais procurados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <p className="text-sm text-gray-600">{service.count} agendamentos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">R$ {service.revenue}</p>
                    <Badge variant="outline">#{index + 1}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance dos Barbeiros */}
        <Card>
          <CardHeader>
            <CardTitle>Performance dos Barbeiros</CardTitle>
            <CardDescription>Ranking de performance da equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topBarbers.map((barber, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{barber.name}</p>
                    <p className="text-sm text-gray-600">{barber.appointments} agendamentos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">R$ {barber.revenue}</p>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-1">{barber.rating}</span>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
