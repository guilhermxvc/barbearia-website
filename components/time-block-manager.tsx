"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Clock, Plus, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TimeBlock {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  allDay: boolean
  blockType: string
  barberId: string | null
  barber: { id: string; name: string } | null
}

interface TimeBlockManagerProps {
  barbershopId: string
  barberId?: string
  isManager?: boolean
}

const BLOCK_TYPES = [
  { value: 'vacation', label: 'Férias' },
  { value: 'personal', label: 'Compromisso Pessoal' },
  { value: 'medical', label: 'Consulta Médica' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'holiday', label: 'Feriado' },
  { value: 'other', label: 'Outro' },
]

export function TimeBlockManager({ barbershopId, barberId, isManager = false }: TimeBlockManagerProps) {
  const [blocks, setBlocks] = useState<TimeBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  const [newBlock, setNewBlock] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '18:00',
    allDay: false,
    blockType: 'personal',
  })

  useEffect(() => {
    loadBlocks()
  }, [barbershopId, barberId])

  const loadBlocks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ barbershopId })
      if (barberId) {
        params.append('barberId', barberId)
      }
      
      const res = await fetch(`/api/time-blocks?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
      }).then(r => r.json())
      
      if (res.success) {
        let filteredBlocks = res.blocks || []
        if (barberId && !isManager) {
          filteredBlocks = filteredBlocks.filter((b: TimeBlock) => b.barberId === barberId)
        }
        setBlocks(filteredBlocks)
      }
    } catch (error) {
      console.error('Error loading time blocks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newBlock.title || !newBlock.startDate || !newBlock.endDate) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    try {
      setSaving(true)
      
      const startDateTime = newBlock.allDay 
        ? `${newBlock.startDate}T00:00:00`
        : `${newBlock.startDate}T${newBlock.startTime}:00`
      
      const endDateTime = newBlock.allDay
        ? `${newBlock.endDate}T23:59:59`
        : `${newBlock.endDate}T${newBlock.endTime}:00`
      
      const payload = {
        barbershopId,
        barberId: isManager ? null : barberId,
        title: newBlock.title,
        description: newBlock.description || null,
        startDate: startDateTime,
        endDate: endDateTime,
        allDay: newBlock.allDay,
        blockType: newBlock.blockType,
      }

      const res = await fetch('/api/time-blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(payload),
      }).then(r => r.json())

      if (res.success) {
        setDialogOpen(false)
        setNewBlock({
          title: '',
          description: '',
          startDate: '',
          startTime: '09:00',
          endDate: '',
          endTime: '18:00',
          allDay: false,
          blockType: 'personal',
        })
        loadBlocks()
      } else {
        alert(res.error || 'Erro ao criar bloqueio')
      }
    } catch (error) {
      console.error('Error creating block:', error)
      alert('Erro ao criar bloqueio')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (blockId: string) => {
    if (!confirm('Deseja realmente remover este bloqueio?')) return

    try {
      const res = await fetch(`/api/time-blocks?id=${blockId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
      }).then(r => r.json())

      if (res.success) {
        loadBlocks()
      } else {
        alert(res.error || 'Erro ao remover bloqueio')
      }
    } catch (error) {
      console.error('Error deleting block:', error)
      alert('Erro ao remover bloqueio')
    }
  }

  const getBlockTypeLabel = (type: string) => {
    return BLOCK_TYPES.find(t => t.value === type)?.label || type
  }

  const getBlockTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      vacation: 'bg-blue-100 text-blue-800',
      personal: 'bg-purple-100 text-purple-800',
      medical: 'bg-green-100 text-green-800',
      maintenance: 'bg-orange-100 text-orange-800',
      holiday: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[type] || colors.other
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Bloqueios de Horário
            </CardTitle>
            <CardDescription>
              {isManager 
                ? 'Bloqueie horários para todos os barbeiros da barbearia'
                : 'Bloqueie horários da sua agenda para compromissos pessoais'}
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Bloqueio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Bloqueio de Horário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    placeholder="Ex: Consulta médica, Férias..."
                    value={newBlock.title}
                    onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Bloqueio</Label>
                  <Select
                    value={newBlock.blockType}
                    onValueChange={(value) => setNewBlock({ ...newBlock, blockType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOCK_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newBlock.allDay}
                    onCheckedChange={(checked) => setNewBlock({ ...newBlock, allDay: checked })}
                  />
                  <Label>Dia inteiro</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Início *</Label>
                    <Input
                      type="date"
                      value={newBlock.startDate}
                      onChange={(e) => setNewBlock({ ...newBlock, startDate: e.target.value })}
                    />
                  </div>
                  {!newBlock.allDay && (
                    <div className="space-y-2">
                      <Label>Hora Início</Label>
                      <Input
                        type="time"
                        value={newBlock.startTime}
                        onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Fim *</Label>
                    <Input
                      type="date"
                      value={newBlock.endDate}
                      onChange={(e) => setNewBlock({ ...newBlock, endDate: e.target.value })}
                    />
                  </div>
                  {!newBlock.allDay && (
                    <div className="space-y-2">
                      <Label>Hora Fim</Label>
                      <Input
                        type="time"
                        value={newBlock.endTime}
                        onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    placeholder="Detalhes adicionais..."
                    value={newBlock.description}
                    onChange={(e) => setNewBlock({ ...newBlock, description: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={handleCreate}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Criar Bloqueio
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {blocks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum bloqueio de horário cadastrado</p>
            <p className="text-sm">Clique em "Novo Bloqueio" para adicionar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{block.title}</span>
                    <Badge className={getBlockTypeColor(block.blockType)}>
                      {getBlockTypeLabel(block.blockType)}
                    </Badge>
                    {isManager && !block.barberId && (
                      <Badge variant="outline" className="text-amber-700 border-amber-300">
                        Todos Barbeiros
                      </Badge>
                    )}
                    {block.barber && (
                      <Badge variant="outline">
                        {block.barber.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(block.startDate), "dd/MM/yyyy", { locale: ptBR })}
                      {block.startDate !== block.endDate && (
                        <> até {format(new Date(block.endDate), "dd/MM/yyyy", { locale: ptBR })}</>
                      )}
                    </span>
                    {!block.allDay && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(block.startDate), "HH:mm")} - {format(new Date(block.endDate), "HH:mm")}
                      </span>
                    )}
                    {block.allDay && (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Dia inteiro</span>
                    )}
                  </div>
                  {block.description && (
                    <p className="text-sm text-gray-500 mt-1">{block.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(block.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
