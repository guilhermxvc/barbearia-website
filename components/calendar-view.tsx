"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Calendar,
  Plus,
  X,
  Lock,
  Scissors,
  AlertCircle,
  Loader2
} from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { format, addDays, startOfWeek, endOfWeek, isToday, isSameDay, addWeeks, subWeeks, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Appointment {
  id: string
  scheduledAt: string
  duration: number
  status: string
  totalPrice: string
  notes?: string
  client: { id: string; name: string; phone?: string }
  barber: { id: string; name: string }
  service: { id: string; name: string; price: string }
}

interface TimeBlock {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  allDay: boolean
  blockType: string
  barberId?: string
  barber?: { id: string; name: string }
}

interface WorkSchedule {
  barberId: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface CalendarEvent {
  id: string
  type: 'appointment' | 'block'
  title: string
  subtitle?: string
  start: Date
  end: Date
  status?: string
  data: Appointment | TimeBlock
}

interface BusinessHours {
  [key: string]: {
    isOpen: boolean
    openTime: string
    closeTime: string
  }
}

interface CalendarViewProps {
  barbershopId: string
  barberId?: string
  isManager?: boolean
  onAppointmentClick?: (appointment: Appointment) => void
}

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  sunday: { isOpen: false, openTime: "09:00", closeTime: "18:00" },
  monday: { isOpen: true, openTime: "09:00", closeTime: "19:00" },
  tuesday: { isOpen: true, openTime: "09:00", closeTime: "19:00" },
  wednesday: { isOpen: true, openTime: "09:00", closeTime: "19:00" },
  thursday: { isOpen: true, openTime: "09:00", closeTime: "19:00" },
  friday: { isOpen: true, openTime: "09:00", closeTime: "19:00" },
  saturday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
}

function generateTimeSlots(businessHours: BusinessHours): string[] {
  let minOpen = 23
  let maxClose = 0
  
  Object.values(businessHours).forEach(day => {
    if (day.isOpen) {
      const openHour = parseInt(day.openTime.split(':')[0])
      const closeHour = parseInt(day.closeTime.split(':')[0])
      const closeMin = parseInt(day.closeTime.split(':')[1])
      
      if (openHour < minOpen) minOpen = openHour
      if (closeHour > maxClose || (closeHour === maxClose && closeMin > 0)) {
        maxClose = closeMin > 0 ? closeHour + 1 : closeHour
      }
    }
  })
  
  if (minOpen > maxClose) {
    minOpen = 8
    maxClose = 20
  }
  
  const slots: string[] = []
  for (let hour = minOpen; hour < maxClose; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    slots.push(`${hour.toString().padStart(2, '0')}:30`)
  }
  
  return slots
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 border-l-4 border-l-yellow-500 text-yellow-800',
  confirmed: 'bg-blue-100 border-l-4 border-l-blue-500 text-blue-800',
  in_progress: 'bg-amber-100 border-l-4 border-l-amber-500 text-amber-800',
  completed: 'bg-green-100 border-l-4 border-l-green-500 text-green-800',
  cancelled: 'bg-red-100 border-l-4 border-l-red-500 text-red-800',
  no_show: 'bg-gray-100 border-l-4 border-l-gray-500 text-gray-800',
}

const BLOCK_COLORS: Record<string, string> = {
  vacation: 'bg-purple-100 border-l-4 border-l-purple-500 text-purple-800',
  holiday: 'bg-red-100 border-l-4 border-l-red-500 text-red-800',
  maintenance: 'bg-gray-100 border-l-4 border-l-gray-500 text-gray-800',
  personal: 'bg-indigo-100 border-l-4 border-l-indigo-500 text-indigo-800',
  other: 'bg-slate-100 border-l-4 border-l-slate-500 text-slate-800',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não Compareceu',
}

const BLOCK_TYPE_LABELS: Record<string, string> = {
  vacation: 'Férias',
  holiday: 'Feriado',
  maintenance: 'Manutenção',
  personal: 'Pessoal',
  other: 'Outro',
}

export function CalendarView({ barbershopId, barberId, isManager = false, onAppointmentClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null)
  const [barbers, setBarbers] = useState<{ id: string; name: string }[]>([])
  
  const timeSlots = useMemo(() => generateTimeSlots(businessHours), [businessHours])

  const [blockForm, setBlockForm] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '08:00',
    endDate: '',
    endTime: '18:00',
    allDay: false,
    blockType: 'other' as string,
    barberId: '' as string | undefined
  })

  const weekStart = useMemo(() => startOfWeek(currentDate, { locale: ptBR }), [currentDate])
  const weekEnd = useMemo(() => endOfWeek(currentDate, { locale: ptBR }), [currentDate])
  const weekDates = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), 
    [weekStart]
  )

  useEffect(() => {
    loadData()
  }, [currentDate, barbershopId, barberId])

  const loadData = async () => {
    setLoading(true)
    setError("")
    
    try {
      const startDateStr = format(weekStart, 'yyyy-MM-dd')
      const endDateStr = format(weekEnd, 'yyyy-MM-dd')

      const appointmentsPromise = apiClient.get<{ success: boolean; appointments: Appointment[] }>(
        `/appointments?barbershopId=${barbershopId}${barberId ? `&barberId=${barberId}` : ''}`
      )

      const blocksPromise = apiClient.get<{ success: boolean; blocks: TimeBlock[] }>(
        `/time-blocks?barbershopId=${barbershopId}`
      )

      const schedulesPromise = apiClient.get<{ success: boolean; schedules: any[] }>(
        `/work-schedules?barbershopId=${barbershopId}${barberId ? `&barberId=${barberId}` : ''}`
      )

      const hoursPromise = fetch(`/api/barbershop/business-hours?barbershopId=${barbershopId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
      }).then(r => r.json())

      if (isManager) {
        const barbersPromise = apiClient.get<{ success: boolean; barbers: any[] }>(
          `/barbers?barbershopId=${barbershopId}`
        )
        const [aptsRes, blocksRes, schedulesRes, barbersRes, hoursRes] = await Promise.all([
          appointmentsPromise, blocksPromise, schedulesPromise, barbersPromise, hoursPromise
        ])
        
        if (hoursRes.businessHours) {
          setBusinessHours(hoursRes.businessHours)
        }

        if (aptsRes.success && aptsRes.data) {
          const data = aptsRes.data as { success: boolean; appointments: Appointment[] }
          setAppointments(data.appointments || [])
        }

        if (blocksRes.success && blocksRes.data) {
          const data = blocksRes.data as { success: boolean; blocks: TimeBlock[] }
          setTimeBlocks(data.blocks || [])
        }

        if (schedulesRes.success && schedulesRes.data) {
          const data = schedulesRes.data as { success: boolean; schedules: any[] }
          const schedules = Array.isArray(data.schedules) 
            ? data.schedules.map((s: any) => s.schedule || s) 
            : []
          setWorkSchedules(schedules)
        }

        if (barbersRes.success && barbersRes.data) {
          const data = barbersRes.data as { success: boolean; barbers: any[] }
          setBarbers(data.barbers?.map((b: any) => ({ id: b.id, name: b.name })) || [])
        }
      } else {
        const [aptsRes, blocksRes, schedulesRes, hoursRes] = await Promise.all([
          appointmentsPromise, blocksPromise, schedulesPromise, hoursPromise
        ])
        
        if (hoursRes.businessHours) {
          setBusinessHours(hoursRes.businessHours)
        }

        if (aptsRes.success && aptsRes.data) {
          const data = aptsRes.data as { success: boolean; appointments: Appointment[] }
          setAppointments(data.appointments || [])
        }

        if (blocksRes.success && blocksRes.data) {
          const data = blocksRes.data as { success: boolean; blocks: TimeBlock[] }
          setTimeBlocks(data.blocks || [])
        }

        if (schedulesRes.success && schedulesRes.data) {
          const data = schedulesRes.data as { success: boolean; schedules: any[] }
          const schedules = Array.isArray(data.schedules) 
            ? data.schedules.map((s: any) => s.schedule || s) 
            : []
          setWorkSchedules(schedules)
        }
      }
    } catch (err) {
      console.error("Load data error:", err)
      setError("Erro ao carregar dados do calendário")
    } finally {
      setLoading(false)
    }
  }

  const calendarEvents = useMemo((): CalendarEvent[] => {
    const events: CalendarEvent[] = []

    appointments.forEach(apt => {
      const start = new Date(apt.scheduledAt)
      const end = new Date(start.getTime() + apt.duration * 60000)
      
      if (start >= weekStart && start <= weekEnd) {
        events.push({
          id: apt.id,
          type: 'appointment',
          title: apt.client?.name || 'Cliente',
          subtitle: apt.service?.name,
          start,
          end,
          status: apt.status,
          data: apt
        })
      }
    })

    timeBlocks.forEach(block => {
      const start = new Date(block.startDate)
      const end = new Date(block.endDate)
      
      if ((start >= weekStart && start <= weekEnd) || 
          (end >= weekStart && end <= weekEnd) ||
          (start <= weekStart && end >= weekEnd)) {
        events.push({
          id: block.id,
          type: 'block',
          title: block.title,
          subtitle: block.barber?.name || 'Toda barbearia',
          start,
          end,
          data: block
        })
      }
    })

    return events
  }, [appointments, timeBlocks, weekStart, weekEnd])

  const getEventsForSlot = (date: Date, time: string): CalendarEvent[] => {
    const [hours, minutes] = time.split(':').map(Number)
    const slotStart = new Date(date)
    slotStart.setHours(hours, minutes, 0, 0)
    const slotEnd = new Date(slotStart.getTime() + 30 * 60000)

    return calendarEvents.filter(event => {
      return event.start < slotEnd && event.end > slotStart && isSameDay(event.start, date)
    })
  }

  const isSlotBlocked = (date: Date, time: string): boolean => {
    const events = getEventsForSlot(date, time)
    return events.some(e => e.type === 'block')
  }

  const isOutsideWorkSchedule = (date: Date, time: string): boolean => {
    if (workSchedules.length === 0) return false

    const dayOfWeek = date.getDay()
    const [hours, minutes] = time.split(':').map(Number)
    const timeMinutes = hours * 60 + minutes

    const relevantSchedules = workSchedules.filter(s => s.dayOfWeek === dayOfWeek)
    if (relevantSchedules.length === 0) return true

    return !relevantSchedules.some(schedule => {
      const [startH, startM] = schedule.startTime.split(':').map(Number)
      const [endH, endM] = schedule.endTime.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      return timeMinutes >= startMinutes && timeMinutes < endMinutes
    })
  }

  const handlePrev = () => {
    if (viewMode === 'week') {
      setCurrentDate(d => subWeeks(d, 1))
    } else {
      setCurrentDate(d => addDays(d, -1))
    }
  }
  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(d => addWeeks(d, 1))
    } else {
      setCurrentDate(d => addDays(d, 1))
    }
  }
  const handleToday = () => setCurrentDate(new Date())
  
  const displayDates = viewMode === 'week' ? weekDates : [currentDate]

  const handleSlotClick = (date: Date, time: string) => {
    if (isManager && !isSlotBlocked(date, time)) {
      setSelectedSlot({ date, time })
      setBlockForm(prev => ({
        ...prev,
        startDate: format(date, 'yyyy-MM-dd'),
        endDate: format(date, 'yyyy-MM-dd'),
        startTime: time,
        endTime: `${(parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0')}:${time.split(':')[1]}`
      }))
      setShowBlockModal(true)
    }
  }

  const handleCreateBlock = async () => {
    try {
      const startDateTime = new Date(`${blockForm.startDate}T${blockForm.startTime}:00`)
      const endDateTime = new Date(`${blockForm.endDate}T${blockForm.endTime}:00`)

      const response = await apiClient.post('/time-blocks', {
        barbershopId,
        barberId: blockForm.barberId || null,
        title: blockForm.title,
        description: blockForm.description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        allDay: blockForm.allDay,
        blockType: blockForm.blockType
      })

      if (response.success) {
        setShowBlockModal(false)
        setBlockForm({
          title: '',
          description: '',
          startDate: '',
          startTime: '08:00',
          endDate: '',
          endTime: '18:00',
          allDay: false,
          blockType: 'other',
          barberId: undefined
        })
        loadData()
      }
    } catch (err) {
      console.error('Error creating block:', err)
    }
  }

  const handleDeleteBlock = async (blockId: string) => {
    try {
      const response = await apiClient.delete(`/time-blocks?id=${blockId}`)
      if (response.success) {
        setSelectedEvent(null)
        loadData()
      }
    } catch (err) {
      console.error('Error deleting block:', err)
    }
  }

  const handleUpdateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const response = await apiClient.put(`/appointments/${appointmentId}`, { status })
      if (response.success) {
        setSelectedEvent(null)
        loadData()
      }
    } catch (err) {
      console.error('Error updating appointment:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium ml-2">
                {viewMode === 'week' 
                  ? `${format(weekStart, "d 'de' MMMM", { locale: ptBR })} - ${format(weekEnd, "d 'de' MMMM, yyyy", { locale: ptBR })}`
                  : format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
                }
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={() => {
                  setBlockForm(prev => ({
                    ...prev,
                    startDate: format(new Date(), 'yyyy-MM-dd'),
                    endDate: format(new Date(), 'yyyy-MM-dd'),
                    barberId: isManager ? undefined : barberId
                  }))
                  setShowBlockModal(true)
                }}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Bloquear Horário
              </Button>
              <Select value={viewMode} onValueChange={(v: 'week' | 'day') => setViewMode(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="day">Dia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="border rounded-lg overflow-hidden">
            <ScrollArea className="h-[600px]">
              <div className={viewMode === 'week' ? "min-w-[800px]" : "min-w-[400px]"}>
                <div className={`grid border-b bg-gray-50 sticky top-0 z-10 ${viewMode === 'week' ? 'grid-cols-8' : 'grid-cols-2'}`}>
                  <div className="p-3 text-center text-sm font-medium text-gray-500 border-r">
                    <Clock className="h-4 w-4 mx-auto" />
                  </div>
                  {displayDates.map((date, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 text-center border-r last:border-r-0 ${
                        isToday(date) ? 'bg-amber-50' : ''
                      }`}
                    >
                      <div className="text-xs text-gray-500">{WEEK_DAYS[date.getDay()]}</div>
                      <div className={`text-lg font-semibold ${
                        isToday(date) ? 'text-amber-600' : 'text-gray-900'
                      }`}>
                        {format(date, 'd')}
                      </div>
                    </div>
                  ))}
                </div>

                {timeSlots.map((time) => (
                  <div key={time} className={`grid border-b last:border-b-0 ${viewMode === 'week' ? 'grid-cols-8' : 'grid-cols-2'}`}>
                    <div className="p-2 text-center text-xs text-gray-500 border-r bg-gray-50">
                      {time}
                    </div>
                    {displayDates.map((date, dayIdx) => {
                      const events = getEventsForSlot(date, time)
                      const blocked = isSlotBlocked(date, time)
                      const outsideSchedule = isOutsideWorkSchedule(date, time)

                      return (
                        <div
                          key={`${dayIdx}-${time}`}
                          className={`relative min-h-[50px] border-r last:border-r-0 p-1 cursor-pointer transition-colors ${
                            isToday(date) ? 'bg-amber-50/50' : ''
                          } ${
                            outsideSchedule ? 'bg-gray-100' : ''
                          } ${
                            blocked ? 'bg-red-50/50' : ''
                          } hover:bg-gray-100`}
                          onClick={() => handleSlotClick(date, time)}
                        >
                          {outsideSchedule && events.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-30">
                              <X className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          
                          {events.map((event) => (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedEvent(event)
                              }}
                              className={`p-1 rounded text-xs mb-1 cursor-pointer hover:opacity-90 ${
                                event.type === 'appointment' 
                                  ? STATUS_COLORS[event.status || 'pending']
                                  : BLOCK_COLORS[(event.data as TimeBlock).blockType] || BLOCK_COLORS.other
                              }`}
                            >
                              <div className="font-medium truncate flex items-center gap-1">
                                {event.type === 'block' && <Lock className="h-3 w-3" />}
                                {event.type === 'appointment' && <Scissors className="h-3 w-3" />}
                                {event.title}
                              </div>
                              {event.subtitle && (
                                <div className="text-[10px] truncate opacity-80">
                                  {event.subtitle}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-wrap gap-4 p-4 border-t bg-gray-50">
            <div className="text-xs text-gray-600 font-medium">Legenda:</div>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-100 border-l-2 border-l-blue-500" />
                <span>Confirmado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-100 border-l-2 border-l-yellow-500" />
                <span>Pendente</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-100 border-l-2 border-l-amber-500" />
                <span>Em Andamento</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-100 border-l-2 border-l-green-500" />
                <span>Concluído</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-purple-100 border-l-2 border-l-purple-500" />
                <span>Bloqueado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gray-200" />
                <span>Fora do expediente</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEvent?.type === 'appointment' ? 'Detalhes do Agendamento' : 'Detalhes do Bloqueio'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent?.type === 'appointment' && (
            <div className="space-y-4">
              {(() => {
                const apt = selectedEvent.data as Appointment
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-500">Cliente</Label>
                        <p className="font-medium">{apt.client?.name}</p>
                        {apt.client?.phone && <p className="text-sm text-gray-500">{apt.client.phone}</p>}
                      </div>
                      <div>
                        <Label className="text-gray-500">Serviço</Label>
                        <p className="font-medium">{apt.service?.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(apt.service?.price))}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-500">Data e Hora</Label>
                        <p className="font-medium">
                          {format(new Date(apt.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Barbeiro</Label>
                        <p className="font-medium">{apt.barber?.name}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-500">Status</Label>
                      <Badge className={`mt-1 ${STATUS_COLORS[apt.status]}`}>
                        {STATUS_LABELS[apt.status]}
                      </Badge>
                    </div>

                    {apt.notes && (
                      <div>
                        <Label className="text-gray-500">Observações</Label>
                        <p className="text-sm mt-1">{apt.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                      {['confirmed', 'in_progress'].includes(apt.status) && (
                        <Button 
                          variant="outline"
                          onClick={() => handleUpdateAppointmentStatus(apt.id, 'cancelled')}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Desmarcar Agendamento
                        </Button>
                      )}
                      {apt.status === 'completed' && (
                        <p className="text-sm text-gray-500">Atendimento concluído</p>
                      )}
                      {apt.status === 'cancelled' && (
                        <p className="text-sm text-gray-500">Agendamento cancelado</p>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          )}

          {selectedEvent?.type === 'block' && (
            <div className="space-y-4">
              {(() => {
                const block = selectedEvent.data as TimeBlock
                return (
                  <>
                    <div>
                      <Label className="text-gray-500">Título</Label>
                      <p className="font-medium">{block.title}</p>
                    </div>

                    {block.description && (
                      <div>
                        <Label className="text-gray-500">Descrição</Label>
                        <p className="text-sm">{block.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-500">Início</Label>
                        <p className="font-medium">
                          {format(new Date(block.startDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Fim</Label>
                        <p className="font-medium">
                          {format(new Date(block.endDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-500">Tipo</Label>
                      <Badge className={`mt-1 ${BLOCK_COLORS[block.blockType]}`}>
                        {BLOCK_TYPE_LABELS[block.blockType]}
                      </Badge>
                    </div>

                    <div>
                      <Label className="text-gray-500">Aplica-se a</Label>
                      <p className="font-medium">{block.barber?.name || 'Toda a barbearia'}</p>
                    </div>

                    {isManager && (
                      <div className="pt-4 border-t">
                        <Button 
                          variant="destructive"
                          onClick={() => handleDeleteBlock(block.id)}
                        >
                          Remover Bloqueio
                        </Button>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Horário</DialogTitle>
            <DialogDescription>
              Bloqueie um período para férias, feriados ou manutenção
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input 
                value={blockForm.title}
                onChange={(e) => setBlockForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Férias, Feriado, Manutenção..."
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea 
                value={blockForm.description}
                onChange={(e) => setBlockForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes opcionais..."
              />
            </div>

            <div>
              <Label>Tipo de Bloqueio</Label>
              <Select 
                value={blockForm.blockType} 
                onValueChange={(v) => setBlockForm(prev => ({ ...prev, blockType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BLOCK_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isManager && barbers.length > 0 && (
              <div>
                <Label>Aplicar a</Label>
                <Select 
                  value={blockForm.barberId || 'all'} 
                  onValueChange={(v) => setBlockForm(prev => ({ ...prev, barberId: v === 'all' ? undefined : v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toda a barbearia</SelectItem>
                    {barbers.map((barber) => (
                      <SelectItem key={barber.id} value={barber.id}>{barber.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox 
                id="allDay"
                checked={blockForm.allDay}
                onCheckedChange={(checked) => setBlockForm(prev => ({ ...prev, allDay: !!checked }))}
              />
              <Label htmlFor="allDay" className="cursor-pointer">Dia inteiro</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início</Label>
                <Input 
                  type="date"
                  value={blockForm.startDate}
                  onChange={(e) => setBlockForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              {!blockForm.allDay && (
                <div>
                  <Label>Hora Início</Label>
                  <Input 
                    type="time"
                    value={blockForm.startTime}
                    onChange={(e) => setBlockForm(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Fim</Label>
                <Input 
                  type="date"
                  value={blockForm.endDate}
                  onChange={(e) => setBlockForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              {!blockForm.allDay && (
                <div>
                  <Label>Hora Fim</Label>
                  <Input 
                    type="time"
                    value={blockForm.endTime}
                    onChange={(e) => setBlockForm(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateBlock} className="bg-amber-600 hover:bg-amber-700">
                Criar Bloqueio
              </Button>
              <Button variant="outline" onClick={() => setShowBlockModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
