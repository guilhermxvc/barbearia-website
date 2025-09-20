"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, DollarSign, Download, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import { reportsApi, ReportsData, MonthlyData } from "@/lib/api/reports"

export function ReportsSection() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [period, setPeriod] = useState("6")
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadReports()
  }, [period])

  const loadReports = async () => {
    setLoading(true)
    setError("")
    
    try {
      const barbershopId = localStorage.getItem('barbershopId')
      
      if (!barbershopId) {
        setError("ID da barbearia não encontrado")
        return
      }

      const response = await reportsApi.getReports(barbershopId, period)
      
      if (response.success && response.data) {
        setData(response.data)
      } else {
        setError(response.error || "Erro ao carregar relatórios")
      }
    } catch (err) {
      setError("Erro ao carregar relatórios")
      console.error("Load reports error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: 'monthly' | 'services' | 'barbers' | 'financial') => {
    setExporting(true)
    
    try {
      const barbershopId = localStorage.getItem('barbershopId')
      
      if (!barbershopId) {
        alert("ID da barbearia não encontrado")
        return
      }

      const response = await reportsApi.exportReport(barbershopId, type, 'csv')
      
      if (response.success && response.data) {
        // Criar link de download
        const url = window.URL.createObjectURL(response.data)
        const link = document.createElement('a')
        link.href = url
        link.download = `relatorio_${type}_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        alert(response.error || "Erro ao exportar relatório")
      }
    } catch (err) {
      alert("Erro ao exportar relatório")
      console.error("Export error:", err)
    } finally {
      setExporting(false)
    }
  }

  const getChangePercentage = (current: number, previous: number): { value: number; isPositive: boolean } => {
    if (previous === 0) return { value: 0, isPositive: true }
    const change = ((current - previous) / previous) * 100
    return { value: Math.abs(change), isPositive: change >= 0 }
  }

  const getCurrentPeriodData = () => {
    if (!data?.monthlyData || data.monthlyData.length === 0) return null
    
    const current = data.monthlyData[data.monthlyData.length - 1]
    const previous = data.monthlyData.length > 1 ? data.monthlyData[data.monthlyData.length - 2] : null
    
    return {
      current,
      previous,
      revenueChange: previous ? getChangePercentage(current.revenue, previous.revenue) : { value: 0, isPositive: true },
      appointmentsChange: previous ? getChangePercentage(current.appointments, previous.appointments) : { value: 0, isPositive: true },
      clientsChange: previous ? getChangePercentage(current.newClients, previous.newClients) : { value: 0, isPositive: true },
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg">Carregando relatórios...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
        <Button 
          onClick={loadReports} 
          className="ml-4 bg-red-600 hover:bg-red-700"
          size="sm"
        >
          Tentar Novamente
        </Button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Nenhum dado encontrado</p>
      </div>
    )
  }

  const periodData = getCurrentPeriodData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => handleExport('monthly')}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Mensal
          </Button>
          <Button 
            className="bg-amber-600 hover:bg-amber-700"
            onClick={() => handleExport('financial')}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Relatório Financeiro
          </Button>
        </div>
      </div>

      {/* Resumo Mensal */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Faturamento {periodData?.current.month}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              R$ {periodData?.current.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </div>
            {periodData?.revenueChange && periodData.previous && (
              <p className="text-sm text-gray-600 flex items-center">
                {periodData.revenueChange.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={periodData.revenueChange.isPositive ? "text-green-600" : "text-red-600"}>
                  {periodData.revenueChange.isPositive ? "+" : "-"}{periodData.revenueChange.value.toFixed(1)}%
                </span>
                <span className="ml-1">vs mês anterior</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Agendamentos {periodData?.current.month}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {periodData?.current.appointments || 0}
            </div>
            {periodData?.appointmentsChange && periodData.previous && (
              <p className="text-sm text-gray-600 flex items-center">
                {periodData.appointmentsChange.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={periodData.appointmentsChange.isPositive ? "text-green-600" : "text-red-600"}>
                  {periodData.appointmentsChange.isPositive ? "+" : "-"}{periodData.appointmentsChange.value.toFixed(1)}%
                </span>
                <span className="ml-1">vs mês anterior</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Novos Clientes {periodData?.current.month}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {periodData?.current.newClients || 0}
            </div>
            {periodData?.clientsChange && periodData.previous && (
              <p className="text-sm text-gray-600 flex items-center">
                {periodData.clientsChange.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={periodData.clientsChange.isPositive ? "text-green-600" : "text-red-600"}>
                  {periodData.clientsChange.isPositive ? "+" : "-"}{periodData.clientsChange.value.toFixed(1)}%
                </span>
                <span className="ml-1">vs mês anterior</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução dos Últimos {period} Meses</CardTitle>
          <CardDescription>Faturamento e agendamentos por mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between space-x-2">
            {data.monthlyData.map((monthData, index) => {
              const maxRevenue = Math.max(...data.monthlyData.map(d => d.revenue))
              const maxAppointments = Math.max(...data.monthlyData.map(d => d.appointments))
              
              return (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div className="flex flex-col items-center space-y-1">
                    <div 
                      className="w-8 bg-amber-600 rounded-t" 
                      style={{ 
                        height: `${maxRevenue > 0 ? (monthData.revenue / maxRevenue) * 200 : 0}px`,
                        minHeight: monthData.revenue > 0 ? '4px' : '0px'
                      }} 
                      title={`Faturamento: R$ ${monthData.revenue.toLocaleString('pt-BR')}`}
                    />
                    <div
                      className="w-8 bg-blue-400 rounded-t"
                      style={{ 
                        height: `${maxAppointments > 0 ? (monthData.appointments / maxAppointments) * 100 : 0}px`,
                        minHeight: monthData.appointments > 0 ? '4px' : '0px'
                      }}
                      title={`Agendamentos: ${monthData.appointments}`}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{monthData.month}</span>
                </div>
              )
            })}
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

      {/* Top Serviços */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Serviços Mais Populares</CardTitle>
              <CardDescription>Ranking de serviços por quantidade de agendamentos</CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => handleExport('services')}
              disabled={exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topServices.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">#{index + 1}</Badge>
                  <div>
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.count} agendamentos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    R$ {service.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-600">faturamento</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Barbeiros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance dos Barbeiros</CardTitle>
              <CardDescription>Ranking por número de agendamentos</CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => handleExport('barbers')}
              disabled={exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topBarbers.map((barber, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">#{index + 1}</Badge>
                  <div>
                    <h3 className="font-semibold">{barber.name}</h3>
                    <p className="text-sm text-gray-600">{barber.appointments} agendamentos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    R$ {barber.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-1">{barber.rating.toFixed(1)}</span>
                    <Badge variant="outline">★</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}