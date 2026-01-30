"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Receipt,
  Plus,
  Calendar,
  Filter,
  Loader2,
  Banknote,
  Smartphone,
} from "lucide-react"
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Sale {
  id: string
  barbershopId: string
  clientId: string | null
  barberId: string | null
  appointmentId: string | null
  items: string | null
  totalAmount: string
  discount: string
  paymentMethod: string | null
  createdAt: string
  barberName?: string
  clientName?: string
  serviceName?: string
}

interface Barber {
  id: string
  name: string
  commissionRate?: number
}

interface Commission {
  id: string
  barberId: string
  barberName: string
  totalSales: number
  commissionRate: number
  commissionAmount: number
  isPaid: boolean
  period: string
}

interface FinancialManagementProps {
  barbershopId: string
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: 'Crédito',
  debit_card: 'Débito',
  pix: 'Pix',
  cash: 'Dinheiro',
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  credit_card: 'bg-blue-100 text-blue-800',
  debit_card: 'bg-green-100 text-green-800',
  pix: 'bg-teal-100 text-teal-800',
  cash: 'bg-amber-100 text-amber-800',
}

const PAYMENT_METHOD_ICONS: Record<string, React.ReactNode> = {
  credit_card: <CreditCard className="h-4 w-4" />,
  debit_card: <CreditCard className="h-4 w-4" />,
  pix: <Smartphone className="h-4 w-4" />,
  cash: <Banknote className="h-4 w-4" />,
}

