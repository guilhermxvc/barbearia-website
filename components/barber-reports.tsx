"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Calendar, Loader2, FileText } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ServiceCommission {
  serviceId: string
  serviceName: string
  commissionRate: string
}

export function BarberReports() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [commissions, setCommissions] = useState<ServiceCommission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [user])

  const loadReports = async () => {
    try {
      setLoading(true)

      if (!user?.barber?.id) {
        return
      }

      // Fetch appointments and commissions in parallel
      const [appointmentsRes, commissionsRes] = await Promise.all([
        apiClient.get(`/appointments?barberId=${user.barber.id}`),
        apiClient.get(`/barber-service-commissions?barberId=${user.barber.id}`)
      ])

      const appointmentsData = (appointmentsRes as any).data?.appointments || (appointmentsRes as any).appointments || []
      setAppointments(appointmentsData)
      
      // Get commissions for this barber
      const commissionsData = (commissionsRes as any).data?.commissions || (commissionsRes as any).commissions || []
      if (commissionsData.length > 0) {
        setCommissions(commissionsData[0]?.services || [])
      }
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error)
    } finally {
      setLoading(false)
    }
  }
  
  // Calculate commission for a single appointment
  const getCommissionValue = (appointment: any): number => {
    const servicePrice = Number(appointment.totalPrice) || 0
    const serviceName = appointment.service?.name || ''
    
    const serviceComm = commissions.find(c => c.serviceName === serviceName)
    const commissionRate = serviceComm ? parseFloat(serviceComm.commissionRate) : 50
    
    return servicePrice * (commissionRate / 100)
  }
  
  const getCommissionRate = (appointment: any): number => {
    const serviceName = appointment.service?.name || ''
    const serviceComm = commissions.find(c => c.serviceName === serviceName)
    return serviceComm ? parseFloat(serviceComm.commissionRate) : 50
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  if (!user?.barber?.barbershop) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Não Vinculado</h3>
          <p className="text-gray-600">
            Você precisa estar vinculado a uma barbearia para ver relatórios financeiros
          </p>
        </CardContent>
      </Card>
    )
  }

  const completedAppointments = appointments.filter((a) => a.status === "completed")
  
  // Calculate total earnings based on commissions (not full service price)
  const totalEarnings = completedAppointments.reduce((sum, a) => sum + getCommissionValue(a), 0)

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Serviços Realizados</p>
                <p className="text-3xl font-bold text-gray-900">{completedAppointments.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Seus Ganhos</p>
                <p className="text-3xl font-bold text-green-600">R$ {totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-gray-400">comissões acumuladas</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Serviços Completados</CardTitle>
          <CardDescription>Histórico de serviços realizados</CardDescription>
        </CardHeader>
        <CardContent>
          {completedAppointments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum serviço completado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {appointment.service?.name || "Serviço"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {appointment.client?.user
                        ? `${appointment.client.user.firstName} ${appointment.client.user.lastName}`
                        : appointment.client?.name || "Cliente"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {appointment.scheduledAt
                        ? format(new Date(appointment.scheduledAt), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })
                        : "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      R$ {getCommissionValue(appointment).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {getCommissionRate(appointment)}% de R$ {Number(appointment.totalPrice || 0).toFixed(2)}
                    </p>
                    <Badge className="bg-green-100 text-green-800 mt-1">Completado</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
