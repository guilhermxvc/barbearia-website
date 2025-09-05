const express = require("express")
const { authenticate, authorize } = require("../middlewares/auth")
const { auditLogger } = require("../middlewares/logging")
const db = require("../config/database")
const ApiResponse = require("../utils/response")

const router = express.Router()

/**
 * @swagger
 * /api/reports/revenue:
 *   get:
 *     summary: Relatório de faturamento (apenas managers)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year, custom]
 *           default: month
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Relatório de faturamento
 */
router.get("/revenue", authenticate, authorize("manager"), (req, res) => {
  try {
    const { period = "month", startDate, endDate } = req.query
    const barbershopId = req.user.barbershopId

    // Calculate date range
    const now = new Date()
    let start, end

    switch (period) {
      case "today":
        start = end = now.toISOString().split("T")[0]
        break
      case "week":
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        start = weekStart.toISOString().split("T")[0]
        end = now.toISOString().split("T")[0]
        break
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
        end = now.toISOString().split("T")[0]
        break
      case "year":
        start = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
        end = now.toISOString().split("T")[0]
        break
      case "custom":
        if (!startDate || !endDate) {
          return ApiResponse.error(res, "startDate e endDate são obrigatórios para período customizado", 400)
        }
        start = startDate
        end = endDate
        break
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
        end = now.toISOString().split("T")[0]
    }

    // Get completed appointments in date range
    const appointments = db
      .findAllByField("appointments", "barbershopId", barbershopId)
      .filter((apt) => apt.status === "completed" && apt.date >= start && apt.date <= end)

    // Calculate revenue metrics
    const totalRevenue = appointments.reduce((sum, apt) => sum + apt.price, 0)
    const totalAppointments = appointments.length
    const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0

    // Revenue by service
    const revenueByService = {}
    appointments.forEach((apt) => {
      const service = db.findById("services", apt.serviceId)
      if (service) {
        if (!revenueByService[service.name]) {
          revenueByService[service.name] = { count: 0, revenue: 0 }
        }
        revenueByService[service.name].count++
        revenueByService[service.name].revenue += apt.price
      }
    })

    // Revenue by barber
    const revenueByBarber = {}
    appointments.forEach((apt) => {
      const barber = db.findById("users", apt.barberId)
      if (barber) {
        if (!revenueByBarber[barber.name]) {
          revenueByBarber[barber.name] = { count: 0, revenue: 0 }
        }
        revenueByBarber[barber.name].count++
        revenueByBarber[barber.name].revenue += apt.price
      }
    })

    // Daily revenue (for charts)
    const dailyRevenue = {}
    appointments.forEach((apt) => {
      if (!dailyRevenue[apt.date]) {
        dailyRevenue[apt.date] = 0
      }
      dailyRevenue[apt.date] += apt.price
    })

    // Convert to array and sort by date
    const dailyRevenueArray = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    // Calculate growth (compare with previous period)
    let growth = 0
    if (period !== "custom") {
      const periodDays = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1
      const prevStart = new Date(start)
      prevStart.setDate(prevStart.getDate() - periodDays)
      const prevEnd = new Date(start)
      prevEnd.setDate(prevEnd.getDate() - 1)

      const prevAppointments = db
        .findAllByField("appointments", "barbershopId", barbershopId)
        .filter(
          (apt) =>
            apt.status === "completed" &&
            apt.date >= prevStart.toISOString().split("T")[0] &&
            apt.date <= prevEnd.toISOString().split("T")[0],
        )

      const prevRevenue = prevAppointments.reduce((sum, apt) => sum + apt.price, 0)

      if (prevRevenue > 0) {
        growth = ((totalRevenue - prevRevenue) / prevRevenue) * 100
      }
    }

    const report = {
      period: {
        type: period,
        startDate: start,
        endDate: end,
      },
      summary: {
        totalRevenue,
        totalAppointments,
        averageTicket: Math.round(averageTicket * 100) / 100,
        growth: Math.round(growth * 100) / 100,
      },
      revenueByService: Object.entries(revenueByService)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue),
      revenueByBarber: Object.entries(revenueByBarber)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue),
      dailyRevenue: dailyRevenueArray,
    }

    return ApiResponse.success(res, report, "Relatório de faturamento gerado")
  } catch (error) {
    console.error("Revenue report error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/reports/appointments:
 *   get:
 *     summary: Relatório de agendamentos (apenas managers)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Relatório de agendamentos
 */
router.get("/appointments", authenticate, authorize("manager"), (req, res) => {
  try {
    const { period = "month" } = req.query
    const barbershopId = req.user.barbershopId

    // Calculate date range
    const now = new Date()
    let start, end

    switch (period) {
      case "today":
        start = end = now.toISOString().split("T")[0]
        break
      case "week":
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        start = weekStart.toISOString().split("T")[0]
        end = now.toISOString().split("T")[0]
        break
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
        end = now.toISOString().split("T")[0]
        break
      case "year":
        start = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
        end = now.toISOString().split("T")[0]
        break
    }

    // Get appointments in date range
    const appointments = db
      .findAllByField("appointments", "barbershopId", barbershopId)
      .filter((apt) => apt.date >= start && apt.date <= end)

    // Calculate metrics
    const total = appointments.length
    const byStatus = {
      pending: appointments.filter((apt) => apt.status === "pending").length,
      confirmed: appointments.filter((apt) => apt.status === "confirmed").length,
      inProgress: appointments.filter((apt) => apt.status === "in-progress").length,
      completed: appointments.filter((apt) => apt.status === "completed").length,
      cancelled: appointments.filter((apt) => apt.status === "cancelled").length,
      noShow: appointments.filter((apt) => apt.status === "no-show").length,
    }

    // Completion rate
    const completionRate = total > 0 ? (byStatus.completed / total) * 100 : 0
    const cancellationRate = total > 0 ? ((byStatus.cancelled + byStatus.noShow) / total) * 100 : 0

    // Appointments by hour
    const appointmentsByHour = {}
    appointments.forEach((apt) => {
      const hour = apt.time.split(":")[0]
      appointmentsByHour[hour] = (appointmentsByHour[hour] || 0) + 1
    })

    // Appointments by day of week
    const appointmentsByDayOfWeek = {}
    appointments.forEach((apt) => {
      const dayOfWeek = new Date(apt.date).toLocaleDateString("pt-BR", { weekday: "long" })
      appointmentsByDayOfWeek[dayOfWeek] = (appointmentsByDayOfWeek[dayOfWeek] || 0) + 1
    })

    // Most popular services
    const serviceCount = {}
    appointments.forEach((apt) => {
      const service = db.findById("services", apt.serviceId)
      if (service) {
        serviceCount[service.name] = (serviceCount[service.name] || 0) + 1
      }
    })

    const report = {
      period: {
        type: period,
        startDate: start,
        endDate: end,
      },
      summary: {
        total,
        completionRate: Math.round(completionRate * 100) / 100,
        cancellationRate: Math.round(cancellationRate * 100) / 100,
      },
      byStatus,
      appointmentsByHour: Object.entries(appointmentsByHour)
        .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
        .sort((a, b) => Number.parseInt(a.hour) - Number.parseInt(b.hour)),
      appointmentsByDayOfWeek: Object.entries(appointmentsByDayOfWeek).map(([day, count]) => ({ day, count })),
      popularServices: Object.entries(serviceCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    }

    return ApiResponse.success(res, report, "Relatório de agendamentos gerado")
  } catch (error) {
    console.error("Appointments report error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/reports/clients:
 *   get:
 *     summary: Relatório de clientes (apenas managers)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Relatório de clientes
 */
router.get("/clients", authenticate, authorize("manager"), (req, res) => {
  try {
    const barbershopId = req.user.barbershopId

    // Get all appointments for this barbershop
    const appointments = db.findAllByField("appointments", "barbershopId", barbershopId)

    // Get unique clients
    const clientIds = [...new Set(appointments.map((apt) => apt.clientId))]
    const clients = clientIds.map((id) => db.findById("users", id)).filter(Boolean)

    // Calculate client metrics
    const clientStats = clients.map((client) => {
      const clientAppointments = appointments.filter((apt) => apt.clientId === client.id)
      const completedAppointments = clientAppointments.filter((apt) => apt.status === "completed")

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        totalAppointments: clientAppointments.length,
        completedAppointments: completedAppointments.length,
        totalSpent: completedAppointments.reduce((sum, apt) => sum + apt.price, 0),
        lastAppointment:
          clientAppointments.sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`))[0]
            ?.date || null,
      }
    })

    // Sort by total spent (best clients first)
    clientStats.sort((a, b) => b.totalSpent - a.totalSpent)

    // Calculate summary metrics
    const totalClients = clients.length
    const activeClients = clientStats.filter((client) => {
      const lastAppointment = client.lastAppointment
      if (!lastAppointment) return false

      const daysSinceLastAppointment = Math.floor((new Date() - new Date(lastAppointment)) / (1000 * 60 * 60 * 24))
      return daysSinceLastAppointment <= 30 // Active if appointment in last 30 days
    }).length

    const averageSpentPerClient =
      totalClients > 0 ? clientStats.reduce((sum, client) => sum + client.totalSpent, 0) / totalClients : 0

    // New clients this month
    const thisMonth = new Date()
    const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
    const newClientsThisMonth = clientStats.filter((client) => {
      if (!client.lastAppointment) return false
      const firstAppointment = appointments
        .filter((apt) => apt.clientId === client.id)
        .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))[0]

      return firstAppointment && new Date(firstAppointment.date) >= startOfMonth
    }).length

    const report = {
      summary: {
        totalClients,
        activeClients,
        newClientsThisMonth,
        averageSpentPerClient: Math.round(averageSpentPerClient * 100) / 100,
      },
      topClients: clientStats.slice(0, 10), // Top 10 clients
      clientRetention: {
        oneTime: clientStats.filter((c) => c.totalAppointments === 1).length,
        returning: clientStats.filter((c) => c.totalAppointments > 1).length,
        loyal: clientStats.filter((c) => c.totalAppointments >= 5).length,
      },
    }

    return ApiResponse.success(res, report, "Relatório de clientes gerado")
  } catch (error) {
    console.error("Clients report error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/reports/barbers:
 *   get:
 *     summary: Relatório de performance dos barbeiros (apenas managers)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Relatório de performance dos barbeiros
 */
router.get("/barbers", authenticate, authorize("manager"), (req, res) => {
  try {
    const { period = "month" } = req.query
    const barbershopId = req.user.barbershopId

    // Calculate date range
    const now = new Date()
    let start, end

    switch (period) {
      case "week":
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        start = weekStart.toISOString().split("T")[0]
        end = now.toISOString().split("T")[0]
        break
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
        end = now.toISOString().split("T")[0]
        break
      case "year":
        start = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
        end = now.toISOString().split("T")[0]
        break
    }

    // Get barbers from this barbershop
    const barbers = db.users.filter((user) => user.role === "barber" && user.barbershopId === barbershopId)

    // Calculate performance for each barber
    const barberPerformance = barbers.map((barber) => {
      const appointments = db
        .findAllByField("appointments", "barberId", barber.id)
        .filter((apt) => apt.date >= start && apt.date <= end)

      const completedAppointments = appointments.filter((apt) => apt.status === "completed")
      const cancelledAppointments = appointments.filter((apt) => apt.status === "cancelled" || apt.status === "no-show")

      const revenue = completedAppointments.reduce((sum, apt) => sum + apt.price, 0)
      const completionRate = appointments.length > 0 ? (completedAppointments.length / appointments.length) * 100 : 0

      // Calculate average rating (mock data)
      const avgRating = 4.2 + Math.random() * 0.8 // Mock rating between 4.2-5.0

      return {
        id: barber.id,
        name: barber.name,
        avatar: barber.avatar,
        totalAppointments: appointments.length,
        completedAppointments: completedAppointments.length,
        cancelledAppointments: cancelledAppointments.length,
        revenue,
        completionRate: Math.round(completionRate * 100) / 100,
        avgRating: Math.round(avgRating * 10) / 10,
        averageTicket:
          completedAppointments.length > 0 ? Math.round((revenue / completedAppointments.length) * 100) / 100 : 0,
      }
    })

    // Sort by revenue (best performers first)
    barberPerformance.sort((a, b) => b.revenue - a.revenue)

    const report = {
      period: {
        type: period,
        startDate: start,
        endDate: end,
      },
      barbers: barberPerformance,
      summary: {
        totalBarbers: barbers.length,
        totalRevenue: barberPerformance.reduce((sum, barber) => sum + barber.revenue, 0),
        totalAppointments: barberPerformance.reduce((sum, barber) => sum + barber.totalAppointments, 0),
        averageCompletionRate:
          barberPerformance.length > 0
            ? Math.round(
                (barberPerformance.reduce((sum, barber) => sum + barber.completionRate, 0) / barberPerformance.length) *
                  100,
              ) / 100
            : 0,
      },
    }

    return ApiResponse.success(res, report, "Relatório de barbeiros gerado")
  } catch (error) {
    console.error("Barbers report error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

module.exports = router