export function FinancialManagement({ barbershopId }: FinancialManagementProps) {
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<Sale[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  
  const [filterBarber, setFilterBarber] = useState<string>("all")
  const [filterStartDate, setFilterStartDate] = useState<string>("")
  const [filterEndDate, setFilterEndDate] = useState<string>("")
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all")
  
  const [showCommissionModal, setShowCommissionModal] = useState(false)
  const [selectedBarberForCommission, setSelectedBarberForCommission] = useState<string>("")
  const [commissionRate, setCommissionRate] = useState<string>("50")

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [salesResponse, barbersResponse] = await Promise.all([
        apiClient.get(`/sales?barbershopId=${barbershopId}`),
        apiClient.get(`/barbers?barbershopId=${barbershopId}`)
      ])

      const salesData = salesResponse as { success: boolean; data?: { sales?: any[] } }
      const barbersData = barbersResponse as { success: boolean; data?: { barbers?: any[] } }

      if (salesData.success && salesData.data?.sales) {
        setSales(salesData.data.sales.map((sale: any) => ({
          ...sale,
          barberName: sale.barberName || 'N/A',
          clientName: sale.clientName || 'N/A',
          serviceName: sale.serviceName || 'Serviço',
        })))
      }

      if (barbersData.success && barbersData.data?.barbers) {
        setBarbers(barbersData.data.barbers)
      }
    } catch (error) {
      console.error('Error loading financial data:', error)
      toast.error('Erro ao carregar dados financeiros')
    } finally {
      setLoading(false)
    }
  }, [barbershopId])

  useEffect(() => {
    if (barbershopId) {
      loadData()
    }
  }, [barbershopId, loadData])

  const filteredSales = sales.filter(sale => {
    if (filterBarber !== "all" && sale.barberId !== filterBarber) return false
    if (filterPaymentMethod !== "all" && sale.paymentMethod !== filterPaymentMethod) return false
    if (filterStartDate) {
      const saleDate = new Date(sale.createdAt)
      const startDate = new Date(filterStartDate)
      if (saleDate < startDate) return false
    }
    if (filterEndDate) {
      const saleDate = new Date(sale.createdAt)
      const endDate = new Date(filterEndDate)
      endDate.setHours(23, 59, 59, 999)
      if (saleDate > endDate) return false
    }
    return true
  })

  const totalRevenue = filteredSales.reduce((acc, sale) => acc + parseFloat(sale.totalAmount || '0'), 0)
  
  const revenueByPaymentMethod = filteredSales.reduce((acc, sale) => {
    const method = sale.paymentMethod || 'other'
    acc[method] = (acc[method] || 0) + parseFloat(sale.totalAmount || '0')
    return acc
  }, {} as Record<string, number>)

  const barberSalesSummary = barbers.map(barber => {
    const barberSales = filteredSales.filter(s => s.barberId === barber.id)
    const totalSales = barberSales.reduce((acc, s) => acc + parseFloat(s.totalAmount || '0'), 0)
    const rate = barber.commissionRate || 50
    return {
      barberId: barber.id,
      barberName: barber.name,
      totalSales,
      commissionRate: rate,
      commissionAmount: totalSales * (rate / 100),
      salesCount: barberSales.length,
    }
  }).filter(b => b.salesCount > 0)

  const totalCommissions = barberSalesSummary.reduce((acc, b) => acc + b.commissionAmount, 0)

  const handleAddCommission = async () => {
    if (!selectedBarberForCommission || !commissionRate) {
      toast.error('Selecione um barbeiro e defina a taxa')
      return
    }
    toast.success(`Taxa de comissão de ${commissionRate}% configurada para o barbeiro`)
    setShowCommissionModal(false)
    setSelectedBarberForCommission("")
    setCommissionRate("50")
  }

  const clearFilters = () => {
    setFilterBarber("all")
    setFilterStartDate("")
    setFilterEndDate("")
    setFilterPaymentMethod("all")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        <span className="ml-2 text-gray-600">Carregando dados financeiros...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">{filteredSales.length} vendas registradas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartão de Crédito</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {(revenueByPaymentMethod['credit_card'] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredSales.filter(s => s.paymentMethod === 'credit_card').length} transações
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartão de Débito</CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              R$ {(revenueByPaymentMethod['debit_card'] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredSales.filter(s => s.paymentMethod === 'debit_card').length} transações
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pix</CardTitle>
            <Smartphone className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              R$ {(revenueByPaymentMethod['pix'] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredSales.filter(s => s.paymentMethod === 'pix').length} transações
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales">Histórico de Vendas</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Histórico de Vendas</CardTitle>
                  <CardDescription>Todas as vendas registradas da barbearia</CardDescription>
                </div>
                <Button variant="outline" onClick={clearFilters} size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Limpar Filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <Label>Barbeiro</Label>
                  <Select value={filterBarber} onValueChange={setFilterBarber}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os barbeiros" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os barbeiros</SelectItem>
                      {barbers.map(barber => (
                        <SelectItem key={barber.id} value={barber.id}>{barber.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Forma de Pagamento</Label>
                  <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as formas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as formas</SelectItem>
                      <SelectItem value="credit_card">Crédito</SelectItem>
                      <SelectItem value="debit_card">Débito</SelectItem>
                      <SelectItem value="pix">Pix</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data Inicial</Label>
                  <Input 
                    type="date" 
                    value={filterStartDate} 
                    onChange={(e) => setFilterStartDate(e.target.value)} 
                  />
                </div>
                <div>
                  <Label>Data Final</Label>
                  <Input 
                    type="date" 
                    value={filterEndDate} 
                    onChange={(e) => setFilterEndDate(e.target.value)} 
                  />
                </div>
              </div>

              {filteredSales.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma venda encontrada</p>
                  <p className="text-sm">As vendas serão registradas automaticamente quando os atendimentos forem concluídos</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-medium">Data/Hora</th>
                        <th className="text-left p-3 font-medium">Serviço</th>
                        <th className="text-left p-3 font-medium">Cliente</th>
                        <th className="text-left p-3 font-medium">Barbeiro</th>
                        <th className="text-left p-3 font-medium">Pagamento</th>
                        <th className="text-right p-3 font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((sale) => (
                        <tr key={sale.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="text-sm font-medium">
                              {format(new Date(sale.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(sale.createdAt), "HH:mm", { locale: ptBR })}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-medium">{sale.serviceName}</span>
                          </td>
                          <td className="p-3">{sale.clientName}</td>
                          <td className="p-3">{sale.barberName}</td>
                          <td className="p-3">
                            {sale.paymentMethod && (
                              <Badge className={`${PAYMENT_METHOD_COLORS[sale.paymentMethod] || 'bg-gray-100 text-gray-800'} flex items-center gap-1 w-fit`}>
                                {PAYMENT_METHOD_ICONS[sale.paymentMethod]}
                                {PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod}
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <span className="font-bold text-green-600">
                              R$ {parseFloat(sale.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Comissões dos Barbeiros</CardTitle>
                  <CardDescription>Resumo de vendas e comissões por barbeiro</CardDescription>
                </div>
                <Button onClick={() => setShowCommissionModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Configurar Comissão
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {barberSalesSummary.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma venda registrada por barbeiros</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-medium">Barbeiro</th>
                        <th className="text-center p-3 font-medium">Vendas</th>
                        <th className="text-right p-3 font-medium">Total Vendas</th>
                        <th className="text-center p-3 font-medium">Taxa (%)</th>
                        <th className="text-right p-3 font-medium">Comissão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {barberSalesSummary.map((summary) => (
                        <tr key={summary.barberId} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{summary.barberName}</td>
                          <td className="p-3 text-center">
                            <Badge variant="secondary">{summary.salesCount}</Badge>
                          </td>
                          <td className="p-3 text-right">
                            R$ {summary.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center">
                            <Badge className="bg-amber-100 text-amber-800">{summary.commissionRate}%</Badge>
                          </td>
                          <td className="p-3 text-right">
                            <span className="font-bold text-amber-600">
                              R$ {summary.commissionAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-bold">
                        <td className="p-3" colSpan={2}>Total</td>
                        <td className="p-3 text-right">
                          R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3"></td>
                        <td className="p-3 text-right text-amber-600">
                          R$ {totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showCommissionModal} onOpenChange={setShowCommissionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Taxa de Comissão</DialogTitle>
            <DialogDescription>
              Defina a porcentagem de comissão para um barbeiro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Barbeiro</Label>
              <Select value={selectedBarberForCommission} onValueChange={setSelectedBarberForCommission}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um barbeiro" />
                </SelectTrigger>
                <SelectContent>
                  {barbers.map(barber => (
                    <SelectItem key={barber.id} value={barber.id}>{barber.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Taxa de Comissão (%)</Label>
              <Input 
                type="number" 
                value={commissionRate} 
                onChange={(e) => setCommissionRate(e.target.value)}
                min="0"
                max="100"
                placeholder="50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommissionModal(false)}>Cancelar</Button>
            <Button onClick={handleAddCommission}>Salvar Comissão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
