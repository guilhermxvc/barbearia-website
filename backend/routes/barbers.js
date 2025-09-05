const express = require("express")
const { authenticate, authorize, checkBarbershopAccess } = require("../middlewares/auth")
const { auditLogger } = require("../middlewares/logging")
const db = require("../config/database")
const ApiResponse = require("../utils/response")

const router = express.Router()

/**
 * @swagger
 * /api/barbers:
 *   get:
 *     summary: Listar barbeiros
 *     tags: [Barbers]
 *     parameters:
 *       - in: query
 *         name: barbershopId
 *         schema:
 *           type: integer
 *         description: ID da barbearia
 *     responses:
 *       200:
 *         description: Lista de barbeiros
 */
router.get("/", (req, res) => {
  try {
    const { barbershopId } = req.query

    let barbers = db.users.filter((user) => user.role === "barber")

    // Filter by barbershop if specified
    if (barbershopId) {
      barbers = barbers.filter((barber) => barber.barbershopId === Number.parseInt(barbershopId))
    }

    // Remove sensitive data and add stats
    const barbersWithStats = barbers.map((barber) => {
      const { password, ...safeBarber } = barber

      // Get barber stats
      const appointments = db.findAllByField("appointments", "barberId", barber.id)
      const completedAppointments = appointments.filter((apt) => apt.status === "completed")

      // Calculate average rating (mock data)
      const avgRating = 4.5 + Math.random() * 0.5 // Mock rating between 4.5-5.0

      return {
        ...safeBarber,
        stats: {
          totalAppointments: appointments.length,
          completedAppointments: completedAppointments.length,
          avgRating: Math.round(avgRating * 10) / 10,
          totalRevenue: completedAppointments.reduce((sum, apt) => sum + apt.price, 0),
        },
      }
    })

    // Sort by name
    barbersWithStats.sort((a, b) => a.name.localeCompare(b.name))

    return ApiResponse.success(res, barbersWithStats, "Barbeiros obtidos com sucesso")
  } catch (error) {
    console.error("Get barbers error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/barbers/{id}:
 *   get:
 *     summary: Obter barbeiro por ID
 *     tags: [Barbers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do barbeiro
 */
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params
    const barber = db.findById("users", id)

    if (!barber || barber.role !== "barber") {
      return ApiResponse.error(res, "Barbeiro não encontrado", 404)
    }

    // Remove sensitive data
    const { password, ...safeBarber } = barber

    // Get barbershop info
    const barbershop = db.findById("barbershops", barber.barbershopId)

    // Get barber stats
    const appointments = db.findAllByField("appointments", "barberId", barber.id)
    const completedAppointments = appointments.filter((apt) => apt.status === "completed")

    // Get recent appointments
    const recentAppointments = appointments
      .sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`))
      .slice(0, 5)
      .map((apt) => {
        const client = db.findById("users", apt.clientId)
        const service = db.findById("services", apt.serviceId)

        return {
          ...apt,
          client: client ? { id: client.id, name: client.name } : null,
          service: service ? { id: service.id, name: service.name } : null,
        }
      })

    const barberDetails = {
      ...safeBarber,
      barbershop: barbershop
        ? {
            id: barbershop.id,
            name: barbershop.name,
            address: barbershop.address,
          }
        : null,
      stats: {
        totalAppointments: appointments.length,
        completedAppointments: completedAppointments.length,
        pendingAppointments: appointments.filter((apt) => apt.status === "pending").length,
        avgRating: 4.5 + Math.random() * 0.5, // Mock rating
        totalRevenue: completedAppointments.reduce((sum, apt) => sum + apt.price, 0),
      },
      recentAppointments,
    }

    return ApiResponse.success(res, barberDetails, "Barbeiro obtido com sucesso")
  } catch (error) {
    console.error("Get barber error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/barbers/request:
 *   post:
 *     summary: Solicitar vinculação à barbearia (apenas barbeiros)
 *     tags: [Barbers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - barbershopCode
 *             properties:
 *               barbershopCode:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Solicitação enviada com sucesso
 */
router.post("/request", authenticate, authorize("barber"), auditLogger("REQUEST_BARBERSHOP_LINK"), (req, res) => {
  try {
    const { barbershopCode, message } = req.body

    if (!barbershopCode) {
      return ApiResponse.error(res, "Código da barbearia é obrigatório", 400)
    }

    // Check if barber is already linked to a barbershop
    if (req.user.barbershopId) {
      return ApiResponse.error(res, "Você já está vinculado a uma barbearia", 400)
    }

    // Find barbershop by code
    const barbershop = db.findByField("barbershops", "code", barbershopCode.toUpperCase())

    if (!barbershop) {
      return ApiResponse.error(res, "Código da barbearia inválido", 404)
    }

    // Get barbershop manager
    const manager = db.users.find((user) => user.role === "manager" && user.barbershopId === barbershop.id)

    if (!manager) {
      return ApiResponse.error(res, "Gerente da barbearia não encontrado", 404)
    }

    // Create notification for manager
    db.create("notifications", {
      userId: manager.id,
      title: "Nova solicitação de barbeiro",
      message: `${req.user.name} solicitou vinculação à barbearia. ${message || ""}`,
      type: "barber_request",
      read: false,
      relatedId: req.user.id,
    })

    return ApiResponse.success(
      res,
      {
        barbershop: {
          id: barbershop.id,
          name: barbershop.name,
          address: barbershop.address,
        },
      },
      "Solicitação enviada com sucesso",
    )
  } catch (error) {
    console.error("Request barbershop link error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/barbers/approve/{id}:
 *   put:
 *     summary: Aprovar barbeiro (apenas managers)
 *     tags: [Barbers]
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
 *         description: Barbeiro aprovado com sucesso
 */
router.put("/approve/:id", authenticate, authorize("manager"), auditLogger("APPROVE_BARBER"), (req, res) => {
  try {
    const { id } = req.params

    const barber = db.findById("users", id)

    if (!barber || barber.role !== "barber") {
      return ApiResponse.error(res, "Barbeiro não encontrado", 404)
    }

    // Check if barber is already linked to a barbershop
    if (barber.barbershopId) {
      return ApiResponse.error(res, "Barbeiro já está vinculado a uma barbearia", 400)
    }

    // Link barber to barbershop
    const updatedBarber = db.update("users", id, {
      barbershopId: req.user.barbershopId,
    })

    // Create notification for barber
    const barbershop = db.findById("barbershops", req.user.barbershopId)

    db.create("notifications", {
      userId: barber.id,
      title: "Solicitação aprovada",
      message: `Sua solicitação para trabalhar na ${barbershop.name} foi aprovada!`,
      type: "barber_approved",
      read: false,
      relatedId: req.user.barbershopId,
    })

    // Remove sensitive data
    const { password, ...safeBarber } = updatedBarber

    return ApiResponse.success(res, safeBarber, "Barbeiro aprovado com sucesso")
  } catch (error) {
    console.error("Approve barber error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/barbers/{id}:
 *   delete:
 *     summary: Remover barbeiro da barbearia (apenas managers)
 *     tags: [Barbers]
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
 *         description: Barbeiro removido com sucesso
 */
router.delete("/:id", authenticate, authorize("manager"), auditLogger("REMOVE_BARBER"), (req, res) => {
  try {
    const { id } = req.params

    const barber = db.findById("users", id)

    if (!barber || barber.role !== "barber") {
      return ApiResponse.error(res, "Barbeiro não encontrado", 404)
    }

    // Check if barber belongs to user's barbershop
    if (barber.barbershopId !== req.user.barbershopId) {
      return ApiResponse.error(res, "Barbeiro não pertence a esta barbearia", 403)
    }

    // Check for active appointments
    const activeAppointments = db.appointments.filter(
      (apt) => apt.barberId === Number.parseInt(id) && ["pending", "confirmed", "in-progress"].includes(apt.status),
    )

    if (activeAppointments.length > 0) {
      return ApiResponse.error(res, "Não é possível remover barbeiro com agendamentos ativos", 400)
    }

    // Remove barber from barbershop (unlink, don't delete user)
    const updatedBarber = db.update("users", id, {
      barbershopId: null,
    })

    // Create notification for barber
    const barbershop = db.findById("barbershops", req.user.barbershopId)

    db.create("notifications", {
      userId: barber.id,
      title: "Removido da barbearia",
      message: `Você foi removido da ${barbershop.name}`,
      type: "barber_removed",
      read: false,
      relatedId: req.user.barbershopId,
    })

    return ApiResponse.success(res, null, "Barbeiro removido da barbearia com sucesso")
  } catch (error) {
    console.error("Remove barber error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/barbers/{id}/schedule:
 *   get:
 *     summary: Obter agenda do barbeiro
 *     tags: [Barbers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: week
 *         schema:
 *           type: boolean
 *         description: Obter agenda da semana
 *     responses:
 *       200:
 *         description: Agenda do barbeiro
 */
router.get("/:id/schedule", (req, res) => {
  try {
    const { id } = req.params
    const { date, week } = req.query

    const barber = db.findById("users", id)

    if (!barber || barber.role !== "barber") {
      return ApiResponse.error(res, "Barbeiro não encontrado", 404)
    }

    let appointments = db.findAllByField("appointments", "barberId", Number.parseInt(id))

    // Filter by date or week
    if (date) {
      appointments = appointments.filter((apt) => apt.date === date)
    } else if (week === "true") {
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      const startDate = startOfWeek.toISOString().split("T")[0]
      const endDate = endOfWeek.toISOString().split("T")[0]

      appointments = appointments.filter((apt) => apt.date >= startDate && apt.date <= endDate)
    }

    // Sort by date and time
    appointments.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`)
      const dateTimeB = new Date(`${b.date}T${b.time}`)
      return dateTimeA - dateTimeB
    })

    // Add related data
    const appointmentsWithDetails = appointments.map((appointment) => {
      const client = db.findById("users", appointment.clientId)
      const service = db.findById("services", appointment.serviceId)

      return {
        ...appointment,
        client: client
          ? {
              id: client.id,
              name: client.name,
              phone: client.phone,
              avatar: client.avatar,
            }
          : null,
        service: service
          ? {
              id: service.id,
              name: service.name,
              duration: service.duration,
              price: service.price,
            }
          : null,
      }
    })

    return ApiResponse.success(res, appointmentsWithDetails, "Agenda do barbeiro obtida")
  } catch (error) {
    console.error("Get barber schedule error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

module.exports = router
