"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check, X, Calendar, Star, TrendingUp, AlertCircle, CheckCheck } from "lucide-react"
import { notificationsApi, Notification } from "@/lib/api/notifications"

interface NotificationsSystemProps {
  userType: "client" | "barber" | "manager"
}

export function NotificationsSystem({ userType }: NotificationsSystemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadNotifications()
    
    // Recarregar notificações a cada 30 segundos
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await notificationsApi.getNotifications()
      
      if (response.success && response.notifications) {
        setNotifications(response.notifications)
        setError("")
      } else {
        setError(response.error || "Erro ao carregar notificações")
      }
    } catch (err) {
      setError("Erro ao carregar notificações")
      console.error("Load notifications error:", err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await notificationsApi.markAsRead(id)
      
      if (response.success) {
        setNotifications(notifications.map(notification =>
          notification.id === id 
            ? { ...notification, isRead: true }
            : notification
        ))
      } else {
        alert(response.error || "Erro ao marcar notificação como lida")
      }
    } catch (err) {
      alert("Erro ao marcar notificação como lida")
      console.error("Mark as read error:", err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await notificationsApi.markAllAsRead()
      
      if (response.success) {
        setNotifications(notifications.map(notification => ({
          ...notification,
          isRead: true
        })))
      } else {
        alert(response.error || "Erro ao marcar todas as notificações como lidas")
      }
    } catch (err) {
      alert("Erro ao marcar todas as notificações como lidas")
      console.error("Mark all as read error:", err)
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
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

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "low":
        return "text-gray-600 bg-gray-50 border-gray-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes}min atrás`
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d atrás`
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          disabled
        >
          <Bell className="h-5 w-5" />
          <span className="ml-2">Carregando...</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        <span className="ml-2">Notificações</span>
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 hover:bg-red-600"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute top-full right-0 z-50 w-96 mt-2 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificações</CardTitle>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Marcar todas como lidas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
                <Button 
                  onClick={loadNotifications} 
                  className="ml-2" 
                  size="sm" 
                  variant="ghost"
                >
                  Tentar Novamente
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-1 p-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        p-3 rounded-lg border transition-colors cursor-pointer
                        ${notification.isRead ? "bg-gray-50 border-gray-200" : getPriorityColor(notification.priority)}
                        hover:bg-opacity-80
                      `}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`
                          p-2 rounded-full
                          ${notification.isRead ? "bg-gray-200 text-gray-500" : getPriorityColor(notification.priority)}
                        `}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`
                              text-sm font-medium truncate
                              ${notification.isRead ? "text-gray-600" : "text-gray-900"}
                            `}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="flex items-center space-x-1">
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs"
                                >
                                  {notification.priority}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsRead(notification.id)
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className={`
                            text-sm mt-1
                            ${notification.isRead ? "text-gray-500" : "text-gray-700"}
                          `}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatTimestamp(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}