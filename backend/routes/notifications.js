const express = require("express")
const { authenticate, authorize } = require("../middlewares/auth")
const { auditLogger } = require("../middlewares/logging")
const db = require("../config/database")
const ApiResponse = require("../utils/response")

const router = express.Router()

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Obter notificações do usuário
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Filtrar apenas não lidas
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [appointment, barber_request, barber_approved, barber_removed, system]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista de notificações
 */
router.get("/", authenticate, (req, res) => {
  try {
    const { unread, type, page = 1, limit = 20 } = req.query
    const userId = req.user.id

    let notifications = db.findAllByField("notifications", "userId", userId)

    // Apply filters
    if (unread === "true") {
      notifications = notifications.filter((notif) => !notif.read)
    }

    if (type) {
      notifications = notifications.filter((notif) => notif.type === type)
    }

    // Sort by creation date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + Number.parseInt(limit)
    const paginatedNotifications = notifications.slice(startIndex, endIndex)

    // Add relative time and format
    const formattedNotifications = paginatedNotifications.map((notification) => {
      const now = new Date()
      const createdAt = new Date(notification.createdAt)
      const diffInMinutes = Math.floor((now - createdAt) / (1000 * 60))

      let timeAgo
      if (diffInMinutes < 1) {
        timeAgo = "Agora mesmo"
      } else if (diffInMinutes < 60) {
        timeAgo = `${diffInMinutes} min atrás`
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60)
        timeAgo = `${hours}h atrás`
      } else {
        const days = Math.floor(diffInMinutes / 1440)
        timeAgo = `${days}d atrás`
      }

      return {
        ...notification,
        timeAgo,
        createdAt: createdAt.toISOString(),
      }
    })

    // Count unread notifications
    const unreadCount = notifications.filter((notif) => !notif.read).length

    return ApiResponse.paginated(
      res,
      formattedNotifications,
      {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total: notifications.length,
        unreadCount,
      },
      "Notificações obtidas com sucesso",
    )
  } catch (error) {
    console.error("Get notifications error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Marcar notificação como lida
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notificação marcada como lida
 */
router.put("/:id/read", authenticate, (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const notification = db.findById("notifications", id)

    if (!notification) {
      return ApiResponse.error(res, "Notificação não encontrada", 404)
    }

    // Check if notification belongs to user
    if (notification.userId !== userId) {
      return ApiResponse.error(res, "Acesso negado a esta notificação", 403)
    }

    // Mark as read
    const updatedNotification = db.update("notifications", id, {
      read: true,
    })

    return ApiResponse.success(res, updatedNotification, "Notificação marcada como lida")
  } catch (error) {
    console.error("Mark notification as read error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   put:
 *     summary: Marcar todas as notificações como lidas
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas as notificações marcadas como lidas
 */
router.put("/mark-all-read", authenticate, auditLogger("MARK_ALL_NOTIFICATIONS_READ"), (req, res) => {
  try {
    const userId = req.user.id

    // Get all unread notifications for user
    const unreadNotifications = db.notifications.filter((notif) => notif.userId === userId && !notif.read)

    // Mark all as read
    let updatedCount = 0
    unreadNotifications.forEach((notification) => {
      db.update("notifications", notification.id, { read: true })
      updatedCount++
    })

    return ApiResponse.success(res, { updatedCount }, `${updatedCount} notificações marcadas como lidas`)
  } catch (error) {
    console.error("Mark all notifications as read error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Enviar notificação (apenas managers)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - recipients
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs dos usuários destinatários
 *               type:
 *                 type: string
 *                 enum: [system, announcement, promotion]
 *                 default: system
 *     responses:
 *       201:
 *         description: Notificação enviada com sucesso
 */
router.post("/send", authenticate, authorize("manager"), auditLogger("SEND_NOTIFICATION"), (req, res) => {
  try {
    const { title, message, recipients, type = "system" } = req.body

    if (!title || !message || !recipients || !Array.isArray(recipients)) {
      return ApiResponse.error(res, "Título, mensagem e destinatários são obrigatórios", 400)
    }

    if (recipients.length === 0) {
      return ApiResponse.error(res, "Pelo menos um destinatário é obrigatório", 400)
    }

    // Validate recipients exist and belong to the same barbershop (for barbers)
    const validRecipients = []
    for (const recipientId of recipients) {
      const user = db.findById("users", recipientId)
      if (!user) continue

      // If recipient is barber, must belong to same barbershop
      if (user.role === "barber" && user.barbershopId !== req.user.barbershopId) {
        continue
      }

      validRecipients.push(recipientId)
    }

    if (validRecipients.length === 0) {
      return ApiResponse.error(res, "Nenhum destinatário válido encontrado", 400)
    }

    // Create notifications for all valid recipients
    const createdNotifications = []
    validRecipients.forEach((recipientId) => {
      const notification = db.create("notifications", {
        userId: recipientId,
        title: title.trim(),
        message: message.trim(),
        type,
        read: false,
        relatedId: null,
      })
      createdNotifications.push(notification)
    })

    return ApiResponse.success(
      res,
      {
        sent: createdNotifications.length,
        notifications: createdNotifications,
      },
      "Notificação enviada com sucesso",
      201,
    )
  } catch (error) {
    console.error("Send notification error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Remover notificação
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notificação removida com sucesso
 */
router.delete("/:id", authenticate, (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const notification = db.findById("notifications", id)

    if (!notification) {
      return ApiResponse.error(res, "Notificação não encontrada", 404)
    }

    // Check if notification belongs to user
    if (notification.userId !== userId) {
      return ApiResponse.error(res, "Acesso negado a esta notificação", 403)
    }

    // Delete notification
    const deleted = db.delete("notifications", id)

    if (!deleted) {
      return ApiResponse.error(res, "Erro ao remover notificação", 500)
    }

    return ApiResponse.success(res, null, "Notificação removida com sucesso")
  } catch (error) {
    console.error("Delete notification error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Obter estatísticas de notificações
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas de notificações
 */
router.get("/stats", authenticate, (req, res) => {
  try {
    const userId = req.user.id

    const notifications = db.findAllByField("notifications", "userId", userId)

    const stats = {
      total: notifications.length,
      unread: notifications.filter((notif) => !notif.read).length,
      byType: {
        appointment: notifications.filter((notif) => notif.type === "appointment").length,
        system: notifications.filter((notif) => notif.type === "system").length,
        barber_request: notifications.filter((notif) => notif.type === "barber_request").length,
        barber_approved: notifications.filter((notif) => notif.type === "barber_approved").length,
        barber_removed: notifications.filter((notif) => notif.type === "barber_removed").length,
      },
      recent: notifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
        .map((notif) => ({
          id: notif.id,
          title: notif.title,
          type: notif.type,
          read: notif.read,
          createdAt: notif.createdAt,
        })),
    }

    return ApiResponse.success(res, stats, "Estatísticas de notificações obtidas")
  } catch (error) {
    console.error("Get notification stats error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

module.exports = router
