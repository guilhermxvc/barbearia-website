"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Smartphone,
  Banknote,
  Calendar,
  Receipt,
  Loader2,
  User,
  Scissors,
} from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { useAuth } from "@/contexts/AuthContext"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Sale {
  id: string
  totalAmount: string
  discount: string
  paymentMethod: string
  createdAt: string
  barber?: { id: string; name: string }
  client?: { id: string; name: string }
  service?: { id: string; name: string }
  appointment?: { id: string; scheduledAt: string; serviceName?: string }
}

interface SalesStats {
  totalRevenue: number
  totalSales: number
  paymentMethodStats: Record<string, number>
}

const PAYMENT_METHOD_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  credit_card: { label: "Crédito", icon: <CreditCard className="h-4 w-4" />, color: "bg-blue-100 text-blue-700" },
  debit_card: { label: "Débito", icon: <CreditCard className="h-4 w-4" />, color: "bg-green-100 text-green-700" },
  pix: { label: "Pix", icon: <Smartphone className="h-4 w-4" />, color: "bg-teal-100 text-teal-700" },
  cash: { label: "Dinheiro", icon: <Banknote className="h-4 w-4" />, color: "bg-emerald-100 text-emerald-700" },
}

export function FinancialManagement() {
  const { user } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [stats, setStats] = useState<SalesStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [barberFilter, setBarberFilter] = useState("all")
  const [barbers, setBarbers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (user?.barbershop?.id) {
      loadData()
    }
  }, [user?.barbershop?.id])

  const loadData = async () => {
    if (!user?.barbershop?.id) return
    
    setLoading(true)
    try {
      const [salesRes, barbersRes] = await Promise.all([
        apiClient.get<{ success: boolean; sales: Sale[]; stats: SalesStats }>(
          `/sales?barbershopId=${user.barbershop.id}`
        ),
        apiClient.get<{ success: boolean; barbers: any[] }>(
          `/barbers?barbershopId=${user.barbershop.id}`
        )
      ])

      if (salesRes.success && salesRes.data) {
        const data = salesRes.data as { success: boolean; sales: Sale[]; stats: SalesStats }
        setSales(data.sales || [])
        setStats(data.stats || null)
      }

      if (barbersRes.success && barbersRes.data) {
        const data = barbersRes.data as { success: boolean; barbers: any[] }
        setBarbers(data.barbers?.map((b: any) => ({ id: b.id, name: b.name })) || [])
      }
    } catch (error) {
      console.error("Error loading financial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = barberFilter === "all" 
    ? sales 
    : sales.filter(sale => sale.barber?.id === barberFilter)

  const filteredStats = {
    totalRevenue: filteredSales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0),
    totalSales: filteredSales.length,
    paymentMethodStats: filteredSales.reduce((acc, sale) => {
      const method = sale.paymentMethod || 'other'
      acc[method] = (acc[method] || 0) + parseFloat(sale.totalAmount)
      return acc
    }, {} as Record<string, number>)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financeiro</h2>
          <p className="text-gray-500">Histórico de vendas e faturamento</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={barberFilter} onValueChange={setBarberFilter}>
            <SelectTrigger className="w-48">
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar barbeiro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os barbeiros</SelectItem>
              {barbers.map(barber => (
                <SelectItem key={barber.id} value={barber.id}>
                  {barber.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {filteredStats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredStats.totalSales} vendas registradas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartão de Crédito</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {(filteredStats.paymentMethodStats.credit_card || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredSales.filter(s => s.paymentMethod === 'credit_card').length} vendas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartão de Débito</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {(filteredStats.paymentMethodStats.debit_card || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredSales.filter(s => s.paymentMethod === 'debit_card').length} vendas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pix / Dinheiro</CardTitle>
            <Smartphone className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              R$ {((filteredStats.paymentMethodStats.pix || 0) + (filteredStats.paymentMethodStats.cash || 0)).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredSales.filter(s => s.paymentMethod === 'pix' || s.paymentMethod === 'cash').length} vendas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Histórico de Vendas
          </CardTitle>
          <CardDescription>
            Comandas registradas quando os atendimentos são concluídos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma venda registrada ainda</p>
              <p className="text-sm">As vendas aparecem aqui quando os atendimentos são concluídos</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredSales.map((sale) => (
                  <div 
                    key={sale.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <Scissors className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {sale.service?.name || sale.appointment?.serviceName || 'Serviço'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span>Cliente: {sale.client?.name || 'Desconhecido'}</span>
                          <span>•</span>
                          <span>Barbeiro: {sale.barber?.name || 'Desconhecido'}</span>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {sale.createdAt && format(new Date(sale.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {sale.paymentMethod && PAYMENT_METHOD_LABELS[sale.paymentMethod] && (
                        <Badge className={PAYMENT_METHOD_LABELS[sale.paymentMethod].color}>
                          <span className="mr-1">{PAYMENT_METHOD_LABELS[sale.paymentMethod].icon}</span>
                          {PAYMENT_METHOD_LABELS[sale.paymentMethod].label}
                        </Badge>
                      )}
                      <div className="text-right">
                        <div className="font-bold text-lg text-green-600">
                          R$ {parseFloat(sale.totalAmount).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
