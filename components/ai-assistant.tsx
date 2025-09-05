"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, Sparkles } from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

interface AIAssistantProps {
  userType: "client" | "barber" | "manager"
  userName?: string
}

export function AIAssistant({ userType, userName = "Usuário" }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: `Olá, ${userName}! Sou seu assistente de estética masculina. Como posso ajudá-lo hoje?`,
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const getAIResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase()

    // Respostas específicas para clientes
    if (userType === "client") {
      if (lowerMessage.includes("corte") || lowerMessage.includes("cabelo")) {
        return "Para escolher o corte ideal, considere o formato do seu rosto e tipo de cabelo. Cortes como Fade, Undercut e Pompadour estão em alta. Posso recomendar alguns estilos baseados nas suas preferências!"
      }
      if (lowerMessage.includes("barba")) {
        return "Para manter uma barba saudável, use óleo de barba diariamente e evite água muito quente. Recomendo produtos como Óleo de Barba Premium e Bálsamo Hidratante disponíveis na barbearia."
      }
      if (lowerMessage.includes("produto") || lowerMessage.includes("cuidado")) {
        return "Baseado no seu histórico, recomendo uma rotina com shampoo específico para homens, condicionador hidratante e pomada modeladora. Quer saber mais sobre algum produto específico?"
      }
    }

    // Respostas específicas para barbeiros
    if (userType === "barber") {
      if (lowerMessage.includes("tendência") || lowerMessage.includes("moda")) {
        return "As tendências atuais incluem Mullets Modernos, Textured Crops e cortes com desenhos laterais. Observo um aumento de 25% na procura por esses estilos nos últimos 3 meses."
      }
      if (lowerMessage.includes("técnica") || lowerMessage.includes("fade")) {
        return "Para um fade perfeito, use máquinas com diferentes numerações (1, 2, 3, 4) e trabalhe em movimentos circulares suaves. A chave está na transição gradual entre os comprimentos."
      }
      if (lowerMessage.includes("cliente") || lowerMessage.includes("atendimento")) {
        return "Sua taxa de satisfação está em 4.8 estrelas! Para melhorar ainda mais, foque na pontualidade e personalização do atendimento baseado no histórico do cliente."
      }
    }

    // Respostas específicas para managers
    if (userType === "manager") {
      if (lowerMessage.includes("vendas") || lowerMessage.includes("faturamento")) {
        return "Seu faturamento cresceu 15% este mês. Os serviços mais lucrativos são: Combo Corte+Barba (35%), Corte Premium (28%) e Tratamentos (20%). Considere promover esses serviços."
      }
      if (lowerMessage.includes("estoque") || lowerMessage.includes("produto")) {
        return "Baseado nas vendas, recomendo reabastecer: Óleo de Barba Premium (estoque baixo), Pomada Modeladora (alta demanda) e Shampoo Anticaspa (tendência crescente)."
      }
      if (lowerMessage.includes("marketing") || lowerMessage.includes("promoção")) {
        return 'Sugestão de campanha: "Combo Pai & Filho" para o Dia dos Pais com 20% de desconto. Histórico mostra que promoções familiares aumentam o ticket médio em 30%.'
      }
    }

    // Respostas gerais
    if (lowerMessage.includes("horário") || lowerMessage.includes("agenda")) {
      return "Posso ajudar com informações sobre horários disponíveis. Os horários de maior movimento são entre 14h-18h. Manhãs e noites têm mais disponibilidade."
    }

    return "Entendo sua pergunta! Como assistente especializado em estética masculina, posso ajudar com recomendações de cortes, cuidados com barba, produtos e tendências. O que gostaria de saber especificamente?"
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    // Simular delay da IA
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(inputMessage),
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-amber-600 hover:bg-amber-700 shadow-lg z-50"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-amber-600 text-white rounded-t-lg">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Assistente IA
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-amber-700 h-8 w-8 p-0"
        >
          ×
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.sender === "ai" && (
                  <Avatar className="h-8 w-8 bg-amber-100">
                    <AvatarFallback>
                      <Bot className="h-4 w-4 text-amber-600" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    message.sender === "user" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {message.content}
                </div>

                {message.sender === "user" && (
                  <Avatar className="h-8 w-8 bg-gray-100">
                    <AvatarFallback>
                      <User className="h-4 w-4 text-gray-600" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 bg-amber-100">
                  <AvatarFallback>
                    <Bot className="h-4 w-4 text-amber-600" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3 text-sm">
                  <div className="flex gap-1">
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
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta..."
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              size="icon"
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
