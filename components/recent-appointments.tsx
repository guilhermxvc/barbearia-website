import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, User } from "lucide-react"

export function RecentAppointments() {
  const appointments = [
    {
      id: 1,
      client: "Carlos Silva",
      service: "Corte + Barba",
      barber: "João",
      time: "09:00",
      status: "confirmado",
      value: "R$ 45",
    },
    {
      id: 2,
      client: "Pedro Santos",
      service: "Corte Clássico",
      barber: "Carlos",
      time: "09:30",
      status: "em-andamento",
      value: "R$ 25",
    },
    {
      id: 3,
      client: "Ana Costa",
      service: "Barba Completa",
      barber: "João",
      time: "10:00",
      status: "confirmado",
      value: "R$ 20",
    },
    {
      id: 4,
      client: "Lucas Oliveira",
      service: "Corte + Desenho",
      barber: "Pedro",
      time: "10:30",
      status: "confirmado",
      value: "R$ 35",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "bg-green-100 text-green-800"
      case "em-andamento":
        return "bg-blue-100 text-blue-800"
      case "cancelado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{appointment.client}</p>
              <p className="text-sm text-gray-500">{appointment.service}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {appointment.time} - {appointment.barber}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">{appointment.value}</p>
            <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
              {appointment.status.replace("-", " ")}
            </Badge>
          </div>
        </div>
      ))}
      <Button variant="outline" className="w-full bg-transparent">
        Ver Todos os Agendamentos
      </Button>
    </div>
  )
}
