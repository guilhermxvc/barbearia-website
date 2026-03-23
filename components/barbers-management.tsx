"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Edit, Trash2, User, Users, UserCheck, Eye,
  Scissors, Phone, Mail, Calendar, Percent,
  CheckCircle, XCircle, Clock, Loader2, AlertCircle,
} from "lucide-react"
import { barbersApi, Barber, BarberRequest } from "@/lib/api/barbers"
import { useAuth } from "@/contexts/AuthContext"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface BarbersManagementProps {
  userPlan: string
  barberLimit: number
}

export function BarbersManagement({ userPlan, barberLimit }: BarbersManagementProps) {
  const { user } = useAuth()
  const barbershopId = user?.barbershop?.id

  const [pendingRequests, setPendingRequests] = useState<BarberRequest[]>([])
  const [currentBarbers, setCurrentBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null)
  const [viewingBarber, setViewingBarber] = useState<Barber | null>(null)
  const [deactivatingBarber, setDeactivatingBarber] = useState<Barber | null>(null)
  const [deactivating, setDeactivating] = useState(false)

  useEffect(() => {
    if (barbershopId) loadData()
  }, [barbershopId])

  const loadData = async () => {
    if (!barbershopId) { setError("ID da barbearia não encontrado"); return }
    setLoading(true)
    setError("")
    try {
      const [barbersRes, requestsRes] = await Promise.all([
        barbersApi.getAll(barbershopId),
        barbersApi.getRequests(barbershopId),
      ])
      if (barbersRes.success && barbersRes.data) setCurrentBarbers(barbersRes.data)
      if (requestsRes.success && requestsRes.data)
        setPendingRequests(requestsRes.data.filter(r => r.status === "pending"))
    } catch {
      setError("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const canAddMoreBarbers = () => {
    if (barberLimit === -1) return true
    return currentBarbers.filter(b => b.isActive).length < barberLimit
  }

  const handleBarberRequest = async (requestId: string, action: "approve" | "reject") => {
    if (action === "approve" && !canAddMoreBarbers()) {
      setError("Limite de barbeiros atingido para o plano atual")
      return
    }
    setLoading(true)
    try {
      const res = await barbersApi.handleRequest(requestId, action)
      if (res.success) await loadData()
      else setError(res.error || "Erro ao processar solicitação")
    } catch {
      setError("Erro ao processar solicitação")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBarber = async (barberId: string, updates: Partial<Barber>) => {
    setLoading(true)
    try {
      const res = await barbersApi.update(barberId, updates)
      if (res.success) { await loadData(); setEditingBarber(null) }
      else setError(res.error || "Erro ao atualizar barbeiro")
    } catch {
      setError("Erro ao atualizar barbeiro")
    } finally {
      setLoading(false)
    }
  }

  const confirmDeactivate = async () => {
    if (!deactivatingBarber) return
    setDeactivating(true)
    try {
      const res = await barbersApi.deactivate(deactivatingBarber.id)
      if (res.success) { await loadData(); setDeactivatingBarber(null) }
      else setError(res.error || "Erro ao desativar barbeiro")
    } catch {
      setError("Erro ao desativar barbeiro")
    } finally {
      setDeactivating(false)
    }
  }

  const activeBarbers = currentBarbers.filter(b => b.isActive)
  const inactiveBarbers = currentBarbers.filter(b => !b.isActive)

  if (loading && currentBarbers.length === 0) {
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

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            Barbeiros Ativos ({activeBarbers.length}/{barberLimit === -1 ? "∞" : barberLimit})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Solicitações
            {pendingRequests.length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── ABA: BARBEIROS ─── */}
        <TabsContent value="active" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-amber-600" />
                    Equipe de Barbeiros
                  </CardTitle>
                  <CardDescription>Gerencie os barbeiros da sua barbearia</CardDescription>
                </div>
                {inactiveBarbers.length > 0 && (
                  <Badge variant="outline" className="text-gray-500">
                    {inactiveBarbers.length} inativo{inactiveBarbers.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {currentBarbers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Nenhum barbeiro cadastrado</h3>
                  <p className="text-sm text-gray-500">Aguarde solicitações de barbeiros para aprovar.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {currentBarbers.map(barber => (
                    <BarberRow
                      key={barber.id}
                      barber={barber}
                      onView={() => setViewingBarber(barber)}
                      onEdit={() => setEditingBarber(barber)}
                      onDeactivate={() => setDeactivatingBarber(barber)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── ABA: SOLICITAÇÕES ─── */}
        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-amber-600" />
                Solicitações Pendentes
              </CardTitle>
              <CardDescription>Aprove ou rejeite solicitações de novos barbeiros</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Nenhuma solicitação pendente</h3>
                  <p className="text-sm text-gray-500">Todas as solicitações foram processadas.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {pendingRequests.map(request => (
                    <RequestRow
                      key={request.id}
                      request={request}
                      canApprove={canAddMoreBarbers()}
                      userPlan={userPlan}
                      loading={loading}
                      onApprove={() => handleBarberRequest(request.id, "approve")}
                      onReject={() => handleBarberRequest(request.id, "reject")}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── MODAL: VER DETALHES ─── */}
      <Dialog open={!!viewingBarber} onOpenChange={() => setViewingBarber(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-amber-600" />
              Detalhes do Barbeiro
            </DialogTitle>
            <DialogDescription>Informações completas do profissional</DialogDescription>
          </DialogHeader>
          {viewingBarber && <BarberDetails barber={viewingBarber} />}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: EDITAR ─── */}
      <Dialog open={!!editingBarber} onOpenChange={() => setEditingBarber(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-amber-600" />
              Editar Barbeiro
            </DialogTitle>
            <DialogDescription>Modifique as informações do barbeiro</DialogDescription>
          </DialogHeader>
          {editingBarber && (
            <BarberForm
              barber={editingBarber}
              onClose={() => setEditingBarber(null)}
              onSave={updates => handleUpdateBarber(editingBarber.id, updates)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: CONFIRMAR DESATIVAÇÃO ─── */}
      <Dialog open={!!deactivatingBarber} onOpenChange={() => setDeactivatingBarber(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Desativar Barbeiro
            </DialogTitle>
            <DialogDescription>
              Esta ação removerá o barbeiro da equipe ativa.
            </DialogDescription>
          </DialogHeader>
          {deactivatingBarber && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{deactivatingBarber.name}</p>
                  <p className="text-sm text-gray-500">{deactivatingBarber.email}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Tem certeza que deseja desativar <strong>{deactivatingBarber.name}</strong>? 
                Ele não aparecerá mais para novos agendamentos. Esta ação pode ser revertida na edição.
              </p>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeactivatingBarber(null)}
                  disabled={deactivating}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={confirmDeactivate}
                  disabled={deactivating}
                >
                  {deactivating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Desativando...</>
                  ) : (
                    <><Trash2 className="h-4 w-4 mr-2" />Desativar</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Linha de barbeiro (padrão divide-y do sistema)
// ─────────────────────────────────────────────────────────────
function BarberRow({
  barber, onView, onEdit, onDeactivate,
}: {
  barber: Barber
  onView: () => void
  onEdit: () => void
  onDeactivate: () => void
}) {
  const specialties = Array.isArray(barber.specialties) ? barber.specialties.filter(Boolean) : []

  return (
    <div className={`flex items-center justify-between py-4 px-2 hover:bg-gray-50 rounded-lg transition-colors ${!barber.isActive ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${barber.isActive ? "bg-amber-100" : "bg-gray-100"}`}>
          <User className={`h-5 w-5 ${barber.isActive ? "text-amber-600" : "text-gray-400"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-gray-900">{barber.name}</h4>
            <Badge
              variant={barber.isActive ? "default" : "secondary"}
              className={`text-xs ${barber.isActive ? "bg-green-500 hover:bg-green-500" : ""}`}
            >
              {barber.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 truncate">{barber.email}</p>
          {specialties.length > 0 && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <Scissors className="h-3 w-3 text-amber-500" />
              {specialties.slice(0, 2).join(", ")}
              {specialties.length > 2 && (
                <span className="text-amber-600 font-medium">+{specialties.length - 2}</span>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-2">
        <Button variant="ghost" size="sm" onClick={onView} title="Ver detalhes">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit} title="Editar">
          <Edit className="h-4 w-4" />
        </Button>
        {barber.isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeactivate}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Desativar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Modal de detalhes do barbeiro
// ─────────────────────────────────────────────────────────────
function BarberDetails({ barber }: { barber: Barber }) {
  const specialties = Array.isArray(barber.specialties) ? barber.specialties.filter(Boolean) : []
  const createdDate = barber.createdAt && !isNaN(new Date(barber.createdAt).getTime())
    ? format(new Date(barber.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "Data não informada"

  return (
    <div className="space-y-4 pt-1">
      {/* Perfil */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-7 w-7 text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{barber.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant={barber.isActive ? "default" : "secondary"}
              className={barber.isActive ? "bg-green-500 hover:bg-green-500" : ""}
            >
              {barber.isActive ? "Ativo" : "Inativo"}
            </Badge>
            {barber.isApproved && (
              <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                <CheckCircle className="h-3 w-3 mr-1" />
                Aprovado
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Contato */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contato</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{barber.email}</span>
          </div>
          {barber.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{barber.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span>Membro desde {createdDate}</span>
          </div>
        </div>
      </div>

      {/* Comissão */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Percent className="h-4 w-4 text-amber-500" />
          <span className="font-medium">Taxa de Comissão</span>
        </div>
        <span className="font-bold text-amber-700 text-sm">
          {barber.commissionRate ? `${barber.commissionRate}%` : "Não definida"}
        </span>
      </div>

      {/* Especialidades */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <Scissors className="h-3.5 w-3.5" />
          Especialidades
        </h4>
        {specialties.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Nenhuma especialidade cadastrada.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {specialties.map((s, i) => (
              <Badge key={i} variant="outline" className="border-amber-200 text-amber-800 bg-amber-50">
                {s}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Linha de solicitação pendente
// ─────────────────────────────────────────────────────────────
function RequestRow({
  request, canApprove, userPlan, loading, onApprove, onReject,
}: {
  request: BarberRequest
  canApprove: boolean
  userPlan: string
  loading: boolean
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <div className="py-4 px-2 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-gray-900">{request.name}</h4>
            <p className="text-sm text-gray-500 truncate">{request.email}</p>
            {request.phone && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {request.phone}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-400 shrink-0">
          <Clock className="h-3.5 w-3.5" />
          {format(new Date(request.createdAt), "dd/MM/yyyy", { locale: ptBR })}
        </div>
      </div>

      {request.message && (
        <div className="rounded-lg bg-gray-50 border px-3 py-2 text-sm text-gray-700 italic">
          "{request.message}"
        </div>
      )}

      {request.barber?.specialties && request.barber.specialties.filter(Boolean).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {request.barber.specialties.filter(Boolean).map((s, i) => (
            <Badge key={i} variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
              {s}
            </Badge>
          ))}
        </div>
      )}

      {!canApprove && (
        <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Limite de barbeiros atingido para o plano {userPlan}. Faça upgrade para adicionar mais.
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onApprove}
          disabled={loading || !canApprove}
          className="flex-1 bg-green-600 hover:bg-green-700 gap-1.5"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Aprovar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReject}
          disabled={loading}
          className="flex-1 border-red-200 text-red-700 hover:bg-red-50 gap-1.5"
        >
          <XCircle className="h-3.5 w-3.5" />
          Rejeitar
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Formulário de edição (sem taxa de comissão)
// ─────────────────────────────────────────────────────────────
function BarberForm({
  barber, onClose, onSave,
}: {
  barber: Barber
  onClose: () => void
  onSave: (updates: Partial<Barber>) => void
}) {
  const [specialties, setSpecialties] = useState<string[]>(
    Array.isArray(barber.specialties) ? barber.specialties : []
  )
  const [isActive, setIsActive] = useState(barber.isActive)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ specialties: specialties.filter(Boolean), isActive })
  }

  const addSpecialty = () => setSpecialties(prev => [...prev, ""])
  const updateSpecialty = (i: number, v: string) =>
    setSpecialties(prev => prev.map((s, idx) => (idx === i ? v : s)))
  const removeSpecialty = (i: number) =>
    setSpecialties(prev => prev.filter((_, idx) => idx !== i))

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-1">
      {/* Especialidades */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Scissors className="h-4 w-4 text-amber-500" />
          Especialidades
        </Label>
        <div className="space-y-2">
          {specialties.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={s}
                onChange={e => updateSpecialty(i, e.target.value)}
                placeholder="Ex: Corte Clássico, Barba, Degradê..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeSpecialty(i)}
                className="border-red-200 text-red-600 hover:bg-red-50 px-3"
              >
                ✕
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addSpecialty}
            className="w-full border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 text-sm"
          >
            + Adicionar Especialidade
          </Button>
        </div>
      </div>

      {/* Status ativo */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
        <div>
          <p className="text-sm font-medium text-gray-700">Barbeiro ativo</p>
          <p className="text-sm text-gray-400">Barbeiros inativos não aparecem para agendamentos.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsActive(v => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? "bg-amber-500" : "bg-gray-300"}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
          Salvar Alterações
        </Button>
      </div>
    </form>
  )
}
