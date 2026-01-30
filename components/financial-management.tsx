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
  const [salesFilters, setSalesFilters] = useState({ service: "all", barber: "all", month: "" })
  const [allSales, setAllSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedPaymentMonth, setSelectedPaymentMonth] = useState("")
  
  const [barberServiceCommissions, setBarberServiceCommissions] = useState<BarberCommissions[]>([])
  const [savingCommission, setSavingCommission] = useState(false)
  const [barberSearchFilter, setBarberSearchFilter] = useState("")
  const [selectedBarberForModal, setSelectedBarberForModal] = useState<BarberCommissions | null>(null)
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false)
  const [editedCommissions, setEditedCommissions] = useState<Record<string, string>>({})

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
  
  // Get unique services for filter
  const uniqueServices = [...new Set(allSales.map(s => s.service_name))].sort()

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
                      {uniqueServices.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
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
          {/* Seção de Comissões dos Barbeiros */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-amber-600" />
                    Comissões dos Barbeiros
                  </CardTitle>
                  <CardDescription>Valores a pagar para cada barbeiro baseado nos serviços realizados</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total de Comissões</p>
                  <p className="text-2xl font-bold text-amber-600">R$ {totalPendingCommissions.toFixed(2)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                // Agrupar vendas por barbeiro para calcular comissões
                const barberCommissionsSummary: Record<string, { name: string; total: number; services: number }> = {}
                
                filteredSales.forEach(sale => {
                  const barberName = sale.barber_name
                  if (!barberCommissionsSummary[barberName]) {
                    barberCommissionsSummary[barberName] = { name: barberName, total: 0, services: 0 }
                  }
                  barberCommissionsSummary[barberName].total += sale.commission_value
                  barberCommissionsSummary[barberName].services += 1
                })
                
                const barbersList = Object.values(barberCommissionsSummary).sort((a, b) => b.total - a.total)
                
                if (barbersList.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Nenhuma comissão registrada no período</p>
                    </div>
                  )
                }
                
                return (
                  <div className="space-y-3">
                    {barbersList.map((barber, index) => (
                      <div key={barber.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-amber-100 text-amber-700 flex items-center justify-center rounded-full font-semibold">
                            {barber.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium">{barber.name}</p>
                            <p className="text-sm text-gray-500">{barber.services} serviço{barber.services !== 1 ? 's' : ''} realizado{barber.services !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">R$ {barber.total.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">a pagar</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comissões</CardTitle>
                <DollarSign className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  R$ {totalPendingCommissions.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Para {uniqueBarbers.length} barbeiro{uniqueBarbers.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outras Contas</CardTitle>
                <Clock className="h-4 w-4 text-gray-500" />
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
