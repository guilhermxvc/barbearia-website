"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Receipt,
  Edit,
  Clock,
  Filter,
  X,
  CheckCircle,
  Loader2,
  Save,
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

interface BarberServiceCommission {
  serviceId: string
  serviceName: string
  servicePrice: string
  commissionRate: string
}

interface BarberCommissions {
  barberId: string
  barberName: string
  services: BarberServiceCommission[]
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
  const [totalPendingCommissions, setTotalPendingCommissions] = useState(0)
  const [barbers, setBarbers] = useState<any[]>([])
  const [uniqueBarbers, setUniqueBarbers] = useState<string[]>([])
  const [salesFilters, setSalesFilters] = useState({ type: "all", barber: "all", startDate: "", endDate: "" })
  const [allSales, setAllSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedPaymentMonth, setSelectedPaymentMonth] = useState("")
  
  const [barberServiceCommissions, setBarberServiceCommissions] = useState<BarberCommissions[]>([])
  const [editingCommission, setEditingCommission] = useState<{barberId: string, serviceId: string} | null>(null)
  const [editingRate, setEditingRate] = useState("")
  const [savingCommission, setSavingCommission] = useState(false)
  const [selectedBarberTab, setSelectedBarberTab] = useState<string>("")

  const loadData = useCallback(async () => {
    if (!barbershopId) return
    
    setLoading(true)
    try {
      const [salesResponse, barbersResponse, commissionsResponse] = await Promise.all([
        apiClient.get(`/sales?barbershopId=${barbershopId}`),
        apiClient.get(`/barbers?barbershopId=${barbershopId}`),
        apiClient.get(`/barber-service-commissions?barbershopId=${barbershopId}`)
      ])

      const salesData = salesResponse as { success: boolean; data?: any }
      const barbersData = barbersResponse as { success: boolean; data?: any }
      const commissionsData = commissionsResponse as { success: boolean; data?: any }

      // A API retorna { barbers: [...] } e o apiClient wrapa em { success, data: {...} }
      // Então barbersData.data contém { success, barbers: [...] }
      if (barbersData.success && barbersData.data?.barbers) {
        setBarbers(barbersData.data.barbers)
      }

      // A API retorna { commissions: [...] } e o apiClient wrapa em { success, data: {...} }
      const commissionsList: BarberCommissions[] = commissionsData.data?.commissions || []
      if (commissionsData.success && commissionsList.length > 0) {
        setBarberServiceCommissions(commissionsList)
        if (!selectedBarberTab) {
          setSelectedBarberTab(commissionsList[0].barberId)
        }
      }

      if (salesData.success && salesData.data?.sales) {
        const rawSales = salesData.data.sales
        
        const transformedSales: Sale[] = rawSales.map((sale: any) => {
          const barberComm = commissionsData.success && commissionsList.length > 0
            ? commissionsList.find((bc: BarberCommissions) => bc.barberName === sale.barberName)
            : null
          
          let commRate = 50
          if (barberComm) {
            const serviceComm = barberComm.services.find((s: BarberServiceCommission) => s.serviceName === sale.serviceName)
            if (serviceComm) {
              commRate = parseFloat(serviceComm.commissionRate)
            }
          }
          
          const price = parseFloat(sale.totalAmount || '0')
          
          return {
            id: sale.id,
            sale_date: sale.createdAt,
            client_name: sale.clientName || 'Cliente',
            service_name: sale.serviceName || 'Serviço',
            service_price: price,
            commission_rate: commRate,
            commission_value: price * (commRate / 100),
            payment_status: 'paid',
            barber_name: sale.barberName || 'Barbeiro',
          }
        })

        setAllSales(transformedSales)
        setFilteredSales(transformedSales)

        const total = transformedSales.reduce((acc, s) => acc + s.service_price, 0)
        setTotalRevenue(total)

        const barberNames = [...new Set(transformedSales.map(s => s.barber_name))]
        setUniqueBarbers(barberNames)

        const totalComm = transformedSales.reduce((acc, s) => acc + s.commission_value, 0)
        setTotalPendingCommissions(totalComm)
      }
    } catch (error) {
      console.error('Error loading financial data:', error)
      toast.error('Erro ao carregar dados financeiros')
    } finally {
      setLoading(false)
    }
  }, [barbershopId, selectedBarberTab])

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

  const handleEditCommission = (barberId: string, serviceId: string, currentRate: string) => {
    setEditingCommission({ barberId, serviceId })
    setEditingRate(currentRate)
  }

