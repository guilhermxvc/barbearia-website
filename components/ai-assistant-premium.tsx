"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Bot, Send, Sparkles, TrendingUp, Users, Calendar, Crown, Lock } from "lucide-react"

interface AIAssistantPremiumProps {
  userPlan: string
}

export function AIAssistantPremium({ userPlan }: AIAssistantPremiumProps) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      content: "Olá! Sou seu assistente IA especializado em barbearias. Como posso ajudá-lo hoje?",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const isPremium = userPlan === "Premium"

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !isPremium) return

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setInputMessage("")
    setIsLoading(true)

    // Simular resposta da IA
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: "ai",
        content:
          "Baseado nos dados da sua barbearia, posso sugerir algumas estratégias para aumentar sua receita em 15% no próximo mês...",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
    }, 2000)
  }

  const aiFeatures = [
    {
      icon: TrendingUp,
      title: "Análise Preditiva",
      description: "Previsões de demanda e otimização de agenda",
      color: "text-blue-600 bg-blue-100",
    },
    {
      icon: Users,
      title: "Insights de Clientes",
      description: "Recomendações personalizadas para cada cliente",
      color: "text-green-600 bg-green-100",
    },
    {
      icon: Calendar,
      title: "Otimização de Horários",
      description: "Sugestões inteligentes para maximizar ocupação",
      color: "text-purple-600 bg-purple-100",
    },
    {
      icon: Sparkles,
      title: "Automação Inteligente",
      description: "Respostas automáticas e gestão de relacionamento",
      color: "text-amber-600 bg-amber-100",
    },
  ]

  if (!isPremium) {
    return (
      <div className="space-y-6">
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="h-10 w-10 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Assistente IA Premium</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Desbloqueie o poder da inteligência artificial para revolucionar sua barbearia com insights avançados e
              automação inteligente.
            </p>
            <div className="flex items-center justify-center space-x-2 mb-6">
              <Lock className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700 font-medium">Disponível apenas no Plano Premium</span>
            </div>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3">
              <Crown className="h-4 w-4 mr-2" />
              Fazer Upgrade para Premium
            </Button>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {aiFeatures.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index} className="opacity-60">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-full ${feature.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Assistente IA Premium</CardTitle>
                <CardDescription>Seu consultor inteligente para barbearia</CardDescription>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        {aiFeatures.map((feature, index) => {
          const IconComponent = feature.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className={`p-3 rounded-full ${feature.color} w-fit mb-3`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">{feature.title}</h4>
                <p className="text-gray-600 text-xs">{feature.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="h-5 w-5 mr-2 text-blue-600" />
            Chat com IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 h-96 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === "user"
                      ? "bg-amber-600 text-white"
                      : "bg-white border border-gray-200 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">IA está pensando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite sua pergunta sobre a barbearia..."
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
