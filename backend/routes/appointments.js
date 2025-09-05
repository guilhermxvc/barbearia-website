const express = require("express")
const { authenticate, authorize, checkBarbershopAccess, checkBarberAccess } = require("../middlewares/auth")
const {
  validate,
  validateAppointmentTime,
  validateServiceAccess,
  validateBarberAccess,
} = require("../middlewares/validation")
const { appointmentLimiter } = require("../middlewares/security")
const { auditLogger } = require("../middlewares/logging")
const db = require("../config/database")
const ApiResponse = require("../utils/response")

const router = express.Router()

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Criar novo agendamento
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - barberId
 *               - serviceId
 *               - date
 *               - time
 *             properties:
 *               barberId:
 *                 type: integer
 *               serviceId:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Agendamento criado com sucesso
 */
router.post(
  "/",
  authenticate,
  appointmentLimiter,
  validate("createAppointment"),
  validateServiceAccess,
  validateBarberAccess,
  validateAppointmentTime,
  auditLogger("CREATE_APPOINTMENT"),
  (req, res) => {
    try {
      const { barberId, serviceId, date, time, notes } = req.body
      const clientId = req.user.id

      // Get service and barber info
      const service = req.service
      const barber = req.barber

      // Create appointment
      const newAppointment = db.create("appointments", {
        clientId,
        barberId: Number.parseInt(barberId),
        barbershopId: barber.barbershopId,
        serviceId: Number.parseInt(serviceId),
        date,
        time,
        status: "pending",
        notes: notes || "",
        price: service.price,
      })

      // Get full appointment data with relations
      const appointmentWithDetails = {
        ...newAppointment,
        client: {
          id: req.user.id,
          name: req.user.name,
          phone: req.user.phone,
        },
        barber: {
          id: barber.id,
          name: barber.name,
        },
        service: {
          id: service.id,
          name: service.name,
          duration: service.duration,
          price: service.price,
        },
        barbershop: {
          id: barber.barbershopId,
          name: db.findById("barbershops", barber.barbershopId)?.name,
        },
      }

      // Create notification for barber
      db.create("notifications", {
        userId: barberId,
        title: "Novo agendamento",
        message: `${req.user.name} agendou ${service.name} para ${date} às ${time}`,
        type: "appointment",
        read: false,
        relatedId: newAppointment.id,
      })

      return ApiResponse.success(res, appointmentWithDetails, "Agendamento criado com sucesso", 201)
    } catch (error) {
      console.error("Create appointment error:", error)
      return ApiResponse.error(res, "Erro interno do servidor", 500)
    }
  },
)

/**
 * @swagger
 * /api/appointments/user:
 *   get:
 *     summary: Obter agendamentos do usuário logado
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, in-progress, completed, cancelled, no-show]
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
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
 *         description: Lista de agendamentos do usuário
 */
