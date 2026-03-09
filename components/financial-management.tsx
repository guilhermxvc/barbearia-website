"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  Search,
  Percent,
  CreditCard,
  Download,
  Eye,
  FileText,
  Banknote,
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
  payment_method: string
  barber_name: string
  barber_id: string
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

interface CommissionReceiptData {
  id: string
  barberId: string
  receiptNumber: string
  referenceMonth: string
  paymentMethod: string
  totalServices: string
  totalCommissions: string
  serviceDetails: ServiceDetail[]
  barberName: string
  barbershopName: string
  barbershopAddress: string | null
  paidAt: string
  createdAt: string
}

interface ServiceDetail {
  serviceName: string
  qty: number
  unitPrice: number
  total: number
  commissionRate: number
  commissionValue: number
}

interface PaymentBarber {
  barberId: string
  name: string
  total: number
  services: number
  monthKey: string
  monthLabel: string
  isOverdue: boolean
  salesForMonth: Sale[]
}

interface FinancialManagementProps {
  barbershopId: string
}

export function FinancialManagement({ barbershopId }: FinancialManagementProps) {
  const [loading, setLoading] = useState(true)
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [totalCommissions, setTotalCommissions] = useState(0)
  const [monthlyPendingCommissions, setMonthlyPendingCommissions] = useState(0)
  const [overdueCommissions, setOverdueCommissions] = useState(0)
  const [barbers, setBarbers] = useState<any[]>([])
  const [uniqueBarbers, setUniqueBarbers] = useState<string[]>([])
  const [salesFilters, setSalesFilters] = useState(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return { service: "all", barber: "all", month: currentMonth }
  })
  const [services, setServices] = useState<any[]>([])
  const [allSales, setAllSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  
  const [barberServiceCommissions, setBarberServiceCommissions] = useState<BarberCommissions[]>([])
  const [savingCommission, setSavingCommission] = useState(false)
  const [barberSearchFilter, setBarberSearchFilter] = useState("")
  const [selectedBarberForModal, setSelectedBarberForModal] = useState<BarberCommissions | null>(null)
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false)
  const [editedCommissions, setEditedCommissions] = useState<Record<string, string>>({})

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedPaymentBarber, setSelectedPaymentBarber] = useState<PaymentBarber | null>(null)
  const [paymentMethodChoice, setPaymentMethodChoice] = useState("")
  const [processingPayment, setProcessingPayment] = useState(false)
  const [commissionReceipts, setCommissionReceipts] = useState<CommissionReceiptData[]>([])
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<CommissionReceiptData | null>(null)

  const loadData = useCallback(async () => {
    if (!barbershopId) return
    
    setLoading(true)
    try {
      const [salesResponse, barbersResponse, commissionsResponse, servicesResponse, receiptsResponse] = await Promise.all([
        apiClient.get(`/sales?barbershopId=${barbershopId}`),
        apiClient.get(`/barbers?barbershopId=${barbershopId}`),
        apiClient.get(`/barber-service-commissions?barbershopId=${barbershopId}`),
        apiClient.get(`/services?barbershopId=${barbershopId}`),
        apiClient.get(`/commission-receipts?barbershopId=${barbershopId}`)
      ])

      const salesData = salesResponse as { success: boolean; data?: any }
      const barbersData = barbersResponse as { success: boolean; data?: any }
      const commissionsData = commissionsResponse as { success: boolean; data?: any }
      const servicesData = servicesResponse as { success: boolean; data?: any }
      const receiptsData = receiptsResponse as { success: boolean; data?: any }

      const loadedReceipts: CommissionReceiptData[] = receiptsData.data?.receipts || []
      if (receiptsData.success) {
        setCommissionReceipts(loadedReceipts)
      }

      // Processar barbeiros
      if (barbersData.success && barbersData.data?.barbers) {
        const barbersList = barbersData.data.barbers
        setBarbers(barbersList)
        // Usar nomes dos barbeiros da API para o filtro
        const barberNames = barbersList.map((b: any) => b.user?.name || b.name || 'Barbeiro').filter(Boolean)
        setUniqueBarbers(barberNames)
      }
      
      // Processar serviços
      if (servicesData.success && servicesData.data?.services) {
        setServices(servicesData.data.services)
      }

      // A API retorna { commissions: [...] } e o apiClient wrapa em { success, data: {...} }
      const commissionsList: BarberCommissions[] = commissionsData.data?.commissions || []
      if (commissionsData.success && commissionsList.length > 0) {
        setBarberServiceCommissions(commissionsList)
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
            payment_method: sale.paymentMethod || 'Não informado',
            barber_name: sale.barberName || 'Barbeiro',
            barber_id: sale.barberId || '',
          }
        })

        setAllSales(transformedSales)
        setFilteredSales(transformedSales)

        // Calculate monthly metrics
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        
        const currentMonthSales = transformedSales.filter(s => {
          const saleDate = new Date(s.sale_date)
          return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear
        })
        
        const previousMonthsSales = transformedSales.filter(s => {
          const saleDate = new Date(s.sale_date)
          return saleDate.getMonth() !== currentMonth || saleDate.getFullYear() !== currentYear
        })
        
        // Revenue only for current month
        const monthRevenue = currentMonthSales.reduce((acc, s) => acc + s.service_price, 0)
        setMonthlyRevenue(monthRevenue)

        const paidTotal = loadedReceipts.reduce((acc, r) => acc + parseFloat(r.totalCommissions), 0)
        setTotalCommissions(paidTotal)

        const paidMonthBarbers = new Set(loadedReceipts.map(r => `${r.barberId}|${r.referenceMonth}`))

        const currentMonthPendingSales = currentMonthSales.filter(s => {
          const key = `${s.barber_id}|${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
          return !paidMonthBarbers.has(key)
        })
        const monthPendingComm = currentMonthPendingSales.reduce((acc, s) => acc + s.commission_value, 0)
        setMonthlyPendingCommissions(monthPendingComm)
        
        const overdueSales = previousMonthsSales.filter(s => {
          const d = new Date(s.sale_date)
          const key = `${s.barber_id}|${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          return !paidMonthBarbers.has(key)
        })
        const overdueComm = overdueSales.reduce((acc, s) => acc + s.commission_value, 0)
        setOverdueCommissions(overdueComm)
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
    
    if (salesFilters.service !== 'all') {
      filtered = filtered.filter(s => s.service_name === salesFilters.service)
    }
    
    if (salesFilters.barber !== 'all') {
      filtered = filtered.filter(s => s.barber_name === salesFilters.barber)
    }
    
    if (salesFilters.month) {
      filtered = filtered.filter(s => {
        const saleDate = new Date(s.sale_date)
        const saleMonth = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`
        return saleMonth === salesFilters.month
      })
    }
    
    setFilteredSales(filtered)
  }, [salesFilters, allSales])

  const openBarberModal = (barber: BarberCommissions) => {
    setSelectedBarberForModal(barber)
    const initialRates: Record<string, string> = {}
    barber.services.forEach(s => {
      initialRates[s.serviceId] = s.commissionRate
    })
    setEditedCommissions(initialRates)
    setIsCommissionModalOpen(true)
  }

  const closeBarberModal = () => {
    setIsCommissionModalOpen(false)
    setSelectedBarberForModal(null)
    setEditedCommissions({})
  }

  const handleSaveAllCommissions = async () => {
    if (!selectedBarberForModal) return
    
    setSavingCommission(true)
    try {
      const promises = Object.entries(editedCommissions).map(([serviceId, rate]) =>
        apiClient.post('/barber-service-commissions', {
          barbershopId,
          barberId: selectedBarberForModal.barberId,
          serviceId,
          commissionRate: parseFloat(rate)
        })
      )
      
      await Promise.all(promises)
      
      setBarberServiceCommissions(prev => prev.map(bc => {
        if (bc.barberId === selectedBarberForModal.barberId) {
          return {
            ...bc,
            services: bc.services.map(s => ({
              ...s,
              commissionRate: editedCommissions[s.serviceId] || s.commissionRate
            }))
          }
        }
        return bc
      }))
      
      toast.success('Comissões salvas com sucesso')
      closeBarberModal()
      loadData()
    } catch (error) {
      console.error('Error saving commissions:', error)
      toast.error('Erro ao salvar comissões')
    } finally {
      setSavingCommission(false)
    }
  }

  const filteredBarbers = barberServiceCommissions.filter(bc =>
    bc.barberName.toLowerCase().includes(barberSearchFilter.toLowerCase())
  )

  const openPaymentModal = (barber: PaymentBarber) => {
    setSelectedPaymentBarber(barber)
    setPaymentMethodChoice("")
    setIsPaymentModalOpen(true)
  }

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false)
    setSelectedPaymentBarber(null)
    setPaymentMethodChoice("")
  }

  const buildServiceDetails = (salesForMonth: Sale[]): ServiceDetail[] => {
    const serviceMap: Record<string, { qty: number; unitPrice: number; total: number; commissionRate: number; commissionValue: number }> = {}
    salesForMonth.forEach(sale => {
      if (!serviceMap[sale.service_name]) {
        serviceMap[sale.service_name] = { qty: 0, unitPrice: sale.service_price, total: 0, commissionRate: sale.commission_rate, commissionValue: 0 }
      }
      serviceMap[sale.service_name].qty += 1
      serviceMap[sale.service_name].total += sale.service_price
      serviceMap[sale.service_name].commissionValue += sale.commission_value
    })
    return Object.entries(serviceMap).map(([serviceName, data]) => ({
      serviceName,
      qty: data.qty,
      unitPrice: data.unitPrice,
      total: data.total,
      commissionRate: data.commissionRate,
      commissionValue: data.commissionValue,
    }))
  }

  const handleProcessPayment = async () => {
    if (!selectedPaymentBarber || !paymentMethodChoice) return

    setProcessingPayment(true)
    try {
      const serviceDetails = buildServiceDetails(selectedPaymentBarber.salesForMonth)
      const totalServicesVal = serviceDetails.reduce((acc, s) => acc + s.total, 0)
      const totalCommissionsVal = serviceDetails.reduce((acc, s) => acc + s.commissionValue, 0)

      const barberRecord = barbers.find((b: any) => {
        const bName = b.user?.name || b.name || ''
        return bName === selectedPaymentBarber.name
      })

      const response = await apiClient.post('/commission-receipts', {
        barbershopId,
        barberId: barberRecord?.id || selectedPaymentBarber.barberId,
        referenceMonth: selectedPaymentBarber.monthKey,
        paymentMethod: paymentMethodChoice,
        totalServices: totalServicesVal,
        totalCommissions: totalCommissionsVal,
        serviceDetails,
        barberName: selectedPaymentBarber.name,
      })

      const responseData = response as { success: boolean; data?: any }
      if (responseData.success) {
        toast.success('Pagamento registrado e recibo gerado com sucesso!')
        closePaymentModal()
        if (responseData.data?.receipt) {
          setSelectedReceipt(responseData.data.receipt)
          setIsReceiptModalOpen(true)
        }
        loadData()
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Erro ao processar pagamento')
    } finally {
      setProcessingPayment(false)
    }
  }

  const openReceiptModal = (receipt: CommissionReceiptData) => {
    setSelectedReceipt(receipt)
    setIsReceiptModalOpen(true)
  }

  const isMonthPaid = (barberId: string, monthKey: string): boolean => {
    return commissionReceipts.some(r => r.barberId === barberId && r.referenceMonth === monthKey)
  }

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'pix': return 'PIX'
      case 'cash': return 'Dinheiro'
      case 'transfer': return 'Transferência'
      case 'credit_card': return 'Cartão de Crédito'
      case 'debit_card': return 'Cartão de Débito'
      case 'check': return 'Cheque'
      default: return method
    }
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
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Faturamento do mês vigente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalCommissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Pagas neste mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">R$ {monthlyPendingCommissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Mês atual - a pagar quando fechar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Atrasadas</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {overdueCommissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Meses anteriores não pagos</p>
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Comissões por Barbeiro</CardTitle>
                  <CardDescription>Clique em um barbeiro para definir as taxas de comissão de cada serviço</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar barbeiro..."
                    value={barberSearchFilter}
                    onChange={(e) => setBarberSearchFilter(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {barberServiceCommissions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum barbeiro cadastrado</h3>
                  <p className="text-muted-foreground">Cadastre barbeiros e serviços para configurar as comissões.</p>
                </div>
              ) : filteredBarbers.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum barbeiro encontrado</h3>
                  <p className="text-muted-foreground">Tente buscar por outro nome.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredBarbers.map((barber) => {
                    const avgCommission = barber.services.length > 0
                      ? barber.services.reduce((acc: number, s: BarberServiceCommission) => acc + parseFloat(s.commissionRate), 0) / barber.services.length
                      : 0
                    
                    return (
                      <div
                        key={barber.barberId}
                        onClick={() => openBarberModal(barber)}
                        className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold">
                            {barber.barberName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{barber.barberName}</h4>
                            <p className="text-sm text-gray-500">{barber.services.length} serviços</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Comissão média</p>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                              {avgCommission.toFixed(0)}%
                            </Badge>
                          </div>
                          <Edit className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={isCommissionModalOpen} onOpenChange={setIsCommissionModalOpen}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedBarberForModal && (
                    <>
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold">
                        {selectedBarberForModal.barberName.charAt(0).toUpperCase()}
                      </div>
                      <span>Comissões de {selectedBarberForModal.barberName}</span>
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Defina a porcentagem de comissão para cada serviço
                </DialogDescription>
              </DialogHeader>
              
              {selectedBarberForModal && (
                <div className="space-y-4 mt-4">
                  {selectedBarberForModal.services.map((service) => {
                    const price = parseFloat(service.servicePrice)
                    const rate = parseFloat(editedCommissions[service.serviceId] || service.commissionRate)
                    const commissionValue = price * (rate / 100)
                    
                    return (
                      <div key={service.serviceId} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{service.serviceName}</h4>
                            <p className="text-sm text-gray-500">Preço: R$ {price.toFixed(2)}</p>
                          </div>
                          <span className="text-green-600 font-semibold">
                            R$ {commissionValue.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Label className="text-sm text-gray-600 min-w-fit">Comissão:</Label>
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="number"
                              value={editedCommissions[service.serviceId] || service.commissionRate}
                              onChange={(e) => setEditedCommissions(prev => ({
                                ...prev,
                                [service.serviceId]: e.target.value
                              }))}
                              className="w-20 text-center"
                              min="0"
                              max="100"
                            />
                            <Percent className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={closeBarberModal}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveAllCommissions}
                      disabled={savingCommission}
                      className="flex-1 bg-amber-600 hover:bg-amber-700"
                    >
                      {savingCommission ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Comissões
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
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
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div>
                  <Label htmlFor="service-filter">Serviços e Produtos</Label>
                  <Select
                    value={salesFilters.service}
                    onValueChange={(value) => setSalesFilters((prev) => ({ ...prev, service: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.name}>
                          {service.name}
                        </SelectItem>
                      ))}
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
                  <Label htmlFor="month-filter">Mês</Label>
                  <Input
                    id="month-filter"
                    type="month"
                    value={salesFilters.month}
                    onChange={(e) => setSalesFilters((prev) => ({ ...prev, month: e.target.value }))}
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
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-medium">Data</th>
                        <th className="text-left p-3 font-medium">Cliente</th>
                        <th className="text-left p-3 font-medium">Serviço</th>
                        <th className="text-left p-3 font-medium">Barbeiro</th>
                        <th className="text-left p-3 font-medium">Valor</th>
                        <th className="text-left p-3 font-medium">Pagamento</th>
                        <th className="text-left p-3 font-medium">Comissão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((sale) => (
                        <tr key={sale.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{new Date(sale.sale_date).toLocaleDateString("pt-BR")}</td>
                          <td className="p-3 font-medium">{sale.client_name}</td>
                          <td className="p-3">{sale.service_name}</td>
                          <td className="p-3">{sale.barber_name}</td>
                          <td className="p-3 font-medium">R$ {sale.service_price.toFixed(2)}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="capitalize">
                              {sale.payment_method === 'credit_card' ? 'Cartão Crédito' :
                               sale.payment_method === 'debit_card' ? 'Cartão Débito' :
                               sale.payment_method === 'pix' ? 'PIX' :
                               sale.payment_method === 'cash' || sale.payment_method === 'dinheiro' ? 'Dinheiro' :
                               sale.payment_method}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className="text-green-600 font-medium">R$ {sale.commission_value.toFixed(2)}</span>
                            <span className="text-gray-400 text-sm ml-1">({sale.commission_rate}%)</span>
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
          {(() => {
            const now = new Date()
            const currentMonth = now.getMonth()
            const currentYear = now.getFullYear()
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

            const currentMonthSales = allSales.filter(s => {
              const d = new Date(s.sale_date)
              return d.getMonth() === currentMonth && d.getFullYear() === currentYear
            })

            const previousMonthsSales = allSales.filter(s => {
              const d = new Date(s.sale_date)
              return d.getMonth() !== currentMonth || d.getFullYear() !== currentYear
            })

            const groupByBarberWithSales = (sales: Sale[], monthKey: string, monthLabel: string, isOverdue: boolean) => {
              const map: Record<string, PaymentBarber> = {}
              sales.forEach(sale => {
                const barberRecord = barbers.find((b: any) => (b.user?.name || b.name) === sale.barber_name)
                if (!map[sale.barber_name]) {
                  map[sale.barber_name] = {
                    barberId: barberRecord?.id || '',
                    name: sale.barber_name,
                    total: 0,
                    services: 0,
                    monthKey,
                    monthLabel,
                    isOverdue,
                    salesForMonth: []
                  }
                }
                map[sale.barber_name].total += sale.commission_value
                map[sale.barber_name].services += 1
                map[sale.barber_name].salesForMonth.push(sale)
              })
              return Object.values(map).sort((a, b) => b.total - a.total)
            }

            const overdueByMonth: Record<string, Sale[]> = {}
            previousMonthsSales.forEach(s => {
              const d = new Date(s.sale_date)
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
              if (!overdueByMonth[key]) overdueByMonth[key] = []
              overdueByMonth[key].push(s)
            })
            const sortedOverdueMonths = Object.keys(overdueByMonth).sort().reverse()

            const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
            const currentMonthLabel = `${monthNames[currentMonth]} ${currentYear}`
            const pendingBarbers = groupByBarberWithSales(currentMonthSales, currentMonthKey, currentMonthLabel, false)

            const unpaidPending = pendingBarbers.filter(b => !isMonthPaid(b.barberId, b.monthKey))
            const allOverdueBarbers: PaymentBarber[] = []
            sortedOverdueMonths.forEach(monthKey => {
              const [year, month] = monthKey.split('-').map(Number)
              const monthLabel = `${monthNames[month - 1]} ${year}`
              const monthSales = overdueByMonth[monthKey]
              const monthBarbers = groupByBarberWithSales(monthSales, monthKey, monthLabel, true)
              monthBarbers.forEach(b => {
                if (!isMonthPaid(b.barberId, b.monthKey)) {
                  allOverdueBarbers.push(b)
                }
              })
            })

            const grandTotal = [...allOverdueBarbers, ...unpaidPending].reduce((acc, b) => acc + b.total, 0)
            const hasItems = allOverdueBarbers.length > 0 || unpaidPending.length > 0

            return (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-amber-600" />
                        Comissões Pendentes
                      </CardTitle>
                      <CardDescription>Clique em um barbeiro para registrar o pagamento</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total pendente</p>
                      <p className="text-2xl font-bold text-amber-600">R$ {grandTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!hasItems ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
                      <p className="font-medium">Nenhuma comissão pendente</p>
                      <p className="text-sm">Todas as comissões estão em dia</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allOverdueBarbers.map((barber) => (
                        <button
                          key={`${barber.monthKey}-${barber.name}`}
                          onClick={() => openPaymentModal(barber)}
                          className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-red-100 text-red-700 flex items-center justify-center rounded-full font-semibold">
                              {barber.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium">{barber.name}</p>
                              <p className="text-sm text-gray-500">{barber.services} serviço{barber.services !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-600">R$ {barber.total.toFixed(2)}</p>
                            <Badge variant="outline" className="text-red-600 border-red-300">Atrasada ({barber.monthLabel})</Badge>
                          </div>
                        </button>
                      ))}

                      {unpaidPending.map((barber) => (
                        <button
                          key={barber.name}
                          onClick={() => openPaymentModal(barber)}
                          className="w-full flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-amber-100 text-amber-700 flex items-center justify-center rounded-full font-semibold">
                              {barber.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium">{barber.name}</p>
                              <p className="text-sm text-gray-500">{barber.services} serviço{barber.services !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-amber-600">R$ {barber.total.toFixed(2)}</p>
                            <Badge variant="outline" className="text-amber-600 border-amber-300">Pendente</Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })()}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Recibos Pagos
                  </CardTitle>
                  <CardDescription>Histórico de pagamentos de comissões realizados</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {commissionReceipts.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum recibo registrado</h3>
                  <p className="text-muted-foreground">Os recibos aparecerão aqui após registrar os pagamentos de comissões.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {commissionReceipts.map((receipt) => {
                    const [year, month] = receipt.referenceMonth.split('-').map(Number)
                    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
                    const monthLabel = `${monthNames[month - 1]} ${year}`

                    return (
                      <div
                        key={receipt.id}
                        className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
                        onClick={() => openReceiptModal(receipt)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-green-100 text-green-700 flex items-center justify-center rounded-full font-semibold">
                            {receipt.barberName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium">{receipt.barberName}</p>
                            <p className="text-sm text-gray-500">{receipt.receiptNumber} • {monthLabel}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">R$ {parseFloat(receipt.totalCommissions).toFixed(2)}</p>
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              {formatPaymentMethod(receipt.paymentMethod)}
                            </Badge>
                          </div>
                          <Eye className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Banknote className="h-5 w-5 text-green-600" />
              Registrar Pagamento
            </DialogTitle>
            <DialogDescription>
              {selectedPaymentBarber && (
                <>Comissão de <strong>{selectedPaymentBarber.name}</strong> referente a <strong>{selectedPaymentBarber.monthLabel}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedPaymentBarber && (
            <div className="space-y-4 mt-2">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Barbeiro</span>
                  <span className="font-medium">{selectedPaymentBarber.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Período</span>
                  <span className="font-medium">{selectedPaymentBarber.monthLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Serviços realizados</span>
                  <span className="font-medium">{selectedPaymentBarber.services}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-semibold">Total a pagar</span>
                  <span className="text-lg font-bold text-green-600">R$ {selectedPaymentBarber.total.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Método de Pagamento</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'pix', label: 'PIX', icon: CreditCard },
                    { value: 'cash', label: 'Dinheiro', icon: Banknote },
                    { value: 'transfer', label: 'Transferência', icon: TrendingUp },
                    { value: 'credit_card', label: 'Cartão Crédito', icon: CreditCard },
                    { value: 'debit_card', label: 'Cartão Débito', icon: CreditCard },
                    { value: 'check', label: 'Cheque', icon: FileText },
                  ].map(method => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethodChoice(method.value)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                        paymentMethodChoice === method.value
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <method.icon className="h-4 w-4" />
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={closePaymentModal}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleProcessPayment}
                  disabled={processingPayment || !paymentMethodChoice}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar Pagamento
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-amber-600" />
              Recibo de Comissão
            </DialogTitle>
          </DialogHeader>

          {selectedReceipt && (() => {
            const [year, month] = selectedReceipt.referenceMonth.split('-').map(Number)
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
            const lastDay = new Date(year, month, 0).getDate()
            const periodStart = `01/${String(month).padStart(2, '0')}/${year}`
            const periodEnd = `${lastDay}/${String(month).padStart(2, '0')}/${year}`
            const emissionDate = new Date(selectedReceipt.paidAt).toLocaleDateString('pt-BR')
            const services = selectedReceipt.serviceDetails as ServiceDetail[]

            return (
              <div className="space-y-6 mt-2" id="receipt-content">
                <div className="border rounded-lg p-6 bg-white">
                  <div className="text-center mb-6">
                    <h2 className="text-lg font-bold">{selectedReceipt.barbershopName}</h2>
                    <p className="text-sm text-gray-600">Recibo de Comissão de Serviços</p>
                  </div>

                  <div className="border-t pt-4 space-y-1 text-sm">
                    <p><strong>Recibo Nº:</strong> {selectedReceipt.receiptNumber}</p>
                    <p><strong>Emitido em:</strong> {emissionDate}</p>
                    <p><strong>Método:</strong> {formatPaymentMethod(selectedReceipt.paymentMethod)}</p>
                  </div>

                  <div className="border-t mt-4 pt-4 space-y-1 text-sm">
                    <p><strong>Barbeiro:</strong> {selectedReceipt.barberName}</p>
                    <p><strong>Período:</strong> {periodStart} — {periodEnd}</p>
                  </div>

                  <div className="border-t mt-4 pt-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-semibold">Serviço</th>
                            <th className="text-center py-2 font-semibold">Qtd</th>
                            <th className="text-right py-2 font-semibold">Valor Unit</th>
                            <th className="text-right py-2 font-semibold">Total</th>
                            <th className="text-center py-2 font-semibold">Comissão</th>
                            <th className="text-right py-2 font-semibold">Valor Comissão</th>
                          </tr>
                        </thead>
                        <tbody>
                          {services.map((service, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="py-2">{service.serviceName}</td>
                              <td className="py-2 text-center">{service.qty}</td>
                              <td className="py-2 text-right">R$ {service.unitPrice.toFixed(2)}</td>
                              <td className="py-2 text-right">R$ {service.total.toFixed(2)}</td>
                              <td className="py-2 text-center">{service.commissionRate}%</td>
                              <td className="py-2 text-right">R$ {service.commissionValue.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border-t mt-4 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total faturado em serviços:</span>
                      <span className="font-semibold">R$ {parseFloat(selectedReceipt.totalServices).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="font-bold">TOTAL DE COMISSÕES:</span>
                      <span className="font-bold">R$ {parseFloat(selectedReceipt.totalCommissions).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t mt-6 pt-4 text-sm text-gray-600">
                    <p>Declaro que recebi o valor acima referente às comissões dos serviços prestados no período informado.</p>
                  </div>

                  <div className="mt-6 space-y-4 text-sm">
                    {selectedReceipt.barbershopAddress && (
                      <p>{selectedReceipt.barbershopAddress}, {emissionDate}</p>
                    )}
                    <div className="pt-4 space-y-4">
                      <div>
                        <p>Barbeiro ________________________</p>
                      </div>
                      <div>
                        <p>Responsável ________________________</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t mt-6 pt-3 text-xs text-gray-400 text-center">
                    <p>Recibo gerado automaticamente pelo sistema</p>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
