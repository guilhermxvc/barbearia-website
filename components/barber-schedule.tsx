"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function BarberSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
  const timeSlots = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
  ]

  const appointments = {
    "2024-01-15": {
      "09:00": { client: "Carlos Silva", service: "Corte Clássico" },
      "09:30": { client: "Pedro Santos", service: "Combo Corte + Barba" },
      "10:30": { client: "João Costa", service: "Barba Completa" },
      "11:00": { client: "Lucas Oliveira", service: "Degradê Moderno" },
    },
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }

  const weekDates = getWeekDates(currentDate)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(currentDate)
                  newDate.setDate(currentDate.getDate() - 7)
                  setCurrentDate(newDate)
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(currentDate)
                  newDate.setDate(currentDate.getDate() + 7)
                  setCurrentDate(newDate)
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-2">
            {/* Header com dias da semana */}
            <div className="text-center font-medium text-gray-600 p-2">Horário</div>
            {weekDates.map((date, index) => (
              <div key={index} className="text-center p-2">
                <div className="text-sm font-medium text-gray-900">{weekDays[date.getDay()]}</div>
                <div className="text-xs text-gray-600">{date.getDate()}</div>
              </div>
            ))}

            {/* Grade de horários */}
            {timeSlots.map((time) => (
              <div key={time} className="contents">
                <div className="text-center text-sm text-gray-600 p-2 border-r">{time}</div>
                {weekDates.map((date, dayIndex) => {
                  const dateStr = formatDate(date)
                  const appointment = appointments[dateStr]?.[time]
                  const isToday = formatDate(date) === formatDate(new Date())

                  return (
                    <div
                      key={`${dateStr}-${time}`}
                      className={`p-1 border border-gray-100 min-h-[60px] ${
                        isToday ? "bg-amber-50" : "bg-white"
                      } hover:bg-gray-50`}
                    >
                      {appointment && (
                        <div className="bg-amber-100 border border-amber-200 rounded p-2 text-xs">
                          <div className="font-medium text-amber-800">{appointment.client}</div>
                          <div className="text-amber-600">{appointment.service}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
