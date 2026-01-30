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
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Receipt,
  Plus,
  Edit,
  Clock,
  Filter,
  X,
  CheckCircle,
  Loader2,
} from "lucide-react"

interface Sale {
  id: string
  sale_date: string
  client_name: string
  service_name: string
  service_price: number
  commission_rate: number
  commission_value: number
  payment_status: string
  barber_name: string
}

interface Commission {
  id: string
  barber_name: string
  period_start: string
  period_end: string
  total_sales: number
  commission_rate: number
  total_commission: number
  payment_status: string
}

interface Payment {
  id: string
  supplier: string
  description: string
  due_date: string
  amount: number
  status: string
  category: string
}

interface FinancialManagementProps {
  barbershopId: string
}

export function FinancialManagement({ barbershopId }: FinancialManagementProps) {
  const [loading, setLoading] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalCommissions, setTotalCommissions] = useState(0)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [totalPendingCommissions, setTotalPendingCommissions] = useState(0)
  const [filteredPendingCommissions, setFilteredPendingCommissions] = useState<any[]>([])
  const [barbers, setBarbers] = useState<any[]>([])
  const [uniqueBarbers, setUniqueBarbers] = useState<string[]>([])
  const [isAddingCommission, setIsAddingCommission] = useState(false)
  const [editingCommission, setEditingCommission] = useState<string | null>(null)
  const [newCommissionPercentage, setNewCommissionPercentage] = useState("")
  const [salesFilters, setSalesFilters] = useState({ type: "all", barber: "all", startDate: "", endDate: "" })
  const [allSales, setAllSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedPaymentMonth, setSelectedPaymentMonth] = useState("")
  const [newCommissionBarber, setNewCommissionBarber] = useState("")
  const [newCommissionRate, setNewCommissionRate] = useState("50")

  const loadData = useCallback(async () => {
    if (!barbershopId) return
    
    setLoading(true)
    try {
      const [salesResponse, barbersResponse] = await Promise.all([
        apiClient.get(`/sales?barbershopId=${barbershopId}`),
        apiClient.get(`/barbers?barbershopId=${barbershopId}`)
      ])

      const salesData = salesResponse as { success: boolean; data?: { sales?: any[] } }
      const barbersData = barbersResponse as { success: boolean; data?: { barbers?: any[] } }

      if (barbersData.success && barbersData.data?.barbers) {
        setBarbers(barbersData.data.barbers)
      }

      if (salesData.success && salesData.data?.sales) {
        const rawSales = salesData.data.sales
        
        const transformedSales: Sale[] = rawSales.map((sale: any) => ({
          id: sale.id,
          sale_date: sale.createdAt,
          client_name: sale.clientName || 'Cliente',
          service_name: sale.serviceName || 'Serviço',
          service_price: parseFloat(sale.totalAmount || '0'),
          commission_rate: 50,
          commission_value: parseFloat(sale.totalAmount || '0') * 0.5,
          payment_status: 'paid',
          barber_name: sale.barberName || 'Barbeiro',
        }))

        setAllSales(transformedSales)
        setFilteredSales(transformedSales)

        const total = transformedSales.reduce((acc, s) => acc + s.service_price, 0)
        setTotalRevenue(total)

        const barberNames = [...new Set(transformedSales.map(s => s.barber_name))]
        setUniqueBarbers(barberNames)

        const barberCommissions: Record<string, { total: number; count: number }> = {}
        transformedSales.forEach(sale => {
          if (!barberCommissions[sale.barber_name]) {
            barberCommissions[sale.barber_name] = { total: 0, count: 0 }
          }
          barberCommissions[sale.barber_name].total += sale.service_price
          barberCommissions[sale.barber_name].count++
        })

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        const calculatedCommissions: Commission[] = Object.entries(barberCommissions).map(([name, data], index) => ({
          id: `commission-${index}`,
          barber_name: name,
          period_start: startOfMonth.toISOString(),
          period_end: endOfMonth.toISOString(),
          total_sales: data.total,
          commission_rate: 50,
          total_commission: data.total * 0.5,
          payment_status: 'pending',
        }))

        setCommissions(calculatedCommissions)
        
        const totalComm = calculatedCommissions.reduce((acc, c) => acc + c.total_commission, 0)
        setTotalCommissions(0)
        setTotalPendingCommissions(totalComm)
        setFilteredPendingCommissions(calculatedCommissions)
      }
    } catch (error) {
      console.error('Error loading financial data:', error)
      toast.error('Erro ao carregar dados financeiros')
    } finally {
      setLoading(false)
    }
  }, [barbershopId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    let filtered = [...allSales]
    
    if (salesFilters.type !== 'all') {
      filtered = filtered.filter(s => s.payment_status === salesFilters.type)
    }
    
    if (salesFilters.barber !== 'all') {
      filtered = filtered.filter(s => s.barber_name === salesFilters.barber)
    }
    
    if (salesFilters.startDate) {
      const start = new Date(salesFilters.startDate)
      filtered = filtered.filter(s => new Date(s.sale_date) >= start)
    }
    
    if (salesFilters.endDate) {
      const end = new Date(salesFilters.endDate)
      end.setHours(23, 59, 59, 999)
      filtered = filtered.filter(s => new Date(s.sale_date) <= end)
    }
    
    setFilteredSales(filtered)
  }, [salesFilters, allSales])

  const updateCommission = (id: string, newPercentage: number) => {
    setCommissions(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          commission_rate: newPercentage,
          total_commission: c.total_sales * (newPercentage / 100)
        }
      }
      return c
    }))
    setEditingCommission(null)
    setNewCommissionPercentage("")
    toast.success('Taxa de comissão atualizada')
  }

  const markCommissionAsPaid = (commission: Commission) => {
    setCommissions(prev => prev.map(c => {
      if (c.id === commission.id) {
        return { ...c, payment_status: 'paid' }
      }
      return c
    }))
    
    const paidCommission = commissions.find(c => c.id === commission.id)
    if (paidCommission) {
      setTotalCommissions(prev => prev + paidCommission.total_commission)
      setTotalPendingCommissions(prev => prev - paidCommission.total_commission)
    }
    
    toast.success('Comissão marcada como paga')
  }

  const handleAddCommission = () => {
    if (!newCommissionBarber || !newCommissionRate) {
      toast.error('Selecione um barbeiro e defina a taxa')
      return
    }
    
    const barber = barbers.find(b => b.id === newCommissionBarber)
    if (!barber) return
    
    const existingIndex = commissions.findIndex(c => c.barber_name === barber.name)
    
    if (existingIndex >= 0) {
      const rate = parseInt(newCommissionRate)
      setCommissions(prev => prev.map((c, i) => {
        if (i === existingIndex) {
          return {
            ...c,
            commission_rate: rate,
            total_commission: c.total_sales * (rate / 100)
          }
        }
        return c
      }))
      toast.success('Taxa de comissão atualizada')
    } else {
      toast.info('Este barbeiro ainda não tem vendas registradas')
    }
    
    setIsAddingCommission(false)
    setNewCommissionBarber("")
    setNewCommissionRate("50")
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{allSales.length} vendas este mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalCommissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{commissions.filter(c => c.payment_status === 'paid').length} comissões pagas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalPendingCommissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{commissions.filter(c => c.payment_status === 'pending').length} barbeiros</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Barbeiros Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{barbers.length}</div>
            <p className="text-xs text-muted-foreground">{uniqueBarbers.length} com vendas este mês</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="commissions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="sales">Histórico de Vendas</TabsTrigger>
          <TabsTrigger value="accounts-payable">Contas a Pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Comissões dos Barbeiros</CardTitle>
                  <CardDescription>Gerencie as porcentagens de comissão por barbeiro e serviço</CardDescription>
                </div>
                <Button onClick={() => setIsAddingCommission(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Comissão
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma comissão encontrada</h3>
                  <p className="text-muted-foreground">As comissões serão calculadas automaticamente quando houver vendas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Barbeiro</th>
                        <th className="text-left p-2">Período</th>
                        <th className="text-left p-2">Total de Vendas</th>
                        <th className="text-left p-2">Taxa de Comissão (%)</th>
                        <th className="text-left p-2">Valor da Comissão</th>
                        <th className="text-left p-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((commission) => (
                        <tr key={commission.id} className="border-b">
                          <td className="p-2 font-medium">{commission.barber_name}</td>
                          <td className="p-2">
                            {new Date(commission.period_start).toLocaleDateString("pt-BR")} -{" "}
                            {new Date(commission.period_end).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="p-2">R$ {commission.total_sales.toFixed(2)}</td>
                          <td className="p-2">
                            {editingCommission === commission.id ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  value={newCommissionPercentage}
                                  onChange={(e) => setNewCommissionPercentage(e.target.value)}
                                  className="w-20"
                                  placeholder="%"
                                />
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateCommission(commission.id, Number.parseInt(newCommissionPercentage))
                                  }
                                >
                                  <Receipt className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCommission(null)
                                    setNewCommissionPercentage("")
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span>{commission.commission_rate}%</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingCommission(commission.id)
                                    setNewCommissionPercentage(commission.commission_rate.toString())
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                          <td className="p-2">R$ {commission.total_commission.toFixed(2)}</td>
                          <td className="p-2">
                            {commission.payment_status === "pending" ? (
                              <Button size="sm" onClick={() => markCommissionAsPaid(commission)}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Marcar como Pago
                              </Button>
                            ) : (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                Pago
                              </Badge>
                            )}
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

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico de Vendas</CardTitle>
                  <CardDescription>Visualize todas as vendas realizadas e comissões geradas</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filtros ativos</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <div>
                  <Label htmlFor="type-filter">Status de Pagamento</Label>
                  <Select
                    value={salesFilters.type}
                    onValueChange={(value) => setSalesFilters((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="paid">Pagos</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="barber-filter">Barbeiro</Label>
                  <Select
                    value={salesFilters.barber}
                    onValueChange={(value) => setSalesFilters((prev) => ({ ...prev, barber: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {uniqueBarbers.map((barber) => (
                        <SelectItem key={barber} value={barber}>
                          {barber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="start-date">Data Inicial</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={salesFilters.startDate}
                    onChange={(e) => setSalesFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Data Final</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={salesFilters.endDate}
                    onChange={(e) => setSalesFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              {filteredSales.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma venda encontrada</h3>
                  <p className="text-muted-foreground">As vendas serão registradas quando os atendimentos forem concluídos.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Data</th>
                        <th className="text-left p-2">Cliente</th>
                        <th className="text-left p-2">Serviço</th>
                        <th className="text-left p-2">Valor do Serviço</th>
                        <th className="text-left p-2">Taxa de Comissão (%)</th>
                        <th className="text-left p-2">Valor da Comissão</th>
                        <th className="text-left p-2">Status de Pagamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((sale) => (
                        <tr key={sale.id} className="border-b">
                          <td className="p-2">{new Date(sale.sale_date).toLocaleDateString("pt-BR")}</td>
                          <td className="p-2 font-medium">{sale.client_name}</td>
                          <td className="p-2 font-medium">{sale.service_name}</td>
                          <td className="p-2">R$ {sale.service_price.toFixed(2)}</td>
                          <td className="p-2">{sale.commission_rate}%</td>
                          <td className="p-2 font-semibold text-green-600">R$ {sale.commission_value.toFixed(2)}</td>
                          <td className="p-2">
                            <Badge variant={sale.payment_status === "paid" ? "default" : "secondary"}>
                              {sale.payment_status === "paid" ? "Pago" : "Pendente"}
                            </Badge>
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

        <TabsContent value="accounts-payable" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R${" "}
                  {payments
                    .filter((p) => p.status === "pending")
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {payments.filter((p) => p.status === "pending").length} contas pendentes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contas Vencidas</CardTitle>
                <Clock className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {payments.filter((p) => p.status === "overdue").length}
                </div>
                <p className="text-xs text-muted-foreground">Requer atenção imediata</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagamentos Realizados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {payments.filter((p) => p.status === "paid").length}
                </div>
                <p className="text-xs text-muted-foreground">No mês atual</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contas a Pagar</CardTitle>
                  <CardDescription>Gerencie as contas a pagar da barbearia</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="payment-month">Mês:</Label>
                  <Input
                    id="payment-month"
                    type="month"
                    value={selectedPaymentMonth}
                    onChange={(e) => setSelectedPaymentMonth(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {payments.filter((p) => p.status === "pending").length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-orange-500" />
                      Contas Pendentes
                    </h3>
                    <div className="grid gap-4">
                      {payments
                        .filter((p) => p.status === "pending")
                        .map((payment) => (
                          <Card key={payment.id} className="border-l-4 border-l-orange-500">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="h-12 w-12 bg-orange-100 text-orange-700 flex items-center justify-center rounded-full font-semibold">
                                    {payment.supplier
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{payment.supplier}</h4>
                                    <p className="text-sm text-muted-foreground">{payment.description}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Vencimento: {new Date(payment.due_date).toLocaleDateString("pt-BR")}
                                    </p>
                                    <Badge variant="outline">{payment.category}</Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-orange-600">R$ {payment.amount.toFixed(2)}</p>
                                  <Button size="sm" className="mt-2">
                                    Marcar como Pago
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}

                {payments.filter((p) => p.status === "paid").length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                      Pagamentos Realizados
                    </h3>
                    <div className="grid gap-4">
                      {payments
                        .filter((p) => p.status === "paid")
                        .map((payment) => (
                          <Card key={payment.id} className="border-l-4 border-l-green-500">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="h-12 w-12 bg-green-100 text-green-700 flex items-center justify-center rounded-full font-semibold">
                                    {payment.supplier
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{payment.supplier}</h4>
                                    <p className="text-sm text-muted-foreground">{payment.description}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Pago em: {new Date(payment.due_date).toLocaleDateString("pt-BR")}
                                    </p>
                                    <Badge variant="outline">{payment.category}</Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-green-600">R$ {payment.amount.toFixed(2)}</p>
                                  <Badge variant="secondary" className="bg-green-100 text-green-700 mt-2">
                                    Pago
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}

                {payments.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma conta encontrada</h3>
                    <p className="text-muted-foreground">Não há contas a pagar ou pagas para o mês selecionado.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddingCommission} onOpenChange={setIsAddingCommission}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Comissão</DialogTitle>
            <DialogDescription>
              Configure a taxa de comissão para um barbeiro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Barbeiro</Label>
              <Select value={newCommissionBarber} onValueChange={setNewCommissionBarber}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um barbeiro" />
                </SelectTrigger>
                <SelectContent>
                  {barbers.map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Taxa de Comissão (%)</Label>
              <Input
                type="number"
                value={newCommissionRate}
                onChange={(e) => setNewCommissionRate(e.target.value)}
                min="0"
                max="100"
                placeholder="50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingCommission(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCommission}>
              Salvar Comissão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
