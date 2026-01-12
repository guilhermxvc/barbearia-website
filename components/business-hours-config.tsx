"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Clock, Save, Loader2, Check } from "lucide-react"

interface DaySchedule {
  isOpen: boolean
  openTime: string
  closeTime: string
}

interface BusinessHours {
  [key: string]: DaySchedule
}

interface BusinessHoursConfigProps {
  barbershopId: string
}

const DAYS_OF_WEEK = [
  { key: 'sunday', label: 'Domingo', short: 'Dom' },
  { key: 'monday', label: 'Segunda-feira', short: 'Seg' },
  { key: 'tuesday', label: 'Terça-feira', short: 'Ter' },
  { key: 'wednesday', label: 'Quarta-feira', short: 'Qua' },
  { key: 'thursday', label: 'Quinta-feira', short: 'Qui' },
  { key: 'friday', label: 'Sexta-feira', short: 'Sex' },
  { key: 'saturday', label: 'Sábado', short: 'Sáb' },
]

const TIME_OPTIONS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
  "22:00", "22:30", "23:00"
]

const DEFAULT_HOURS: BusinessHours = {
  sunday: { isOpen: false, openTime: "09:00", closeTime: "18:00" },
  monday: { isOpen: true, openTime: "09:00", closeTime: "19:00" },
  tuesday: { isOpen: true, openTime: "09:00", closeTime: "19:00" },
  wednesday: { isOpen: true, openTime: "09:00", closeTime: "19:00" },
  thursday: { isOpen: true, openTime: "09:00", closeTime: "19:00" },
  friday: { isOpen: true, openTime: "09:00", closeTime: "19:00" },
  saturday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
}

export function BusinessHoursConfig({ barbershopId }: BusinessHoursConfigProps) {
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_HOURS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadBusinessHours()
  }, [barbershopId])

  const loadBusinessHours = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/barbershop/business-hours?barbershopId=${barbershopId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.businessHours) {
          setHours(data.businessHours)
        }
      }
    } catch (err) {
      console.error('Error loading business hours:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDay = (dayKey: string) => {
    setHours(prev => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], isOpen: !prev[dayKey].isOpen }
    }))
  }

  const handleTimeChange = (dayKey: string, field: 'openTime' | 'closeTime', value: string) => {
    setHours(prev => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value }
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError("")
      setSuccess(false)

      const response = await fetch('/api/barbershop/business-hours', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          barbershopId,
          businessHours: hours,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao salvar horários')
      }
    } catch (err) {
      console.error('Error saving business hours:', err)
      setError('Erro ao salvar horários de funcionamento')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Horário de Funcionamento
          </CardTitle>
        </CardHeader>
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
          <Clock className="h-5 w-5 text-amber-600" />
          Horário de Funcionamento
        </CardTitle>
        <CardDescription>
          Configure os dias e horários em que sua barbearia está aberta. Os clientes só poderão agendar dentro desses horários.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day.key}
              className={`flex items-center gap-4 p-3 rounded-lg border ${
                hours[day.key]?.isOpen ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Switch
                checked={hours[day.key]?.isOpen || false}
                onCheckedChange={() => handleToggleDay(day.key)}
              />
              <span className={`w-32 font-medium ${hours[day.key]?.isOpen ? 'text-gray-900' : 'text-gray-500'}`}>
                {day.label}
              </span>
              
              {hours[day.key]?.isOpen ? (
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={hours[day.key]?.openTime || "09:00"}
                    onChange={(e) => handleTimeChange(day.key, 'openTime', e.target.value)}
                    className="p-2 border rounded-md bg-white"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  <span className="text-gray-500">até</span>
                  <select
                    value={hours[day.key]?.closeTime || "18:00"}
                    onChange={(e) => handleTimeChange(day.key, 'closeTime', e.target.value)}
                    className="p-2 border rounded-md bg-white"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-gray-500 italic">Fechado</span>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md flex items-center gap-2">
            <Check className="h-4 w-4" />
            Horários salvos com sucesso!
          </div>
        )}

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
              Salvar Horários
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
