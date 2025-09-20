"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, TrendingUp, Calendar, Scissors, AlertCircle, Download, Clock } from "lucide-react"

export function BarberReports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [barberData, setBarberData] = useState(null)
  const [isLinkedToBarbershop, setIsLinkedToBarbershop] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkBarberStatus()
  }, [])

  const checkBarberStatus = async () => {
    try {
      // Mock check - replace with real Supabase query
      const mockBarberData = {
        id: 1,
        name: "Carlos Silva",
        barbershop_id: 1,
        barbershop_name: "Barbearia Premium",
        services_completed: 45,
        total_revenue: 2250,
        commission_percentage: 60,
        commission_earned: 1350,
        pending_payment: 1350,
        services_this_month: [
          {
            id: 1,
            service_name: "Corte Clássico",
            client_name: "João Silva",
            date: "2024-01-15",
            price: 35,
            commission_rate: 60,
            commission_value: 21,
          },
          {
            id: 2,
            service_name: "Combo Corte + Barba",
            client_name: "Pedro Santos",
            date: "2024-01-14",
            price: 55,
            commission_rate: 60,
            commission_value: 33,
          },
          {
            id: 3,
            service_name: "Barba Completa",
            client_name: "Carlos Costa",
            date: "2024-01-13",
            price: 25,
            commission_rate: 60,
            commission_value: 15,
          },
        ],
      }

      setTimeout(() => {
        if (mockBarberData.barbershop_id) {
          setIsLinkedToBarbershop(true)
          setBarberData(mockBarberData)
        }
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Erro ao verificar status do barbeiro:", error)
      setLoading(false)
    }
  }

  const months = [
    { value: "0", label: "Janeiro" },
    { value: "1", label: "Fevereiro" },
    { value: "2", label: "Março" },
    { value: "3", label: "Abril" },
    { value: "4", label: "Maio" },
    { value: "5", label: "Junho" },
    { value: "6", label: "Julho" },
    { value: "7", label: "Agosto" },
    { value: "8", label: "Setembro" },
    { value: "9", label: "Outubro" },
    { value: "10", label: "Novembro" },
    { value: "11", label: "Dezembro" },
  ]

  const years = ["2024", "2023", "2022"]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!isLinkedToBarbershop) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Acesso Restrito</h3>
            <p className="text-gray-600 mb-4">
              Os relatórios financeiros só estão disponíveis quando você estiver vinculado a uma barbearia.
            </p>
            <p className="text-sm text-gray-500">
              Entre em contato com o gerente da barbearia para solicitar seu vínculo.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Relatórios Financeiros</span>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-100 text-green-800">{barberData.barbershop_name}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Serviços Realizados</p>
                <p className="text-3xl font-bold text-blue-600">{barberData.services_completed}</p>
              </div>
              <Scissors className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-3xl font-bold text-green-600">R$ {barberData.total_revenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Comissão Ganha</p>
                <p className="text-3xl font-bold text-purple-600">R$ {barberData.commission_earned.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{barberData.commission_percentage}% dos serviços</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">A Receber</p>
                <p className="text-3xl font-bold text-amber-600">R$ {barberData.pending_payment.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Pendente de pagamento</p>
              </div>
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento dos Serviços */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Serviços Realizados no Mês</span>
            <Badge variant="outline">{barberData.services_this_month.length} serviços</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {barberData.services_this_month.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                    <Scissors className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{service.service_name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Cliente: {service.client_name}</span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(service.date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">R$ {service.price}</p>
                  <p className="text-sm text-green-600">
                    Comissão: R$ {service.commission_value} ({service.commission_rate}%)
                  </p>
                </div>
              </div>
            ))}
          </div>

          {barberData.services_this_month.length === 0 && (
            <div className="text-center py-12">
              <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum serviço realizado</h3>
              <p className="text-gray-600">Não há serviços registrados para o período selecionado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
