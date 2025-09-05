"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check, X, Calendar, Star, TrendingUp, AlertCircle } from "lucide-react"

interface Notification {
  id: string
  type: "appointment" | "review" | "promotion" | "system" | "reminder"
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: "low" | "medium" | "high"
}

interface NotificationsSystemProps {
  userType: "client" | "barber" | "manager"
}

export function NotificationsSystem({ userType }: NotificationsSystemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    // Simular notificações baseadas no tipo de usuário
    const generateNotifications = (): Notification[] => {
      const baseNotifications: Notification[] = []

      if (userType === "client") {
        baseNotifications.push(
          {
            id: "1",
            type: "reminder",
            title: "Lembrete de Agendamento",
            message: "Seu corte com Barbeiro Carlos é amanhã às 14:00",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            read: false,
            priority: "high",
          },
          {
            id: "2",
            type: "promotion",
            title: "Promoção Especial",
            message: "Combo Corte + Barba com 20% de desconto até sexta-feira!",
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            read: false,
            priority: "medium",
          },
          {
            id: "3",
            type: "review",
            title: "Avalie seu último serviço",
            message: "Como foi seu corte com Barbeiro João? Sua opinião é importante!",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            read: true,
            priority: "low",
          },
        )
      }

      if (userType === "barber") {
        baseNotifications.push(
          {
            id: "1",
            type: "appointment",
            title: "Novo Agendamento",
            message: "Pedro Silva agendou um corte para hoje às 16:00",
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
            read: false,
            priority: "high",
          },
          {
            id: "2",
            type: "review",
            title: "Nova Avaliação",
            message: "João deu 5 estrelas para seu último atendimento!",
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
            read: false,
            priority: "medium",
          },
          {
            id: "3",
            type: "system",
            title: "Meta Atingida",
            message: "Parabéns! Você atingiu sua meta mensal de atendimentos",
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            read: true,
            priority: "medium",
          },
        )
      }

      if (userType === "manager") {
        baseNotifications.push(
          {
            id: "1",
            type: "system",
            title: "Estoque Baixo",
            message: "Óleo de Barba Premium com apenas 3 unidades em estoque",
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            read: false,
            priority: "high",
          },
          {
            id: "2",
            type: "appointment",
            title: "Cancelamento",
            message: "Cliente cancelou agendamento de hoje às 15:00",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            read: false,
            priority: "medium",
          },
          {
            id: "3",
            type: "system",
            title: "Relatório Mensal",
            message: "Relatório de faturamento de outubro está disponível",
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
            read: true,
            priority: "low",
          },
        )
      }

      return baseNotifications
    }

    setNotifications(generateNotifications())
  }, [userType])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-4 w-4" />
      case "review":
        return <Star className="h-4 w-4" />
      case "promotion":
        return <TrendingUp className="h-4 w-4" />
      case "system":
        return <AlertCircle className="h-4 w-4" />
      case "reminder":
        return <Bell className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: Notification["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (hours > 24) {
      return `${Math.floor(hours / 24)}d atrás`
    } else if (hours > 0) {
      return `${hours}h atrás`
    } else {
      return `${minutes}min atrás`
    }
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 shadow-xl z-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-lg font-semibold">Notificações</CardTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                Marcar todas como lidas
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">Nenhuma notificação</div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <p className="text-xs text-gray-400">{formatTime(notification.timestamp)}</p>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(notification.id)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
