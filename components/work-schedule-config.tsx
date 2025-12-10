"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Save, Loader2, AlertCircle, Check } from "lucide-react"
import { apiClient } from "@/lib/api/client"

interface WorkSchedule {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

interface WorkScheduleConfigProps {
  barbershopId: string
  barberId: string
  barberName?: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
]

const DEFAULT_SCHEDULE: Omit<WorkSchedule, 'dayOfWeek'>[] = [
  { startTime: '08:00', endTime: '18:00', isActive: false },
]

export function WorkScheduleConfig({ barbershopId, barberId, barberName }: WorkScheduleConfigProps) {
  const [schedules, setSchedules] = useState<WorkSchedule[]>(
    DAYS_OF_WEEK.map(day => ({
      dayOfWeek: day.value,
      startTime: '08:00',
      endTime: '18:00',
      isActive: day.value >= 1 && day.value <= 5
    }))
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadSchedules()
  }, [barberId, barbershopId])

  const loadSchedules = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<{ success: boolean; schedules: any[] }>(
        `/work-schedules?barbershopId=${barbershopId}&barberId=${barberId}`
      )

      if (response.success && response.data) {
        const data = response.data as { success: boolean; schedules: any[] }
        if (data.schedules && data.schedules.length > 0) {
          const existingSchedules = data.schedules.map((s: any) => ({
            id: s.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
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
      console.error('Error loading schedules:', err)
      setError('Erro ao carregar jornadas de trabalho')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDay = (dayOfWeek: number) => {
    setSchedules(prev => 
      prev.map(s => 
        s.dayOfWeek === dayOfWeek ? { ...s, isActive: !s.isActive } : s
      )
    )
  }

  const handleTimeChange = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedules(prev => 
      prev.map(s => 
        s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s
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
          startTime: s.startTime,
          endTime: s.endTime,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          Jornada de Trabalho
          {barberName && <span className="text-gray-500 font-normal">- {barberName}</span>}
        </CardTitle>
        <CardDescription>
          Configure os dias e horários de trabalho
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <Check className="h-5 w-5" />
            Jornada de trabalho salva com sucesso!
          </div>
        )}

        <div className="space-y-4">
          {DAYS_OF_WEEK.map(day => {
            const schedule = schedules.find(s => s.dayOfWeek === day.value)!
            return (
              <div 
                key={day.value} 
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border ${
                  schedule.isActive ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between sm:w-40">
                  <Label className="font-medium">{day.label}</Label>
                  <Switch
                    checked={schedule.isActive}
                    onCheckedChange={() => handleToggleDay(day.value)}
                  />
                </div>

                {schedule.isActive && (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-gray-500 whitespace-nowrap">Das</Label>
                      <Input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => handleTimeChange(day.value, 'startTime', e.target.value)}
                        className="w-28"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-gray-500 whitespace-nowrap">às</Label>
                      <Input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => handleTimeChange(day.value, 'endTime', e.target.value)}
                        className="w-28"
                      />
                    </div>
                  </div>
                )}

                {!schedule.isActive && (
                  <div className="text-sm text-gray-500 italic">
                    Não trabalha neste dia
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Jornada
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
