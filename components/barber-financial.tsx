"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText, Receipt, Loader2, AlertCircle, CheckCircle,
  Clock, User, Calendar, DollarSign, Package, Eye, Scissors, Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ComandaItem {
  id: string
  type: string
  name: string
  price: string
  qty: number
  subtotal: string
}

interface Comanda {
  id: string
  code: string
  clientName: string
  barberName: string
  status: string
  totalAmount: string
  referenceMonth: string
  createdAt: string
  items: ComandaItem[]
}

interface ServiceDetail {
  serviceName: string
  qty: number
  unitPrice: number
  total: number
  commissionRate: number
  commissionValue: number
}

interface CommissionReceipt {
  id: string
  receiptNumber: string
  referenceMonth: string
  paymentMethod: string
  totalServices: string
  totalCommissions: string
  serviceDetails: ServiceDetail[]
  barberName: string
  barbershopName: string
  barbershopAddress?: string
  paidAt: string
}

const formatCurrency = (value: string | number) => {
  const num = typeof value === "string" ? parseFloat(value) : value
  return isNaN(num) ? "R$ 0,00" : num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const formatMonth = (month: string) => {
  const [year, m] = month.split("-")
  const date = new Date(parseInt(year), parseInt(m) - 1, 1)
  return format(date, "MMMM 'de' yyyy", { locale: ptBR })
}

const formatPaymentMethod = (method: string) => {
  switch (method) {
    case "pix": return "PIX"
    case "cash": return "Dinheiro"
    case "transfer": return "Transferência"
    case "credit_card": return "Cartão de Crédito"
    case "debit_card": return "Cartão de Débito"
    case "check": return "Cheque"
    default: return method
  }
}

const safeDate = (d: string) => {
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? null : dt
}

export function BarberFinancial() {
  const { user } = useAuth()

  const [comandas, setComandas] = useState<Comanda[]>([])
  const [receipts, setReceipts] = useState<CommissionReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [viewingComanda, setViewingComanda] = useState<Comanda | null>(null)
  const [viewingReceipt, setViewingReceipt] = useState<CommissionReceipt | null>(null)

  // Filtro de mês para recibos
  const [receiptMonthFilter, setReceiptMonthFilter] = useState<string>("all")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("authToken")
      const headers = { Authorization: `Bearer ${token}` }

      const [comandasRes, receiptsRes] = await Promise.all([
        fetch("/api/comandas", { headers }),
        fetch("/api/barber/receipts", { headers }),
      ])

      const [comandasData, receiptsData] = await Promise.all([
        comandasRes.json(),
        receiptsRes.json(),
      ])

      if (comandasData.success) setComandas(comandasData.comandas || [])
      if (receiptsData.success) setReceipts(receiptsData.receipts || [])
    } catch {
      setError("Erro ao carregar dados financeiros")
    } finally {
      setLoading(false)
    }
  }

  // Meses únicos dos recibos para o filtro
  const receiptMonths = useMemo(() => {
    const months = Array.from(new Set(receipts.map(r => r.referenceMonth))).sort((a, b) => b.localeCompare(a))
    return months
  }, [receipts])

  // Recibos filtrados
  const filteredReceipts = useMemo(() => {
    if (receiptMonthFilter === "all") return receipts
    return receipts.filter(r => r.referenceMonth === receiptMonthFilter)
  }, [receipts, receiptMonthFilter])

  const openComandas = comandas.filter(c => c.status === "open")
  const closedComandas = comandas.filter(c => c.status === "closed")

  const totalOpenValue = openComandas.reduce((s, c) => s + parseFloat(c.totalAmount || "0"), 0)
  const totalReceived = filteredReceipts.reduce((s, r) => s + parseFloat(r.totalCommissions || "0"), 0)
  const allTimeReceived = receipts.reduce((s, r) => s + parseFloat(r.totalCommissions || "0"), 0)

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comandas Abertas</CardTitle>
            <FileText className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{openComandas.length}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(totalOpenValue)} em aberto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comandas Fechadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{closedComandas.length}</div>
            <p className="text-xs text-muted-foreground">este período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibos de Comissão</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{receipts.length}</div>
            <p className="text-xs text-muted-foreground">pagamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(allTimeReceived)}</div>
            <p className="text-xs text-muted-foreground">em comissões</p>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <Tabs defaultValue="comandas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comandas">
            Minhas Comandas
            {openComandas.length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                {openComandas.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="receipts">Recibos de Comissão</TabsTrigger>
        </TabsList>

        {/* ─── COMANDAS ─── */}
        <TabsContent value="comandas" className="mt-4 space-y-4">
          {/* Abertas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-amber-600" />
                Comandas Abertas
              </CardTitle>
              <CardDescription>Atendimentos realizados ainda não comissionados</CardDescription>
            </CardHeader>
            <CardContent>
              {openComandas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle className="h-10 w-10 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-500">Nenhuma comanda aberta no momento.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {openComandas.map(c => (
                    <ComandaRow key={c.id} comanda={c} onView={() => setViewingComanda(c)} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fechadas */}
          {closedComandas.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Comandas Fechadas
                </CardTitle>
                <CardDescription>Comandas já comissionadas e pagas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {closedComandas.map(c => (
                    <ComandaRow key={c.id} comanda={c} onView={() => setViewingComanda(c)} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── RECIBOS ─── */}
        <TabsContent value="receipts" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Receipt className="h-5 w-5 text-blue-600" />
                    Recibos de Comissão
                  </CardTitle>
                  <CardDescription>Pagamentos de comissão processados pela barbearia</CardDescription>
                </div>
                {/* Filtro de mês */}
                {receiptMonths.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <Select value={receiptMonthFilter} onValueChange={setReceiptMonthFilter}>
                      <SelectTrigger className="w-48 h-9 text-sm">
                        <SelectValue placeholder="Filtrar por mês" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os meses</SelectItem>
                        {receiptMonths.map(m => (
                          <SelectItem key={m} value={m} className="capitalize">
                            {formatMonth(m)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredReceipts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Receipt className="h-10 w-10 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-500">
                    {receiptMonthFilter === "all"
                      ? "Nenhum recibo de comissão encontrado."
                      : "Nenhum recibo encontrado para este mês."}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredReceipts.map(r => (
                    <ReceiptRow key={r.id} receipt={r} onView={() => setViewingReceipt(r)} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── MODAL: Detalhes da Comanda ─── */}
      <Dialog open={!!viewingComanda} onOpenChange={() => setViewingComanda(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" />
              Detalhes da Comanda
            </DialogTitle>
            <DialogDescription>Serviços e produtos desta comanda</DialogDescription>
          </DialogHeader>
          {viewingComanda && <ComandaDetails comanda={viewingComanda} />}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: Recibo formal ─── */}
      <Dialog open={!!viewingReceipt} onOpenChange={() => setViewingReceipt(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-amber-600" />
              Recibo de Comissão
            </DialogTitle>
          </DialogHeader>
          {viewingReceipt && <FormalReceipt receipt={viewingReceipt} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Linha de comanda ─────────────────────────────────────────
function ComandaRow({ comanda, onView }: { comanda: Comanda; onView: () => void }) {
  const dt = safeDate(comanda.createdAt)
  return (
    <div className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${comanda.status === "open" ? "bg-amber-100" : "bg-green-100"}`}>
          <FileText className={`h-5 w-5 ${comanda.status === "open" ? "text-amber-600" : "text-green-600"}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900">{comanda.code}</span>
            <Badge
              variant="outline"
              className={`text-xs ${comanda.status === "open" ? "border-amber-300 text-amber-700 bg-amber-50" : "border-green-300 text-green-700 bg-green-50"}`}
            >
              {comanda.status === "open" ? "Aberta" : "Fechada"}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <User className="h-3 w-3" />
            {comanda.clientName}
          </p>
          <p className="text-sm text-gray-400">
            {dt ? format(dt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-2">
        <span className="font-semibold text-gray-900">{formatCurrency(comanda.totalAmount)}</span>
        <Button variant="ghost" size="sm" onClick={onView} title="Ver detalhes">
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Detalhes da comanda (modal) ──────────────────────────────
function ComandaDetails({ comanda }: { comanda: Comanda }) {
  const dt = safeDate(comanda.createdAt)
  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <FileText className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <p className="font-bold text-gray-900">{comanda.code}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={comanda.status === "open" ? "bg-amber-500" : "bg-green-500"}>
              {comanda.status === "open" ? "Aberta" : "Fechada"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <User className="h-4 w-4 text-gray-400" />
          <span>Cliente: <strong>{comanda.clientName}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{dt ? format(dt, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : "—"}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Itens</h4>
        {comanda.items.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Nenhum item registrado.</p>
        ) : (
          <div className="space-y-1.5">
            {comanda.items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border text-sm">
                <div className="flex items-center gap-2">
                  {item.type === "service"
                    ? <Scissors className="h-3.5 w-3.5 text-amber-500" />
                    : <Package className="h-3.5 w-3.5 text-blue-500" />
                  }
                  <span className="text-gray-700">{item.name}</span>
                  {item.qty > 1 && <span className="text-gray-400 text-xs">×{item.qty}</span>}
                </div>
                <span className="font-medium text-gray-900">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
        <span className="text-white font-medium text-sm">Total</span>
        <span className="text-amber-400 font-bold">{formatCurrency(comanda.totalAmount)}</span>
      </div>
    </div>
  )
}

// ─── Linha de recibo ──────────────────────────────────────────
function ReceiptRow({ receipt, onView }: { receipt: CommissionReceipt; onView: () => void }) {
  const dt = safeDate(receipt.paidAt)
  return (
    <div className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
          <Receipt className="h-5 w-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900">{receipt.receiptNumber}</span>
            <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50 capitalize">
              {formatPaymentMethod(receipt.paymentMethod)}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 capitalize">{formatMonth(receipt.referenceMonth)}</p>
          <p className="text-sm text-gray-400">
            {dt ? format(dt, "dd/MM/yyyy", { locale: ptBR }) : "—"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-2">
        <span className="font-semibold text-green-700">{formatCurrency(receipt.totalCommissions)}</span>
        <Button variant="ghost" size="sm" onClick={onView} title="Ver recibo">
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Recibo formal (igual ao da barbearia) ────────────────────
function FormalReceipt({ receipt }: { receipt: CommissionReceipt }) {
  const [year, month] = receipt.referenceMonth.split("-").map(Number)
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
  const lastDay = new Date(year, month, 0).getDate()
  const periodStart = `01/${String(month).padStart(2, "0")}/${year}`
  const periodEnd = `${lastDay}/${String(month).padStart(2, "0")}/${year}`
  const emissionDate = safeDate(receipt.paidAt)?.toLocaleDateString("pt-BR") ?? "—"
  const services: ServiceDetail[] = Array.isArray(receipt.serviceDetails) ? receipt.serviceDetails : []

  return (
    <div className="space-y-6 mt-2">
      <div className="border rounded-lg p-6 bg-white">
        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold">{receipt.barbershopName}</h2>
          <p className="text-sm text-gray-600">Recibo de Comissão de Serviços</p>
        </div>

        {/* Dados do recibo */}
        <div className="border-t pt-4 space-y-1 text-sm">
          <p><strong>Recibo Nº:</strong> {receipt.receiptNumber}</p>
          <p><strong>Emitido em:</strong> {emissionDate}</p>
          <p><strong>Método:</strong> {formatPaymentMethod(receipt.paymentMethod)}</p>
        </div>

        {/* Barbeiro e período */}
        <div className="border-t mt-4 pt-4 space-y-1 text-sm">
          <p><strong>Barbeiro:</strong> {receipt.barberName}</p>
          <p><strong>Período:</strong> {periodStart} — {periodEnd}</p>
        </div>

        {/* Tabela de serviços */}
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
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-400 italic">Sem detalhes de serviços</td>
                  </tr>
                ) : (
                  services.map((s, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2">{s.serviceName}</td>
                      <td className="py-2 text-center">{s.qty}</td>
                      <td className="py-2 text-right">R$ {(s.unitPrice ?? 0).toFixed(2)}</td>
                      <td className="py-2 text-right">R$ {(s.total ?? 0).toFixed(2)}</td>
                      <td className="py-2 text-center">{s.commissionRate}%</td>
                      <td className="py-2 text-right">R$ {(s.commissionValue ?? 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totais */}
        <div className="border-t mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total faturado em serviços:</span>
            <span className="font-semibold">R$ {parseFloat(receipt.totalServices).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="font-bold">TOTAL DE COMISSÕES:</span>
            <span className="font-bold">R$ {parseFloat(receipt.totalCommissions).toFixed(2)}</span>
          </div>
        </div>

        {/* Declaração */}
        <div className="border-t mt-6 pt-4 text-sm text-gray-600">
          <p>Declaro que recebi o valor acima referente às comissões dos serviços prestados no período informado.</p>
        </div>

        {/* Assinaturas */}
        <div className="mt-6 space-y-4 text-sm">
          {receipt.barbershopAddress && (
            <p>{receipt.barbershopAddress}, {emissionDate}</p>
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

        {/* Rodapé */}
        <div className="border-t mt-6 pt-3 text-xs text-gray-400 text-center">
          <p>Recibo gerado automaticamente pelo sistema</p>
        </div>
      </div>
    </div>
  )
}