router.get("/user", authenticate, (req, res) => {
  try {
    const { status, date, page = 1, limit = 10 } = req.query
    const userId = req.user.id

    // Get appointments based on user role
    let appointments = []

    if (req.user.role === "client") {
      appointments = db.findAllByField("appointments", "clientId", userId)
    } else if (req.user.role === "barber") {
      appointments = db.findAllByField("appointments", "barberId", userId)
    } else if (req.user.role === "manager") {
      appointments = db.findAllByField("appointments", "barbershopId", req.user.barbershopId)
    }

    // Apply filters
    if (status) {
      appointments = appointments.filter((apt) => apt.status === status)
    }

    if (date) {
      appointments = appointments.filter((apt) => apt.date === date)
    }

    // Sort by date and time (newest first)
    appointments.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`)
      const dateTimeB = new Date(`${b.date}T${b.time}`)
      return dateTimeB - dateTimeA
    })

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + Number.parseInt(limit)
    const paginatedAppointments = appointments.slice(startIndex, endIndex)

    // Add related data
    const appointmentsWithDetails = paginatedAppointments.map((appointment) => {
      const client = db.findById("users", appointment.clientId)
      const barber = db.findById("users", appointment.barberId)
      const service = db.findById("services", appointment.serviceId)
      const barbershop = db.findById("barbershops", appointment.barbershopId)

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
              address: barbershop.address,
            }
          : null,
      }
    })

    return ApiResponse.paginated(
      res,
      appointmentsWithDetails,
      {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total: appointments.length,
      },
      "Agendamentos obtidos com sucesso",
    )
  } catch (error) {
    console.error("Get user appointments error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/appointments/barber/{barberId}:
 *   get:
 *     summary: Obter agendamentos de um barbeiro específico
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: barberId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Agendamentos do barbeiro
 */
router.get("/barber/:barberId", authenticate, authorize("barber", "manager"), checkBarberAccess, (req, res) => {
  try {
    const { barberId } = req.params
    const { date } = req.query

    let appointments = db.findAllByField("appointments", "barberId", Number.parseInt(barberId))

    // Filter by date if provided
    if (date) {
      appointments = appointments.filter((apt) => apt.date === date)
    }

    // Sort by time
    appointments.sort((a, b) => {
      const timeA = a.time.split(":").map(Number)
      const timeB = b.time.split(":").map(Number)
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1])
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

    return ApiResponse.success(res, appointmentsWithDetails, "Agendamentos do barbeiro obtidos")
  } catch (error) {
    console.error("Get barber appointments error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/appointments/barbershop/{barbershopId}:
 *   get:
 *     summary: Obter todos agendamentos da barbearia
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: barbershopId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agendamentos da barbearia
 */
router.get("/barbershop/:barbershopId", authenticate, authorize("manager"), checkBarbershopAccess, (req, res) => {
  try {
    const { barbershopId } = req.params
    const { date, status } = req.query

    let appointments = db.findAllByField("appointments", "barbershopId", Number.parseInt(barbershopId))

    // Apply filters
    if (date) {
      appointments = appointments.filter((apt) => apt.date === date)
    }

    if (status) {
      appointments = appointments.filter((apt) => apt.status === status)
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
      const barber = db.findById("users", appointment.barberId)
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
      }
    })

    return ApiResponse.success(res, appointmentsWithDetails, "Agendamentos da barbearia obtidos")
  } catch (error) {
    console.error("Get barbershop appointments error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/appointments/{id}/status:
 *   put:
 *     summary: Atualizar status do agendamento
 *     tags: [Appointments]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, in-progress, completed, cancelled, no-show]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 */
router.put(
  "/:id/status",
  authenticate,
  authorize("barber", "manager"),
  validate("updateAppointmentStatus"),
  auditLogger("UPDATE_APPOINTMENT_STATUS"),
  (req, res) => {
    try {
      const { id } = req.params
      const { status, notes } = req.body

      const appointment = db.findById("appointments", id)

      if (!appointment) {
        return ApiResponse.error(res, "Agendamento não encontrado", 404)
      }

      // Check permissions
      if (req.user.role === "barber" && appointment.barberId !== req.user.id) {
        return ApiResponse.error(res, "Acesso negado a este agendamento", 403)
      }

      if (req.user.role === "manager" && appointment.barbershopId !== req.user.barbershopId) {
        return ApiResponse.error(res, "Acesso negado a este agendamento", 403)
      }

      // Update appointment
      const updatedAppointment = db.update("appointments", id, {
        status,
        ...(notes && { notes }),
      })

      // Create notification for client
      const client = db.findById("users", appointment.clientId)
      const service = db.findById("services", appointment.serviceId)

      if (client && service) {
        const statusMessages = {
          confirmed: "confirmado",
          "in-progress": "iniciado",
          completed: "concluído",
          cancelled: "cancelado",
          "no-show": "marcado como não compareceu",
        }

        db.create("notifications", {
          userId: client.id,
          title: "Status do agendamento atualizado",
          message: `Seu agendamento de ${service.name} foi ${statusMessages[status]}`,
          type: "appointment",
          read: false,
          relatedId: appointment.id,
        })
      }

      return ApiResponse.success(res, updatedAppointment, "Status atualizado com sucesso")
    } catch (error) {
      console.error("Update appointment status error:", error)
      return ApiResponse.error(res, "Erro interno do servidor", 500)
    }
  },
)

/**
 * @swagger
 * /api/appointments/{id}/reschedule:
 *   put:
 *     summary: Reagendar agendamento
 *     tags: [Appointments]
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
 *               - date
 *               - time
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               barberId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Agendamento reagendado com sucesso
 */
router.put("/:id/reschedule", authenticate, auditLogger("RESCHEDULE_APPOINTMENT"), (req, res) => {
  try {
    const { id } = req.params
    const { date, time, barberId } = req.body

    const appointment = db.findById("appointments", id)

    if (!appointment) {
      return ApiResponse.error(res, "Agendamento não encontrado", 404)
    }

    // Check permissions - client can reschedule their own, barber/manager can reschedule any in their barbershop
    if (req.user.role === "client" && appointment.clientId !== req.user.id) {
      return ApiResponse.error(res, "Acesso negado a este agendamento", 403)
    }

    if (["barber", "manager"].includes(req.user.role) && appointment.barbershopId !== req.user.barbershopId) {
      return ApiResponse.error(res, "Acesso negado a este agendamento", 403)
    }

    // Validate new date/time
    const appointmentDateTime = new Date(`${date}T${time}`)
    const now = new Date()

    if (appointmentDateTime <= now) {
      return ApiResponse.error(res, "Não é possível reagendar para data/hora passada", 400)
    }

    // Check for conflicts
    const targetBarberId = barberId || appointment.barberId
    const existingAppointment = db.appointments.find(
      (apt) =>
        apt.id !== Number.parseInt(id) &&
        apt.barberId === targetBarberId &&
        apt.date === date &&
        apt.time === time &&
        apt.status !== "cancelled",
    )

    if (existingAppointment) {
      return ApiResponse.error(res, "Horário já ocupado", 409)
    }

    // Update appointment
    const updatedAppointment = db.update("appointments", id, {
      date,
      time,
      ...(barberId && { barberId: Number.parseInt(barberId) }),
      status: "pending", // Reset to pending when rescheduled
    })

    // Create notifications
    const client = db.findById("users", appointment.clientId)
    const barber = db.findById("users", targetBarberId)
    const service = db.findById("services", appointment.serviceId)

    if (client && barber && service) {
      // Notify client
      db.create("notifications", {
        userId: client.id,
        title: "Agendamento reagendado",
        message: `Seu agendamento de ${service.name} foi reagendado para ${date} às ${time}`,
        type: "appointment",
        read: false,
        relatedId: appointment.id,
      })

      // Notify barber (if different from who made the change)
      if (req.user.id !== barber.id) {
        db.create("notifications", {
          userId: barber.id,
          title: "Agendamento reagendado",
          message: `Agendamento de ${client.name} foi reagendado para ${date} às ${time}`,
          type: "appointment",
          read: false,
          relatedId: appointment.id,
        })
      }
    }

    return ApiResponse.success(res, updatedAppointment, "Agendamento reagendado com sucesso")
  } catch (error) {
    console.error("Reschedule appointment error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/appointments/{id}:
 *   delete:
 *     summary: Cancelar agendamento
 *     tags: [Appointments]
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
 *         description: Agendamento cancelado com sucesso
 */
router.delete("/:id", authenticate, auditLogger("CANCEL_APPOINTMENT"), (req, res) => {
  try {
    const { id } = req.params

    const appointment = db.findById("appointments", id)

    if (!appointment) {
      return ApiResponse.error(res, "Agendamento não encontrado", 404)
    }

    // Check permissions
    if (req.user.role === "client" && appointment.clientId !== req.user.id) {
      return ApiResponse.error(res, "Acesso negado a este agendamento", 403)
    }

    if (["barber", "manager"].includes(req.user.role) && appointment.barbershopId !== req.user.barbershopId) {
      return ApiResponse.error(res, "Acesso negado a este agendamento", 403)
    }

    // Check if appointment can be cancelled (not in the past or already completed)
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`)
    const now = new Date()

    if (appointmentDateTime <= now && appointment.status !== "pending") {
      return ApiResponse.error(res, "Não é possível cancelar agendamento passado ou em andamento", 400)
    }

    // Update status to cancelled instead of deleting
    const updatedAppointment = db.update("appointments", id, {
      status: "cancelled",
    })

    // Create notifications
    const client = db.findById("users", appointment.clientId)
    const barber = db.findById("users", appointment.barberId)
    const service = db.findById("services", appointment.serviceId)

    if (client && barber && service) {
      // Notify the other party
      const notifyUserId = req.user.id === client.id ? barber.id : client.id
      const notifyUserName = req.user.id === client.id ? client.name : "A barbearia"

      db.create("notifications", {
        userId: notifyUserId,
        title: "Agendamento cancelado",
        message: `${notifyUserName} cancelou o agendamento de ${service.name} para ${appointment.date} às ${appointment.time}`,
        type: "appointment",
        read: false,
        relatedId: appointment.id,
      })
    }

    return ApiResponse.success(res, updatedAppointment, "Agendamento cancelado com sucesso")
  } catch (error) {
    console.error("Cancel appointment error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/appointments/availability:
 *   get:
 *     summary: Verificar disponibilidade de horários
 *     tags: [Appointments]
 *     parameters:
 *       - in: query
 *         name: barberId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Horários disponíveis
 */
router.get("/availability", (req, res) => {
  try {
    const { barberId, date, serviceId } = req.query

    if (!barberId || !date) {
      return ApiResponse.error(res, "barberId e date são obrigatórios", 400)
    }

    // Get barber
    const barber = db.findById("users", barberId)
    if (!barber || barber.role !== "barber") {
      return ApiResponse.error(res, "Barbeiro não encontrado", 404)
    }

    // Get barbershop working hours
    const barbershop = db.findById("barbershops", barber.barbershopId)
    if (!barbershop) {
      return ApiResponse.error(res, "Barbearia não encontrada", 404)
    }

    // Get day of week
    const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "lowercase" })
    const workingHours = barbershop.workingHours[dayOfWeek]

    if (!workingHours || workingHours.closed) {
      return ApiResponse.success(res, [], "Barbeiro não trabalha neste dia")
    }

    // Get service duration
    let serviceDuration = 30 // default
    if (serviceId) {
      const service = db.findById("services", serviceId)
      if (service) {
        serviceDuration = service.duration
      }
    }

    // Generate time slots
    const startTime = workingHours.start
    const endTime = workingHours.end
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    const timeSlots = []
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      const timeSlot = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
      timeSlots.push(timeSlot)
    }

    // Get existing appointments for this barber on this date
    const existingAppointments = db.appointments.filter(
      (apt) => apt.barberId === Number.parseInt(barberId) && apt.date === date && apt.status !== "cancelled",
    )

    // Filter out occupied slots
    const availableSlots = timeSlots.filter((slot) => {
      return !existingAppointments.some((apt) => apt.time === slot)
    })

    // Check if slots are in the future (for today's date)
    const today = new Date().toISOString().split("T")[0]
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const futureSlots = availableSlots.filter((slot) => {
      if (date !== today) return true // Future dates are always valid

      const [hours, minutes] = slot.split(":").map(Number)
      const slotMinutes = hours * 60 + minutes
      return slotMinutes > currentMinutes + 30 // At least 30 minutes in advance
    })

    return ApiResponse.success(res, futureSlots, "Horários disponíveis obtidos")
  } catch (error) {
    console.error("Get availability error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/appointments/stats:
 *   get:
 *     summary: Obter estatísticas de agendamentos
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month]
 *           default: today
 *     responses:
 *       200:
 *         description: Estatísticas de agendamentos
 */
router.get("/stats", authenticate, authorize("barber", "manager"), (req, res) => {
  try {
    const { period = "today" } = req.query

    // Get date range based on period
    const now = new Date()
    let startDate, endDate

    switch (period) {
      case "today":
        startDate = endDate = now.toISOString().split("T")[0]
        break
      case "week":
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        startDate = weekStart.toISOString().split("T")[0]
        endDate = now.toISOString().split("T")[0]
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
        endDate = now.toISOString().split("T")[0]
        break
      default:
        startDate = endDate = now.toISOString().split("T")[0]
    }

    // Get appointments based on user role
    let appointments = []

    if (req.user.role === "barber") {
      appointments = db.findAllByField("appointments", "barberId", req.user.id)
    } else if (req.user.role === "manager") {
      appointments = db.findAllByField("appointments", "barbershopId", req.user.barbershopId)
    }

    // Filter by date range
    appointments = appointments.filter((apt) => apt.date >= startDate && apt.date <= endDate)

    // Calculate stats
    const stats = {
      total: appointments.length,
      pending: appointments.filter((apt) => apt.status === "pending").length,
      confirmed: appointments.filter((apt) => apt.status === "confirmed").length,
      inProgress: appointments.filter((apt) => apt.status === "in-progress").length,
      completed: appointments.filter((apt) => apt.status === "completed").length,
      cancelled: appointments.filter((apt) => apt.status === "cancelled").length,
      noShow: appointments.filter((apt) => apt.status === "no-show").length,
      revenue: appointments.filter((apt) => apt.status === "completed").reduce((sum, apt) => sum + apt.price, 0),
    }

    return ApiResponse.success(res, stats, "Estatísticas obtidas com sucesso")
  } catch (error) {
    console.error("Get appointment stats error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

module.exports = router
