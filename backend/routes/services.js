const express = require("express")
const { authenticate, authorize, checkBarbershopAccess } = require("../middlewares/auth")
const { validate } = require("../middlewares/validation")
const { auditLogger } = require("../middlewares/logging")
const db = require("../config/database")
const ApiResponse = require("../utils/response")

const router = express.Router()

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Listar serviços
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: barbershopId
 *         schema:
 *           type: integer
 *         description: ID da barbearia (opcional para clientes)
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrar apenas serviços ativos
 *     responses:
 *       200:
 *         description: Lista de serviços
 */
router.get("/", (req, res) => {
  try {
    const { barbershopId, active } = req.query

    let services = [...db.services]

    // Filter by barbershop
    if (barbershopId) {
      services = services.filter((service) => service.barbershopId === Number.parseInt(barbershopId))
    }

    // Filter by active status
    if (active !== undefined) {
      const isActive = active === "true"
      services = services.filter((service) => service.active === isActive)
    }

    // Sort by name
    services.sort((a, b) => a.name.localeCompare(b.name))

    return ApiResponse.success(res, services, "Serviços obtidos com sucesso")
  } catch (error) {
    console.error("Get services error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Criar novo serviço (apenas managers)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - duration
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               duration:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Serviço criado com sucesso
 */
router.post(
  "/",
  authenticate,
  authorize("manager"),
  validate("createService"),
  auditLogger("CREATE_SERVICE"),
  (req, res) => {
    try {
      const { name, description, price, duration } = req.body
      const barbershopId = req.user.barbershopId

      // Check if service name already exists in this barbershop
      const existingService = db.services.find(
        (service) => service.barbershopId === barbershopId && service.name.toLowerCase() === name.toLowerCase(),
      )

      if (existingService) {
        return ApiResponse.error(res, "Já existe um serviço com este nome", 409)
      }

      // Create service
      const newService = db.create("services", {
        barbershopId,
        name: name.trim(),
        description: description?.trim() || "",
        price: Number.parseFloat(price),
        duration: Number.parseInt(duration),
        active: true,
      })

      return ApiResponse.success(res, newService, "Serviço criado com sucesso", 201)
    } catch (error) {
      console.error("Create service error:", error)
      return ApiResponse.error(res, "Erro interno do servidor", 500)
    }
  },
)

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Obter serviço por ID
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do serviço
 */
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params
    const service = db.findById("services", id)

    if (!service) {
      return ApiResponse.error(res, "Serviço não encontrado", 404)
    }

    return ApiResponse.success(res, service, "Serviço obtido com sucesso")
  } catch (error) {
    console.error("Get service error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Atualizar serviço (apenas managers)
 *     tags: [Services]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               duration:
 *                 type: integer
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Serviço atualizado com sucesso
 */
router.put("/:id", authenticate, authorize("manager"), auditLogger("UPDATE_SERVICE"), (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price, duration, active } = req.body

    const service = db.findById("services", id)

    if (!service) {
      return ApiResponse.error(res, "Serviço não encontrado", 404)
    }

    // Check if service belongs to user's barbershop
    if (service.barbershopId !== req.user.barbershopId) {
      return ApiResponse.error(res, "Acesso negado a este serviço", 403)
    }

    // Validate input
    if (name && name.trim().length < 2) {
      return ApiResponse.error(res, "Nome deve ter pelo menos 2 caracteres", 400)
    }

    if (price && (isNaN(price) || price <= 0)) {
      return ApiResponse.error(res, "Preço deve ser um número positivo", 400)
    }

    if (duration && (isNaN(duration) || duration <= 0)) {
      return ApiResponse.error(res, "Duração deve ser um número positivo", 400)
    }

    // Check for duplicate name (excluding current service)
    if (name) {
      const existingService = db.services.find(
        (s) =>
          s.id !== Number.parseInt(id) &&
          s.barbershopId === req.user.barbershopId &&
          s.name.toLowerCase() === name.toLowerCase(),
      )

      if (existingService) {
        return ApiResponse.error(res, "Já existe um serviço com este nome", 409)
      }
    }

    // Update service
    const updatedService = db.update("services", id, {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(price && { price: Number.parseFloat(price) }),
      ...(duration && { duration: Number.parseInt(duration) }),
      ...(active !== undefined && { active: Boolean(active) }),
    })

    return ApiResponse.success(res, updatedService, "Serviço atualizado com sucesso")
  } catch (error) {
    console.error("Update service error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Remover serviço (apenas managers)
 *     tags: [Services]
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
 *         description: Serviço removido com sucesso
 */
router.delete("/:id", authenticate, authorize("manager"), auditLogger("DELETE_SERVICE"), (req, res) => {
  try {
    const { id } = req.params

    const service = db.findById("services", id)

    if (!service) {
      return ApiResponse.error(res, "Serviço não encontrado", 404)
    }

    // Check if service belongs to user's barbershop
    if (service.barbershopId !== req.user.barbershopId) {
      return ApiResponse.error(res, "Acesso negado a este serviço", 403)
    }

    // Check if service has active appointments
    const activeAppointments = db.appointments.filter(
      (apt) => apt.serviceId === Number.parseInt(id) && ["pending", "confirmed", "in-progress"].includes(apt.status),
    )

    if (activeAppointments.length > 0) {
      return ApiResponse.error(res, "Não é possível remover serviço com agendamentos ativos", 400)
    }

    // Delete service
    const deleted = db.delete("services", id)

    if (!deleted) {
      return ApiResponse.error(res, "Erro ao remover serviço", 500)
    }

    return ApiResponse.success(res, null, "Serviço removido com sucesso")
  } catch (error) {
    console.error("Delete service error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

module.exports = router
