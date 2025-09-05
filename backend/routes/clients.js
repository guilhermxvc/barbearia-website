const express = require("express")
const { authenticate, authorize } = require("../middlewares/auth")
const { auditLogger } = require("../middlewares/logging")
const db = require("../config/database")
const ApiResponse = require("../utils/response")

const router = express.Router()

/**
 * @swagger
 * /api/clients/barber:
 *   get:
 *     summary: Obter clientes do barbeiro (apenas barbeiros)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou telefone
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de clientes do barbeiro
 */
router.get("/barber", authenticate, authorize("barber"), (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query
    const barberId = req.user.id

    // Get unique clients who had appointments with this barber
    const appointments = db.findAllByField("appointments", "barberId", barberId)
    const clientIds = [...new Set(appointments.map((apt) => apt.clientId))]

    let clients = clientIds
      .map((clientId) => db.findById("users", clientId))
      .filter((client) => client && client.role === "client")

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      clients = clients.filter(
        (client) => client.name.toLowerCase().includes(searchLower) || client.phone.includes(search),
      )
    }

    // Add client stats
    const clientsWithStats = clients.map((client) => {
      const clientAppointments = appointments.filter((apt) => apt.clientId === client.id)
      const completedAppointments = clientAppointments.filter((apt) => apt.status === "completed")
      const lastAppointment = clientAppointments.sort(
        (a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`),
      )[0]

      // Remove sensitive data
      const { password, ...safeClient } = client

      return {
        ...safeClient,
        stats: {
          totalAppointments: clientAppointments.length,
          completedAppointments: completedAppointments.length,
          totalSpent: completedAppointments.reduce((sum, apt) => sum + apt.price, 0),
          lastAppointment: lastAppointment
            ? {
                date: lastAppointment.date,
                time: lastAppointment.time,
                service: db.findById("services", lastAppointment.serviceId)?.name,
              }
            : null,
        },
      }
    })

    // Sort by total appointments (best clients first)
    clientsWithStats.sort((a, b) => b.stats.totalAppointments - a.stats.totalAppointments)

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + Number.parseInt(limit)
    const paginatedClients = clientsWithStats.slice(startIndex, endIndex)

    return ApiResponse.paginated(
      res,
      paginatedClients,
      {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total: clientsWithStats.length,
      },
      "Clientes obtidos com sucesso",
    )
  } catch (error) {
    console.error("Get barber clients error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/clients/{id}/history:
 *   get:
 *     summary: Obter histórico do cliente
 *     tags: [Clients]
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
 *         description: Histórico do cliente
 */
router.get("/:id/history", authenticate, authorize("barber", "manager"), (req, res) => {
  try {
    const { id } = req.params

    const client = db.findById("users", id)

    if (!client || client.role !== "client") {
      return ApiResponse.error(res, "Cliente não encontrado", 404)
    }

    // Get client appointments
    let appointments = db.findAllByField("appointments", "clientId", Number.parseInt(id))

    // Filter by barber if user is barber
    if (req.user.role === "barber") {
      appointments = appointments.filter((apt) => apt.barberId === req.user.id)
    }
    // Filter by barbershop if user is manager
    else if (req.user.role === "manager") {
      appointments = appointments.filter((apt) => apt.barbershopId === req.user.barbershopId)
    }

    // Sort by date (newest first)
    appointments.sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`))

    // Add related data
    const appointmentsWithDetails = appointments.map((appointment) => {
      const barber = db.findById("users", appointment.barberId)
      const service = db.findById("services", appointment.serviceId)
      const barbershop = db.findById("barbershops", appointment.barbershopId)

      return {
        ...appointment,
        barber: barber
          ? {
              id: barber.id,
              name: barber.name,
              avatar: barber.avatar,
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
        barbershop: barbershop
          ? {
              id: barbershop.id,
              name: barbershop.name,
            }
          : null,
      }
    })

    // Calculate client stats
    const completedAppointments = appointments.filter((apt) => apt.status === "completed")
    const stats = {
      totalAppointments: appointments.length,
      completedAppointments: completedAppointments.length,
      cancelledAppointments: appointments.filter((apt) => apt.status === "cancelled").length,
      totalSpent: completedAppointments.reduce((sum, apt) => sum + apt.price, 0),
      favoriteService: null,
      favoriteBarber: null,
    }

    // Find favorite service
    if (completedAppointments.length > 0) {
      const serviceCount = {}
      completedAppointments.forEach((apt) => {
        const service = db.findById("services", apt.serviceId)
        if (service) {
          serviceCount[service.name] = (serviceCount[service.name] || 0) + 1
        }
      })

      const mostUsedService = Object.entries(serviceCount).sort(([, a], [, b]) => b - a)[0]

      if (mostUsedService) {
        stats.favoriteService = mostUsedService[0]
      }
    }

    // Find favorite barber
    if (completedAppointments.length > 0) {
      const barberCount = {}
      completedAppointments.forEach((apt) => {
        const barber = db.findById("users", apt.barberId)
        if (barber) {
          barberCount[barber.name] = (barberCount[barber.name] || 0) + 1
        }
      })

      const mostUsedBarber = Object.entries(barberCount).sort(([, a], [, b]) => b - a)[0]

      if (mostUsedBarber) {
        stats.favoriteBarber = mostUsedBarber[0]
      }
    }

    // Remove sensitive client data
    const { password, ...safeClient } = client

    return ApiResponse.success(
      res,
      {
        client: safeClient,
        stats,
        appointments: appointmentsWithDetails,
      },
      "Histórico do cliente obtido",
    )
  } catch (error) {
    console.error("Get client history error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/clients/{id}/notes:
 *   put:
 *     summary: Atualizar observações do cliente (apenas barbeiros)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notes
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Observações atualizadas com sucesso
 */
router.put("/:id/notes", authenticate, authorize("barber"), auditLogger("UPDATE_CLIENT_NOTES"), (req, res) => {
  try {
    const { id } = req.params
    const { notes } = req.body

    const client = db.findById("users", id)

    if (!client || client.role !== "client") {
      return ApiResponse.error(res, "Cliente não encontrado", 404)
    }

    // Check if barber has had appointments with this client
    const hasAppointments = db.appointments.some(
      (apt) => apt.clientId === Number.parseInt(id) && apt.barberId === req.user.id,
    )

    if (!hasAppointments) {
      return ApiResponse.error(res, "Você não tem histórico com este cliente", 403)
    }

    // In a real app, you'd have a separate client_notes table
    // For this mock, we'll store it in a mock way
    console.log(`[CLIENT_NOTES] Barber ${req.user.id} updated notes for client ${id}: ${notes}`)

    return ApiResponse.success(res, { notes }, "Observações atualizadas com sucesso")
  } catch (error) {
    console.error("Update client notes error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

module.exports = router
