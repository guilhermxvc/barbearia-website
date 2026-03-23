"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Loader2, ShoppingCart, Plus, X, CheckCircle, Clock,
  ChevronDown, ChevronUp, PackagePlus, Scissors, Package,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ComandaItem {
  id: string
  comandaId: string
  type: string
  itemId: string | null
  name: string
  price: string
  qty: number
  subtotal: string
  createdAt: string
}

interface Comanda {
  id: string
  code: string
  clientName: string
  barberName: string
  status: string
  referenceMonth: string
  paymentMethod: string | null
  totalAmount: string
  notes: string | null
  closedAt: string | null
  createdAt: string
  items: ComandaItem[]
}

interface ServiceOption { id: string; name: string; price: string }
interface ProductOption { id: string; name: string; price: string }
interface BarberOption { id: string; name: string }

interface ComandasTabProps {
  barbershopId: string
  services: ServiceOption[]
  products: ProductOption[]
  barbers: BarberOption[]
}

function formatCurrency(value: number | string) {
  return `R$ ${parseFloat(String(value || 0)).toFixed(2).replace('.', ',')}`
}

export function ComandasTab({ barbershopId, services, products, barbers }: ComandasTabProps) {
  const [comandas, setComandas] = useState<Comanda[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [filterStatus, setFilterStatus] = useState("all")
  const [filterBarber, setFilterBarber] = useState("all")
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null)
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isCloseOpen, setIsCloseOpen] = useState(false)

  const [addItemType, setAddItemType] = useState<"service" | "product">("service")
  const [addItemId, setAddItemId] = useState("")
  const [addItemName, setAddItemName] = useState("")
  const [addItemPrice, setAddItemPrice] = useState("")
  const [addItemQty, setAddItemQty] = useState("1")
  const [addingItem, setAddingItem] = useState(false)

  const [closingComanda, setClosingComanda] = useState(false)

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
  const headers: HeadersInit = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

  const fetchComandas = useCallback(async () => {
    if (!barbershopId) return
    setLoading(true)
    try {
      let url = `/api/comandas?barbershopId=${barbershopId}`
      if (filterStatus !== "all") url += `&status=${filterStatus}`
      if (filterMonth) url += `&month=${filterMonth}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.comandas) setComandas(data.comandas)
    } catch {
      toast.error("Erro ao carregar comandas")
    } finally {
      setLoading(false)
    }
  }, [barbershopId, filterStatus, filterMonth, token])

  useEffect(() => { fetchComandas() }, [fetchComandas])

  const filtered = comandas.filter(c => {
    if (filterBarber !== "all" && c.barberName !== filterBarber) return false
    return true
  })

  const openComandas = filtered.filter(c => c.status === "open")
  const closedComandas = filtered.filter(c => c.status === "closed")

  function openAddItem(comanda: Comanda) {
    setSelectedComanda(comanda)
    setAddItemType("service")
    setAddItemId("")
    setAddItemName("")
    setAddItemPrice("")
    setAddItemQty("1")
    setIsAddItemOpen(true)
  }

  function openClose(comanda: Comanda) {
    setSelectedComanda(comanda)
    setIsCloseOpen(true)
  }

  function handleSelectServiceProduct(id: string) {
    setAddItemId(id)
    if (addItemType === "service") {
      const s = services.find(x => x.id === id)
      if (s) { setAddItemName(s.name); setAddItemPrice(s.price) }
    } else {
      const p = products.find(x => x.id === id)
      if (p) { setAddItemName(p.name); setAddItemPrice(p.price) }
    }
  }

  async function handleAddItem() {
    if (!selectedComanda || !addItemName || !addItemPrice || !addItemQty) {
      toast.error("Preencha todos os campos")
      return
    }
    setAddingItem(true)
    try {
      const res = await fetch(`/api/comandas/${selectedComanda.id}/items`, {
        method: "POST",
        headers,
        body: JSON.stringify({ type: addItemType, itemId: addItemId || null, name: addItemName, price: addItemPrice, qty: parseInt(addItemQty) }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Erro ao adicionar item"); return }
      toast.success("Item adicionado!")
      setIsAddItemOpen(false)
      fetchComandas()
    } catch {
      toast.error("Erro ao adicionar item")
    } finally {
      setAddingItem(false)
    }
  }

  async function handleRemoveItem(comanda: Comanda, itemId: string) {
    try {
      const res = await fetch(`/api/comandas/${comanda.id}/items?itemId=${itemId}`, { method: "DELETE", headers })
      if (!res.ok) { toast.error("Erro ao remover item"); return }
      toast.success("Item removido")
      fetchComandas()
    } catch {
      toast.error("Erro ao remover item")
    }
  }

  async function handleCloseComanda() {
    if (!selectedComanda) return
    setClosingComanda(true)
    try {
      const res = await fetch(`/api/comandas/${selectedComanda.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ action: "close" }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Erro ao fechar comanda"); return }
      toast.success(`Comanda ${selectedComanda.code} fechada com sucesso.`)
      setIsCloseOpen(false)
      fetchComandas()
    } catch {
      toast.error("Erro ao fechar comanda")
    } finally {
      setClosingComanda(false)
    }
  }

  const monthLabel = (() => {
    const [y, m] = filterMonth.split("-").map(Number)
    return format(new Date(y, m - 1, 1), "MMMM 'de' yyyy", { locale: ptBR })
  })()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Comandas</CardTitle>
              <CardDescription>Ordens de serviço abertas quando o barbeiro conclui o atendimento. Adicione itens extras e feche manualmente.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300 bg-amber-50">
                <Clock className="h-3 w-3" />
                {openComandas.length} abertas
              </Badge>
              <Badge variant="outline" className="gap-1 text-green-700 border-green-300 bg-green-50">
                <CheckCircle className="h-3 w-3" />
                {closedComandas.length} fechadas
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div>
              <Label>Mês</Label>
              <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="open">Abertas</SelectItem>
                  <SelectItem value="closed">Fechadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Barbeiro</Label>
              <Select value={filterBarber} onValueChange={setFilterBarber}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {barbers.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">Nenhuma comanda em {monthLabel}</p>
              <p className="text-xs text-gray-400 mt-1">As comandas são criadas automaticamente quando o barbeiro registra o atendimento como concluído.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(comanda => {
                const isExpanded = expandedId === comanda.id
                const total = parseFloat(comanda.totalAmount || "0")
                const isOpen = comanda.status === "open"

                return (
                  <div key={comanda.id} className={`border rounded-lg overflow-hidden transition-all ${isOpen ? "border-amber-200" : "border-gray-200"}`}>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : comanda.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${isOpen ? "bg-amber-50/40" : "bg-white"}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isOpen ? "bg-amber-100" : "bg-green-100"}`}>
                          {isOpen
                            ? <Clock className="h-4 w-4 text-amber-600" />
                            : <CheckCircle className="h-4 w-4 text-green-600" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{comanda.code}</span>
                            <Badge variant={isOpen ? "default" : "secondary"} className={`text-xs ${isOpen ? "bg-amber-500 hover:bg-amber-500" : ""}`}>
                              {isOpen ? "Aberta" : "Fechada"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {comanda.clientName} · {comanda.barberName} · {format(parseISO(comanda.createdAt), "dd/MM/yyyy HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(total)}</p>
                          <p className="text-xs text-gray-400">{comanda.items.length} {comanda.items.length === 1 ? "item" : "itens"}</p>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t px-4 py-4 bg-white space-y-4">
                        {comanda.items.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-2">Nenhum item nesta comanda.</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b text-xs text-gray-500">
                                <th className="text-left pb-2">Item</th>
                                <th className="text-center pb-2">Tipo</th>
                                <th className="text-center pb-2">Qtd</th>
                                <th className="text-right pb-2">Preço</th>
                                <th className="text-right pb-2">Subtotal</th>
                                {isOpen && <th className="pb-2"></th>}
                              </tr>
                            </thead>
                            <tbody>
                              {comanda.items.map(item => (
                                <tr key={item.id} className="border-b last:border-0">
                                  <td className="py-2 font-medium">{item.name}</td>
                                  <td className="py-2 text-center">
                                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${item.type === "service" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                                      {item.type === "service" ? <Scissors className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                                      {item.type === "service" ? "Serviço" : "Produto"}
                                    </span>
                                  </td>
                                  <td className="py-2 text-center">{item.qty}</td>
                                  <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                                  <td className="py-2 text-right font-semibold">{formatCurrency(item.subtotal)}</td>
                                  {isOpen && (
                                    <td className="py-2 pl-2">
                                      <button
                                        onClick={() => handleRemoveItem(comanda, item.id)}
                                        className="text-red-400 hover:text-red-600 transition-colors"
                                        title="Remover item"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan={isOpen ? 4 : 3} className="pt-2 text-sm font-semibold text-right">Total:</td>
                                <td className="pt-2 text-right font-bold text-amber-600">{formatCurrency(total)}</td>
                                {isOpen && <td></td>}
                              </tr>
                            </tfoot>
                          </table>
                        )}

                        {!isOpen && comanda.closedAt && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 border-t pt-3">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Fechada em {format(parseISO(comanda.closedAt), "dd/MM/yyyy 'às' HH:mm")}
                          </div>
                        )}

                        {isOpen && (
                          <div className="flex flex-col sm:flex-row gap-2 border-t pt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                              onClick={() => openAddItem(comanda)}
                            >
                              <PackagePlus className="h-4 w-4" />
                              Adicionar Item
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                              onClick={() => openClose(comanda)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Fechar Comanda
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddItemOpen} onOpenChange={open => { if (!open) setIsAddItemOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="h-5 w-5 text-amber-600" />
              Adicionar Item — {selectedComanda?.code}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Tipo</Label>
              <Select value={addItemType} onValueChange={(v: "service" | "product") => { setAddItemType(v); setAddItemId(""); setAddItemName(""); setAddItemPrice("") }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="service"><span className="flex items-center gap-2"><Scissors className="h-4 w-4" /> Serviço</span></SelectItem>
                  <SelectItem value="product"><span className="flex items-center gap-2"><Package className="h-4 w-4" /> Produto</span></SelectItem>
                </SelectContent>
              </Select>
            </div>

            {addItemType === "service" ? (
              <div>
                <Label>Serviço</Label>
                <Select value={addItemId} onValueChange={handleSelectServiceProduct}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o serviço" /></SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} — R$ {parseFloat(s.price).toFixed(2)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label>Produto</Label>
                <Select value={addItemId} onValueChange={handleSelectServiceProduct}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} — R$ {parseFloat(p.price).toFixed(2)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!addItemId && (
              <div>
                <Label>Ou descreva o item manualmente</Label>
                <Input className="mt-1" placeholder="Nome do item" value={addItemName} onChange={e => setAddItemName(e.target.value)} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preço (R$)</Label>
                <Input className="mt-1" type="number" step="0.01" min="0" placeholder="0,00" value={addItemPrice} onChange={e => setAddItemPrice(e.target.value)} />
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input className="mt-1" type="number" min="1" value={addItemQty} onChange={e => setAddItemQty(e.target.value)} />
              </div>
            </div>

            {addItemPrice && addItemQty && (
              <div className="flex justify-between text-sm font-medium bg-gray-50 rounded-lg px-3 py-2">
                <span>Subtotal:</span>
                <span className="text-amber-600">{formatCurrency(parseFloat(addItemPrice || "0") * parseInt(addItemQty || "1"))}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddItem} disabled={addingItem} className="bg-amber-600 hover:bg-amber-700">
              {addingItem ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCloseOpen} onOpenChange={open => { if (!open) setIsCloseOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Fechar Comanda — {selectedComanda?.code}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedComanda && (
              <>
                <div className="rounded-lg bg-gray-50 p-4 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cliente</span>
                    <strong>{selectedComanda.clientName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Barbeiro</span>
                    <strong>{selectedComanda.barberName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mês de referência</span>
                    <strong>{selectedComanda.referenceMonth}</strong>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-gray-500">Itens na comanda</span>
                    <strong>{selectedComanda.items.length} {selectedComanda.items.length === 1 ? "item" : "itens"}</strong>
                  </div>
                </div>

                {selectedComanda.items.length > 0 && (
                  <div className="rounded-lg border divide-y text-sm">
                    {selectedComanda.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2">
                          {item.type === "service" ? <Scissors className="h-3.5 w-3.5 text-blue-500" /> : <Package className="h-3.5 w-3.5 text-purple-500" />}
                          <span>{item.name}</span>
                          {item.qty > 1 && <span className="text-gray-400">×{item.qty}</span>}
                        </div>
                        <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-3 py-2 bg-amber-50 font-semibold">
                      <span>Total</span>
                      <span className="text-amber-700">{formatCurrency(selectedComanda.totalAmount)}</span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 text-center">
                  O pagamento será registrado via comissões. Ao fechar, a comanda ficará concluída.
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseOpen(false)}>Cancelar</Button>
            <Button onClick={handleCloseComanda} disabled={closingComanda} className="bg-green-600 hover:bg-green-700">
              {closingComanda ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Fechar Comanda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
