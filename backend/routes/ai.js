const express = require("express")
const { authenticate } = require("../middlewares/auth")
const { auditLogger } = require("../middlewares/logging")
const db = require("../config/database")
const ApiResponse = require("../utils/response")

const router = express.Router()

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Interagir com IA assistente
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               context:
 *                 type: string
 *                 enum: [general, appointments, clients, reports]
 *     responses:
 *       200:
 *         description: Resposta da IA
 */
router.post("/chat", authenticate, auditLogger("AI_CHAT"), (req, res) => {
  try {
    const { message, context = "general" } = req.body

    if (!message || message.trim().length === 0) {
      return ApiResponse.error(res, "Mensagem é obrigatória", 400)
    }

    // Mock AI responses based on context and message content
    let aiResponse = ""
    const messageLower = message.toLowerCase()

    if (context === "appointments" || messageLower.includes("agendamento")) {
      if (messageLower.includes("hoje")) {
        const todayAppointments = db.appointments.filter((apt) => {
          const today = new Date().toISOString().split("T")[0]
          return (
            apt.date === today &&
            (req.user.role === "barber"
              ? apt.barberId === req.user.id
              : req.user.role === "manager"
                ? apt.barbershopId === req.user.barbershopId
                : true)
          )
        })

        aiResponse = `Você tem ${todayAppointments.length} agendamentos para hoje. ${
          todayAppointments.length > 0
            ? `O próximo é às ${todayAppointments.sort((a, b) => a.time.localeCompare(b.time))[0].time}.`
            : "Sua agenda está livre!"
        }`
      } else if (messageLower.includes("cancelar") || messageLower.includes("reagendar")) {
        aiResponse =
          "Para cancelar ou reagendar um agendamento, acesse a seção de agendamentos e selecione a opção desejada. Lembre-se de notificar o cliente com antecedência."
      } else {
        aiResponse =
          "Posso ajudar você com informações sobre agendamentos, horários disponíveis, cancelamentos e reagendamentos. O que você gostaria de saber?"
      }
    } else if (context === "clients" || messageLower.includes("cliente")) {
      if (messageLower.includes("melhor") || messageLower.includes("top")) {
        aiResponse =
          "Seus melhores clientes são aqueles com maior frequência e valor gasto. Você pode ver o ranking completo na seção de relatórios de clientes."
      } else if (messageLower.includes("novo")) {
        aiResponse =
          "Para atrair novos clientes, considere: oferecer promoções para primeira visita, pedir indicações aos clientes satisfeitos, e manter presença ativa nas redes sociais."
      } else {
        aiResponse =
          "Posso ajudar com informações sobre seus clientes, histórico de atendimentos, preferências e estratégias de fidelização. Como posso ajudar?"
      }
    } else if (context === "reports" || messageLower.includes("relatório") || messageLower.includes("faturamento")) {
      if (messageLower.includes("hoje") || messageLower.includes("dia")) {
        const today = new Date().toISOString().split("T")[0]
        const todayRevenue = db.appointments
          .filter(
            (apt) =>
              apt.date === today &&
              apt.status === "completed" &&
              (req.user.role === "barber"
                ? apt.barberId === req.user.id
                : req.user.role === "manager"
                  ? apt.barbershopId === req.user.barbershopId
                  : true),
          )
          .reduce((sum, apt) => sum + apt.price, 0)

        aiResponse = `O faturamento de hoje é R$ ${todayRevenue.toFixed(2)}. ${
          todayRevenue > 0
            ? "Bom trabalho! Continue assim."
            : "Ainda não há faturamento hoje, mas o dia ainda não acabou!"
        }`
      } else if (messageLower.includes("mês")) {
        aiResponse =
          "Você pode visualizar o relatório mensal completo na seção de relatórios. Lá você encontra faturamento, número de atendimentos e comparação com meses anteriores."
      } else {
        aiResponse =
          "Posso ajudar com informações sobre faturamento, performance, clientes mais ativos e tendências do seu negócio. Sobre o que você gostaria de saber?"
      }
    } else {
      // General responses
      if (messageLower.includes("olá") || messageLower.includes("oi")) {
        aiResponse = `Olá, ${req.user.name}! Como posso ajudar você hoje? Posso fornecer informações sobre agendamentos, clientes, relatórios e muito mais.`
      } else if (messageLower.includes("ajuda")) {
        aiResponse =
          "Estou aqui para ajudar! Posso responder perguntas sobre:\n• Agendamentos e horários\n• Informações de clientes\n• Relatórios e faturamento\n• Dicas para o seu negócio\n\nO que você gostaria de saber?"
      } else if (messageLower.includes("obrigado") || messageLower.includes("valeu")) {
        aiResponse = "De nada! Fico feliz em ajudar. Se precisar de mais alguma coisa, é só perguntar!"
      } else {
        aiResponse =
          "Entendi sua pergunta. Para uma resposta mais específica, você pode me perguntar sobre agendamentos, clientes, relatórios ou outras funcionalidades do sistema. Como posso ajudar melhor?"
      }
    }

    const response = {
      message: aiResponse,
      context,
      timestamp: new Date().toISOString(),
      suggestions: [
        "Quantos agendamentos tenho hoje?",
        "Qual meu faturamento do mês?",
        "Quem são meus melhores clientes?",
        "Como posso melhorar meu negócio?",
      ],
    }

    return ApiResponse.success(res, response, "Resposta da IA gerada")
  } catch (error) {
    console.error("AI chat error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/ai/suggestions:
 *   get:
 *     summary: Obter sugestões personalizadas da IA
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sugestões personalizadas
 */
router.get("/suggestions", authenticate, (req, res) => {
  try {
    const userId = req.user.id
    const userRole = req.user.role

    // Generate personalized suggestions based on user data
    const suggestions = []

    if (userRole === "barber") {
      // Get barber's appointments
      const appointments = db.findAllByField("appointments", "barberId", userId)
      const todayAppointments = appointments.filter((apt) => {
        const today = new Date().toISOString().split("T")[0]
        return apt.date === today
      })

      if (todayAppointments.length === 0) {
        suggestions.push({
          type: "schedule",
          title: "Agenda livre hoje",
          message: "Que tal aproveitar para organizar seus materiais ou estudar novas técnicas?",
          priority: "low",
        })
      } else if (todayAppointments.length > 5) {
        suggestions.push({
          type: "schedule",
          title: "Dia movimentado",
          message: "Você tem muitos agendamentos hoje. Lembre-se de fazer pausas entre os atendimentos.",
          priority: "medium",
        })
      }

      // Check for pending appointments
      const pendingAppointments = appointments.filter((apt) => apt.status === "pending")
      if (pendingAppointments.length > 0) {
        suggestions.push({
          type: "appointments",
          title: "Agendamentos pendentes",
          message: `Você tem ${pendingAppointments.length} agendamentos aguardando confirmação.`,
          priority: "high",
        })
      }
    } else if (userRole === "manager") {
      // Get barbershop data
      const barbershopId = req.user.barbershopId
      const appointments = db.findAllByField("appointments", "barbershopId", barbershopId)

      // Check for low-performing periods
      const thisWeekAppointments = appointments.filter((apt) => {
        const appointmentDate = new Date(apt.date)
        const today = new Date()
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        return appointmentDate >= weekStart
      })

      if (thisWeekAppointments.length < 10) {
        suggestions.push({
          type: "marketing",
          title: "Movimento baixo esta semana",
          message: "Considere criar uma promoção ou campanha de marketing para atrair mais clientes.",
          priority: "medium",
        })
      }

      // Check for products with low stock
      const products = db.findAllByField("products", "barbershopId", barbershopId)
      const lowStockProducts = products.filter((product) => product.stock <= product.minStock)

      if (lowStockProducts.length > 0) {
        suggestions.push({
          type: "inventory",
          title: "Estoque baixo",
          message: `${lowStockProducts.length} produtos estão com estoque baixo. Considere fazer reposição.`,
          priority: "high",
        })
      }
    } else if (userRole === "client") {
      // Get client's appointments
      const appointments = db.findAllByField("appointments", "clientId", userId)
      const lastAppointment = appointments.sort(
        (a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`),
      )[0]

      if (lastAppointment) {
        const daysSinceLastAppointment = Math.floor(
          (new Date() - new Date(lastAppointment.date)) / (1000 * 60 * 60 * 24),
        )

        if (daysSinceLastAppointment > 30) {
          suggestions.push({
            type: "appointment",
            title: "Que tal agendar um novo corte?",
            message: "Faz um tempo que você não vem. Que tal marcar um horário?",
            priority: "medium",
          })
        }
      } else {
        suggestions.push({
          type: "welcome",
          title: "Bem-vindo!",
          message: "Faça seu primeiro agendamento e descubra nossos serviços.",
          priority: "high",
        })
      }
    }

    // Add general suggestions
    suggestions.push({
      type: "tip",
      title: "Dica do dia",
      message: "Mantenha sempre uma comunicação clara com seus clientes para evitar mal-entendidos.",
      priority: "low",
    })

    return ApiResponse.success(res, suggestions, "Sugestões personalizadas geradas")
  } catch (error) {
    console.error("AI suggestions error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

module.exports = router
