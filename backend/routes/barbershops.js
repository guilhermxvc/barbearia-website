const express = require("express")
const { authenticate, authorize } = require("../middlewares/auth")
const { auditLogger } = require("../middlewares/logging")
const db = require("../config/database")
const ApiResponse = require("../utils/response")

const router = express.Router()

/**
 * @swagger
 * /api/barbershops/search:
 *   get:
 *     summary: Buscar barbearias próximas
 *     tags: [Barbershops]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Longitude
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: Raio em km
 *     responses:
 *       200:
 *         description: Lista de barbearias próximas
 */
router.get("/search", (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query

    // Get all barbershops
    let barbershops = [...db.barbershops]

    // If coordinates provided, calculate distance
    if (lat && lng) {
      const userLat = Number.parseFloat(lat)
      const userLng = Number.parseFloat(lng)
      const maxRadius = Number.parseFloat(radius)

      barbershops = barbershops
        .filter((barbershop) => {
          // Simple distance calculation (not accurate for production)
          const distance =
            Math.sqrt(Math.pow(barbershop.latitude - userLat, 2) + Math.pow(barbershop.longitude - userLng, 2)) * 111 // Rough conversion to km

          return distance <= maxRadius
        })
        .map((barbershop) => ({
          ...barbershop,
          distance:
            Math.sqrt(Math.pow(barbershop.latitude - userLat, 2) + Math.pow(barbershop.longitude - userLng, 2)) * 111,
        }))
        .sort((a, b) => a.distance - b.distance)
    }

    // Add services and barbers count
    const barbershopsWithInfo = barbershops.map((barbershop) => {
      const services = db.findAllByField("services", "barbershopId", barbershop.id)
      const barbers = db.findAllByField("users", "barbershopId", barbershop.id).filter((user) => user.role === "barber")

      return {
        ...barbershop,
        servicesCount: services.length,
        barbersCount: barbers.length,
        services: services.filter((s) => s.active).slice(0, 3), // Show first 3 active services
      }
    })

    return ApiResponse.success(res, barbershopsWithInfo, "Barbearias encontradas")
  } catch (error) {
    console.error("Search barbershops error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/barbershops/{id}:
 *   get:
 *     summary: Obter detalhes da barbearia
 *     tags: [Barbershops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalhes da barbearia
 */
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params
    const barbershop = db.findById("barbershops", id)

    if (!barbershop) {
      return ApiResponse.error(res, "Barbearia não encontrada", 404)
    }

    // Get services and barbers
    const services = db.findAllByField("services", "barbershopId", barbershop.id).filter((service) => service.active)

    const barbers = db
      .findAllByField("users", "barbershopId", barbershop.id)
      .filter((user) => user.role === "barber")
      .map((barber) => {
        const { password, ...safeBarber } = barber
        return safeBarber
      })

    const barbershopDetails = {
      ...barbershop,
      services,
      barbers,
    }

    return ApiResponse.success(res, barbershopDetails, "Detalhes da barbearia obtidos")
  } catch (error) {
    console.error("Get barbershop error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/barbershops/validate-code:
 *   post:
 *     summary: Validar código da barbearia
 *     tags: [Barbershops]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Código válido
 *       404:
 *         description: Código inválido
 */
router.post("/validate-code", (req, res) => {
  try {
    const { code } = req.body

    if (!code) {
      return ApiResponse.error(res, "Código é obrigatório", 400)
    }

    const barbershop = db.findByField("barbershops", "code", code.toUpperCase())

    if (!barbershop) {
      return ApiResponse.error(res, "Código da barbearia inválido", 404)
    }

    return ApiResponse.success(
      res,
      {
        id: barbershop.id,
        name: barbershop.name,
        address: barbershop.address,
      },
      "Código válido",
    )
  } catch (error) {
    console.error("Validate code error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/barbershops/settings:
 *   get:
 *     summary: Obter configurações da barbearia (apenas managers)
 *     tags: [Barbershops]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configurações da barbearia
 */
router.get("/settings", authenticate, authorize("manager"), (req, res) => {
  try {
    const barbershop = db.findById("barbershops", req.user.barbershopId)

    if (!barbershop) {
      return ApiResponse.error(res, "Barbearia não encontrada", 404)
    }

    return ApiResponse.success(res, barbershop, "Configurações obtidas")
  } catch (error) {
    console.error("Get settings error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/barbershops/settings:
 *   put:
 *     summary: Atualizar configurações da barbearia (apenas managers)
 *     tags: [Barbershops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               workingHours:
 *                 type: object
 *     responses:
 *       200:
 *         description: Configurações atualizadas
 */
router.put("/settings", authenticate, authorize("manager"), auditLogger("UPDATE_BARBERSHOP_SETTINGS"), (req, res) => {
  try {
    const { name, address, phone, email, workingHours } = req.body
    const barbershopId = req.user.barbershopId

    // Validate input
    if (name && name.trim().length < 2) {
      return ApiResponse.error(res, "Nome deve ter pelo menos 2 caracteres", 400)
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ApiResponse.error(res, "Email inválido", 400)
    }

    // Update barbershop
    const updatedBarbershop = db.update("barbershops", barbershopId, {
      ...(name && { name: name.trim() }),
      ...(address && { address: address.trim() }),
      ...(phone && { phone }),
      ...(email && { email: email.toLowerCase() }),
      ...(workingHours && { workingHours }),
    })

    if (!updatedBarbershop) {
      return ApiResponse.error(res, "Barbearia não encontrada", 404)
    }

    return ApiResponse.success(res, updatedBarbershop, "Configurações atualizadas")
  } catch (error) {
    console.error("Update settings error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/barbershops/generate-code:
 *   post:
 *     summary: Gerar novo código da barbearia (apenas managers)
 *     tags: [Barbershops]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Novo código gerado
 */
router.post(
  "/generate-code",
  authenticate,
  authorize("manager"),
  auditLogger("GENERATE_BARBERSHOP_CODE"),
  (req, res) => {
    try {
      const barbershopId = req.user.barbershopId

      // Generate new code
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase() + Math.floor(Math.random() * 1000)

      // Update barbershop
      const updatedBarbershop = db.update("barbershops", barbershopId, {
        code: newCode,
      })

      if (!updatedBarbershop) {
        return ApiResponse.error(res, "Barbearia não encontrada", 404)
      }

      return ApiResponse.success(res, { code: newCode }, "Novo código gerado")
    } catch (error) {
      console.error("Generate code error:", error)
      return ApiResponse.error(res, "Erro interno do servidor", 500)
    }
  },
)

module.exports = router
