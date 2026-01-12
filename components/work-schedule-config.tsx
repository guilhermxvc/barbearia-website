"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Clock, Save, Loader2, AlertCircle, Check, Calendar, Info } from "lucide-react"
import { apiClient } from "@/lib/api/client"

interface WorkSchedule {
  id?: string
  dayOfWeek: number
  isActive: boolean
}

interface BusinessHours {
  [key: string]: {
    enabled: boolean
    openTime: string
    closeTime: string
  }
}

interface WorkScheduleConfigProps {
  barbershopId: string
  barberId: string
  barberName?: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom', key: 'sunday' },
  { value: 1, label: 'Segunda-feira', short: 'Seg', key: 'monday' },
  { value: 2, label: 'Terça-feira', short: 'Ter', key: 'tuesday' },
  { value: 3, label: 'Quarta-feira', short: 'Qua', key: 'wednesday' },
  { value: 4, label: 'Quinta-feira', short: 'Qui', key: 'thursday' },
  { value: 5, label: 'Sexta-feira', short: 'Sex', key: 'friday' },
  { value: 6, label: 'Sábado', short: 'Sáb', key: 'saturday' },
]

export function WorkScheduleConfig({ barbershopId, barberId, barberName }: WorkScheduleConfigProps) {
  const [schedules, setSchedules] = useState<WorkSchedule[]>(
    DAYS_OF_WEEK.map(day => ({
      dayOfWeek: day.value,
      isActive: day.value >= 1 && day.value <= 5
    }))
  )
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadData()
  }, [barberId, barbershopId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [schedulesRes, hoursRes] = await Promise.all([
        apiClient.get<{ success: boolean; schedules: any[] }>(
          `/work-schedules?barbershopId=${barbershopId}&barberId=${barberId}`
        ),
        fetch(`/api/barbershop/business-hours?barbershopId=${barbershopId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        }).then(r => r.json())
      ])

      if (hoursRes.businessHours) {
        setBusinessHours(hoursRes.businessHours)
      }

      if (schedulesRes.success && schedulesRes.data) {
        const data = schedulesRes.data as { success: boolean; schedules: any[] }
        if (data.schedules && data.schedules.length > 0) {
          const existingSchedules = data.schedules.map((s: any) => ({
            id: s.id,
            dayOfWeek: s.dayOfWeek,
            isActive: s.isActive
          }))

          setSchedules(prev => 
            prev.map(schedule => {
              const existing = existingSchedules.find((e: WorkSchedule) => e.dayOfWeek === schedule.dayOfWeek)
              return existing || schedule
            })
          )
        }
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDay = (dayOfWeek: number) => {
    const day = DAYS_OF_WEEK.find(d => d.value === dayOfWeek)
    if (day && businessHours) {
      const shopDay = businessHours[day.key]
      if (!shopDay?.enabled) {
        return
      }
    }
    
    setSchedules(prev => 
      prev.map(s => 
        s.dayOfWeek === dayOfWeek ? { ...s, isActive: !s.isActive } : s
      )
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError("")
      setSuccess(false)

      await apiClient.put('/work-schedules', {
        barbershopId,
        barberId,
        schedules: schedules.map(s => ({
          dayOfWeek: s.dayOfWeek,
          isActive: s.isActive
        }))
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving schedules:', err)
      setError('Erro ao salvar jornadas de trabalho')
    } finally {
      setSaving(false)
    }
  }

  const getShopHoursForDay = (dayOfWeek: number) => {
    const day = DAYS_OF_WEEK.find(d => d.value === dayOfWeek)
    if (day && businessHours && businessHours[day.key]?.enabled) {
      return `${businessHours[day.key].openTime} - ${businessHours[day.key].closeTime}`
    }
    return null
  }

  const isShopOpenOnDay = (dayOfWeek: number) => {
    const day = DAYS_OF_WEEK.find(d => d.value === dayOfWeek)
    if (day && businessHours) {
      return businessHours[day.key]?.enabled ?? false
    }
    return true
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-amber-600" />
          {barberName ? `Dias de Trabalho - ${barberName}` : 'Meus Dias de Trabalho'}
        </CardTitle>
        <CardDescription>
          Selecione os dias em que você trabalha. O horário de atendimento segue o funcionamento da barbearia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
            <Check className="h-4 w-4" />
            <span className="text-sm">Jornada de trabalho salva com sucesso!</span>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
          <p className="text-sm text-blue-700">
            O horário de atendimento é definido pelo dono da barbearia nas configurações. 
            Você pode escolher quais dias trabalhar e bloquear horários específicos quando necessário.
          </p>
        </div>

        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day) => {
            const shopOpen = isShopOpenOnDay(day.value)
            const shopHours = getShopHoursForDay(day.value)
            const schedule = schedules.find(s => s.dayOfWeek === day.value)
            
            return (
              <div 
                key={day.value} 
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  !shopOpen 
                    ? 'bg-gray-100 border-gray-200 opacity-60' 
                    : schedule?.isActive 
                      ? 'bg-amber-50 border-amber-200' 
                      : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{day.label}</span>
                  {shopOpen ? (
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {shopHours}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">Barbearia fechada</span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {schedule?.isActive && shopOpen && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                      Trabalhando
                    </span>
                  )}
                  <Switch
                    checked={schedule?.isActive && shopOpen}
                    onCheckedChange={() => handleToggleDay(day.value)}
                    disabled={!shopOpen}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Dias de Trabalho
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