  const handleSaveCommission = async () => {
    if (!editingCommission) return
    
    setSavingCommission(true)
    try {
      const response = await apiClient.post('/barber-service-commissions', {
        barbershopId,
        barberId: editingCommission.barberId,
        serviceId: editingCommission.serviceId,
        commissionRate: parseFloat(editingRate)
      }) as { success: boolean }

      if (response.success) {
        setBarberServiceCommissions(prev => prev.map(bc => {
          if (bc.barberId === editingCommission.barberId) {
            return {
              ...bc,
              services: bc.services.map(s => {
                if (s.serviceId === editingCommission.serviceId) {
                  return { ...s, commissionRate: editingRate }
                }
                return s
              })
            }
          }
          return bc
        }))
        toast.success('Comissão atualizada com sucesso')
        setEditingCommission(null)
        setEditingRate("")
        loadData()
      }
    } catch (error) {
      console.error('Error saving commission:', error)
      toast.error('Erro ao salvar comissão')
    } finally {
      setSavingCommission(false)
    }
  }

  const cancelEditCommission = () => {
    setEditingCommission(null)
    setEditingRate("")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        <span className="ml-2 text-gray-600">Carregando dados financeiros...</span>
      </div>
    )
  }

  const selectedBarberCommissions = barberServiceCommissions.find(bc => bc.barberId === selectedBarberTab)

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
            <p className="text-xs text-muted-foreground">Comissões já pagas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalPendingCommissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">A pagar aos barbeiros</p>
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
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50/30">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Comissões por Barbeiro</CardTitle>
                  <CardDescription>Configure a porcentagem de comissão de cada barbeiro para cada serviço</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {barberServiceCommissions.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                    <Receipt className="h-10 w-10 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Nenhum barbeiro ou serviço cadastrado</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">Cadastre barbeiros e serviços para configurar as comissões individuais.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {barberServiceCommissions.map((bc) => (
                      <button
                        key={bc.barberId}
                        onClick={() => setSelectedBarberTab(bc.barberId)}
                        className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                          selectedBarberTab === bc.barberId
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 scale-105'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          selectedBarberTab === bc.barberId
                            ? 'bg-white/20 text-white'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {bc.barberName.charAt(0).toUpperCase()}
                        </div>
                        {bc.barberName}
                      </button>
                    ))}
                  </div>

                  {selectedBarberCommissions && (
                    <div className="mt-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                          {selectedBarberCommissions.barberName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {selectedBarberCommissions.barberName}
                          </h3>
                          <p className="text-sm text-gray-500">{selectedBarberCommissions.services.length} serviços configurados</p>
                        </div>
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedBarberCommissions.services.map((service) => {
                          const isEditing = editingCommission?.barberId === selectedBarberCommissions.barberId && 
                                           editingCommission?.serviceId === service.serviceId
                          const price = parseFloat(service.servicePrice)
                          const rate = parseFloat(service.commissionRate)
                          const commissionValue = price * (rate / 100)
                          
                          return (
                            <div 
                              key={service.serviceId} 
                              className={`relative p-5 rounded-2xl border-2 transition-all duration-300 ${
                                isEditing 
                                  ? 'border-amber-400 bg-amber-50 shadow-lg shadow-amber-100' 
                                  : 'border-gray-100 bg-white hover:border-amber-200 hover:shadow-md'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <h4 className="font-semibold text-gray-800 text-lg">{service.serviceName}</h4>
                                {isEditing ? (
                                  <div className="flex items-center gap-1">
                                    <Button 
                                      size="sm" 
                                      onClick={handleSaveCommission}
                                      disabled={savingCommission}
                                      className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600"
                                    >
                                      {savingCommission ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={cancelEditCommission}
                                      className="h-8 w-8 p-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleEditCommission(
                                      selectedBarberCommissions.barberId, 
                                      service.serviceId, 
                                      service.commissionRate
                                    )}
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">Preço do Serviço</span>
                                  <span className="font-medium text-gray-700">R$ {price.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">Taxa de Comissão</span>
                                  {isEditing ? (
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        value={editingRate}
                                        onChange={(e) => setEditingRate(e.target.value)}
                                        className="w-16 h-8 text-center text-sm font-semibold"
                                        min="0"
                                        max="100"
                                      />
                                      <span className="text-sm font-medium text-gray-600">%</span>
                                    </div>
                                  ) : (
                                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-3 py-1 text-sm font-bold">
                                      {rate}%
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="pt-3 border-t border-gray-100">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Comissão</span>
                                    <span className="text-lg font-bold text-green-600">
                                      R$ {isEditing 
                                        ? (price * (parseFloat(editingRate || '0') / 100)).toFixed(2)
                                        : commissionValue.toFixed(2)
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
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
                        <th className="text-left p-2">Barbeiro</th>
                        <th className="text-left p-2">Valor do Serviço</th>
                        <th className="text-left p-2">Comissão (%)</th>
                        <th className="text-left p-2">Valor da Comissão</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((sale) => (
                        <tr key={sale.id} className="border-b">
                          <td className="p-2">{new Date(sale.sale_date).toLocaleDateString("pt-BR")}</td>
                          <td className="p-2 font-medium">{sale.client_name}</td>
                          <td className="p-2">{sale.service_name}</td>
                          <td className="p-2">{sale.barber_name}</td>
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
    </div>
  )
}
