"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Clock, DollarSign, User, Check, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { appointmentsApi } from "@/lib/api/appointments"
import { servicesApi } from "@/lib/api/services"
import { barbersApi } from "@/lib/api/barbers"

interface BusinessHours {
  [key: string]: {
    isOpen: boolean
    openTime: string
    closeTime: string
  }
}

interface BookingFlowProps {
  barbershop: any
  onBack: () => void
}

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function generateTimeSlots(openTime: string, closeTime: string, intervalMinutes: number = 30): string[] {
  const slots: string[] = []
  const [openHour, openMin] = openTime.split(':').map(Number)
  const [closeHour, closeMin] = closeTime.split(':').map(Number)
  
  let currentMinutes = openHour * 60 + openMin
  const endMinutes = closeHour * 60 + closeMin
  
  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60)
    const mins = currentMinutes % 60
    slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`)
    currentMinutes += intervalMinutes
  }
  
  return slots
}

export function BookingFlow({ barbershop, onBack }: BookingFlowProps) {
  const { user } = useAuth()
  const clientId = user?.client?.id
  
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedBarber, setSelectedBarber] = useState<any>(null)
  const [selectedDateTime, setSelectedDateTime] = useState<any>(null)
  const [notes, setNotes] = useState("")
  const [services, setServices] = useState<any[]>([])
  const [barbers, setBarbers] = useState<any[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null)
  const [availableSlots, setAvailableSlots] = useState<{date: string, day: string, slots: string[]}[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    if (barbershop?.id) {
      loadData()
    }
  }, [barbershop?.id])

  useEffect(() => {
    if (businessHours) {
      generateAvailableSlots()
    }
  }, [businessHours])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [servicesRes, barbersRes, hoursRes] = await Promise.all([
        servicesApi.list(barbershop.id),
        barbersApi.getAll(barbershop.id),
        fetch(`/api/barbershop/business-hours?barbershopId=${barbershop.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }).then(r => r.json())
      ])
      
      if (servicesRes.success && servicesRes.data) {
        setServices(servicesRes.data.services)
      }
      
      if (barbersRes.success && barbersRes.data) {
        setBarbers(barbersRes.data)
      }

      if (hoursRes.businessHours) {
        setBusinessHours(hoursRes.businessHours)
      } else {
        setBusinessHours({
          sunday: { isOpen: false, openTime: "09:00", closeTime: "18:00" },
          monday: { isOpen: true, openTime: "09:00", closeTime: "19:00" },
          tuesday: { isOpen: true, openTime: "09:00", closeTime: "19:00" },
          wednesday: { isOpen: true, openTime: "09:00", closeTime: "19:00" },
          thursday: { isOpen: true, openTime: "09:00", closeTime: "19:00" },
          friday: { isOpen: true, openTime: "09:00", closeTime: "19:00" },
          saturday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
        })
      }
    } catch (error) {
      console.error("Load data error:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateAvailableSlots = () => {
    if (!businessHours) return

    setLoadingSlots(true)
    const slots: {date: string, day: string, slots: string[]}[] = []
    const today = new Date()
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      const dayOfWeek = date.getDay()
      const dayKey = DAY_KEYS[dayOfWeek]
      const daySchedule = businessHours[dayKey]
      
      if (daySchedule?.isOpen) {
        const dateStr = date.toISOString().split('T')[0]
        let dayName = DAY_NAMES[dayOfWeek]
        
        if (i === 0) dayName = 'Hoje'
        else if (i === 1) dayName = 'Amanhã'
        
        const timeSlots = generateTimeSlots(daySchedule.openTime, daySchedule.closeTime, 30)
        
        if (i === 0) {
          const currentHour = today.getHours()
          const currentMin = today.getMinutes()
          const currentMinutes = currentHour * 60 + currentMin + 60
          
          const filteredSlots = timeSlots.filter(slot => {
            const [h, m] = slot.split(':').map(Number)
            return h * 60 + m > currentMinutes
          })
          
          if (filteredSlots.length > 0) {
            slots.push({ date: dateStr, day: dayName, slots: filteredSlots })
          }
        } else {
          slots.push({ date: dateStr, day: dayName, slots: timeSlots })
        }
      }
    }
    
    setAvailableSlots(slots)
    setLoadingSlots(false)
  }

  const handleBooking = async () => {
    if (!selectedService || !selectedBarber || !selectedDateTime) {
      alert("Por favor, complete todos os passos do agendamento")
      return
    }

    if (!clientId) {
      alert("Erro: Cliente não identificado. Faça login novamente.")
      return
    }

    try {
      const scheduledAt = new Date(`${selectedDateTime.date}T${selectedDateTime.time}:00`)
      
      const appointmentData = {
        barbershopId: barbershop.id,
        clientId,
        barberId: selectedBarber.id,
        serviceId: selectedService.id,
        scheduledAt: scheduledAt.toISOString(),
        duration: selectedService.duration,
        totalPrice: selectedService.price.toString(),
        notes: notes || undefined,
      }

      const response = await appointmentsApi.create(appointmentData)
      
      if (response.success) {
        alert("Agendamento realizado com sucesso!")
        onBack()
      } else {
        alert(response.error || "Erro ao criar agendamento")
      }
    } catch (error) {
      console.error("Booking error:", error)
      alert("Erro ao processar agendamento. Tente novamente.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{barbershop.name}</h2>
          <p className="text-gray-600">{barbershop.address}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3, 4].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNumber ? "bg-amber-600 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {step > stepNumber ? <Check className="h-4 w-4" /> : stepNumber}
            </div>
            {stepNumber < 4 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Escolher Serviço */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Escolha o Serviço</CardTitle>
            <CardDescription>Selecione o serviço que deseja agendar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedService?.id === service.id
                      ? "border-amber-600 bg-amber-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedService(service)}
                >
                  <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-medium">R$ {service.price}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-600 text-sm">{service.duration} min</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedService}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Escolher Barbeiro */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Escolha o Barbeiro</CardTitle>
            <CardDescription>Selecione o profissional de sua preferência</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {barbers.map((barber) => (
                <div
                  key={barber.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedBarber?.id === barber.id
                      ? "border-amber-600 bg-amber-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedBarber(barber)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{barber.name}</h3>
                      <p className="text-sm text-gray-600">Experiência: {barber.experience}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {barber.specialties && barber.specialties.length > 0 && (
                          <div className="flex space-x-1">
                            {barber.specialties.map((specialty: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button onClick={() => setStep(3)} disabled={!selectedBarber} className="bg-amber-600 hover:bg-amber-700">
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Escolher Data e Hora */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Escolha Data e Hora</CardTitle>
            <CardDescription>Selecione o melhor horário para você (horários conforme funcionamento da barbearia)</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Não há horários disponíveis nos próximos 14 dias.</p>
                <p className="text-sm">A barbearia pode estar fechada ou sem horários configurados.</p>
              </div>
            ) : (
            <div className="space-y-6">
              {availableSlots.map((daySlots) => (
                <div key={daySlots.date}>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {daySlots.day} - {new Date(daySlots.date + 'T12:00:00').toLocaleDateString("pt-BR")}
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {daySlots.slots.map((slot) => (
                      <Button
                        key={`${daySlots.date}-${slot}`}
                        variant={
                          selectedDateTime?.date === daySlots.date && selectedDateTime?.time === slot
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className={
                          selectedDateTime?.date === daySlots.date && selectedDateTime?.time === slot
                            ? "bg-amber-600 hover:bg-amber-700"
                            : ""
                        }
                        onClick={() => setSelectedDateTime({ date: daySlots.date, time: slot, day: daySlots.day })}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            )}
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!selectedDateTime}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirmação */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Confirmar Agendamento</CardTitle>
            <CardDescription>Revise os detalhes do seu agendamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Resumo do Agendamento</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Barbearia:</span>
                    <span className="font-medium">{barbershop.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Serviço:</span>
                    <span className="font-medium">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Barbeiro:</span>
                    <span className="font-medium">{selectedBarber?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium">
                      {selectedDateTime?.day} - {selectedDateTime?.time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duração:</span>
                    <span className="font-medium">{selectedService?.duration} minutos</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-semibold">Total:</span>
                    <span className="text-green-600 font-bold">R$ {selectedService?.price}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações (opcional)</label>
                <Textarea
                  placeholder="Alguma observação especial para o barbeiro..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(3)}>
                Voltar
              </Button>
              <Button onClick={handleBooking} className="bg-green-600 hover:bg-green-700">
                Confirmar Agendamento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
