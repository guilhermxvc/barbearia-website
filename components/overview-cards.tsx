import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Calendar, TrendingUp } from "lucide-react"

export function OverviewCards() {
  const cards = [
    {
      title: "Faturamento Hoje",
      value: "R$ 1.240",
      change: "+12%",
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Agendamentos Hoje",
      value: "24",
      change: "+3",
      changeType: "positive" as const,
      icon: Calendar,
    },
    {
      title: "Clientes Ativos",
      value: "342",
      change: "+18",
      changeType: "positive" as const,
      icon: Users,
    },
    {
      title: "Taxa de Ocupação",
      value: "87%",
      change: "+5%",
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
              <p className={`text-xs ${card.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                {card.change} em relação a ontem
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
