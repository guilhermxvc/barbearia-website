const express = require("express")
const bcrypt = require("bcryptjs")
const { authenticate, authorize } = require("../middlewares/auth")
const { validateUniqueEmail } = require("../middlewares/validation")
const { auditLogger } = require("../middlewares/logging")
const db = require("../config/database")
const ApiResponse = require("../utils/response")

const router = express.Router()

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Obter perfil do usuário
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário
 */
router.get("/profile", authenticate, (req, res) => {
  try {
    const user = db.findById("users", req.user.id)

    if (!user) {
      return ApiResponse.error(res, "Usuário não encontrado", 404)
    }

    // Remove sensitive data
    const { password, ...userProfile } = user

    // Get barbershop info if applicable
    let barbershop = null
    if (user.barbershopId) {
      barbershop = db.findById("barbershops", user.barbershopId)
    }

    const profileData = {
      ...userProfile,
      barbershop: barbershop
        ? {
            id: barbershop.id,
            name: barbershop.name,
            address: barbershop.address,
            phone: barbershop.phone,
            plan: barbershop.plan,
          }
        : null,
    }

    return ApiResponse.success(res, profileData, "Perfil obtido com sucesso")
  } catch (error) {
    console.error("Get profile error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Atualizar perfil do usuário
 *     tags: [Users]
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
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 */
router.put("/profile", authenticate, validateUniqueEmail, auditLogger("UPDATE_PROFILE"), (req, res) => {
  try {
    const { name, email, phone, avatar } = req.body
    const userId = req.user.id

    // Validate input
    if (!name || name.trim().length < 2) {
      return ApiResponse.error(res, "Nome deve ter pelo menos 2 caracteres", 400)
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ApiResponse.error(res, "Email inválido", 400)
    }

    if (phone && !/^$$\d{2}$$\s\d{4,5}-\d{4}$/.test(phone)) {
      return ApiResponse.error(res, "Telefone deve estar no formato (11) 99999-9999", 400)
    }

    // Update user
    const updatedUser = db.update("users", userId, {
      name: name.trim(),
      ...(email && { email: email.toLowerCase() }),
      ...(phone && { phone }),
      ...(avatar && { avatar }),
    })

    if (!updatedUser) {
      return ApiResponse.error(res, "Usuário não encontrado", 404)
    }

    // Remove sensitive data
    const { password, ...userProfile } = updatedUser

    return ApiResponse.success(res, userProfile, "Perfil atualizado com sucesso")
  } catch (error) {
    console.error("Update profile error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Alterar senha do usuário
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 */
router.put("/change-password", authenticate, auditLogger("CHANGE_PASSWORD"), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.id

    // Validate input
    if (!currentPassword || !newPassword) {
      return ApiResponse.error(res, "Senha atual e nova senha são obrigatórias", 400)
    }

    if (newPassword.length < 6) {
      return ApiResponse.error(res, "Nova senha deve ter pelo menos 6 caracteres", 400)
    }

    // Get user
    const user = db.findById("users", userId)
    if (!user) {
      return ApiResponse.error(res, "Usuário não encontrado", 404)
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return ApiResponse.error(res, "Senha atual incorreta", 400)
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    db.update("users", userId, {
      password: hashedNewPassword,
    })

    return ApiResponse.success(res, null, "Senha alterada com sucesso")
  } catch (error) {
    console.error("Change password error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar usuários (apenas managers)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [client, barber, manager]
 *         description: Filtrar por role
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
 *         description: Lista de usuários
 */
router.get("/", authenticate, authorize("manager"), (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query
    const barbershopId = req.user.barbershopId

    // Get users from the same barbershop
    let users = db.findAllByField("users", "barbershopId", barbershopId)

    // Filter by role if specified
    if (role) {
      users = users.filter((user) => user.role === role)
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + Number.parseInt(limit)
    const paginatedUsers = users.slice(startIndex, endIndex)

    // Remove sensitive data
    const safeUsers = paginatedUsers.map((user) => {
      const { password, ...safeUser } = user
      return safeUser
    })

    return ApiResponse.paginated(
      res,
      safeUsers,
      {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total: users.length,
      },
      "Usuários obtidos com sucesso",
    )
  } catch (error) {
    console.error("Get users error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obter usuário por ID (apenas managers)
 *     tags: [Users]
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
 *         description: Dados do usuário
 */
router.get("/:id", authenticate, authorize("manager"), (req, res) => {
  try {
    const { id } = req.params
    const user = db.findById("users", id)

    if (!user) {
      return ApiResponse.error(res, "Usuário não encontrado", 404)
    }

    // Check if user belongs to the same barbershop
    if (user.barbershopId !== req.user.barbershopId) {
      return ApiResponse.error(res, "Acesso negado", 403)
    }

    // Remove sensitive data
    const { password, ...safeUser } = user

    return ApiResponse.success(res, safeUser, "Usuário obtido com sucesso")
  } catch (error) {
    console.error("Get user error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Remover usuário (apenas managers)
 *     tags: [Users]
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
 *         description: Usuário removido com sucesso
 */
router.delete("/:id", authenticate, authorize("manager"), auditLogger("DELETE_USER"), (req, res) => {
  try {
    const { id } = req.params
    const user = db.findById("users", id)

    if (!user) {
      return ApiResponse.error(res, "Usuário não encontrado", 404)
    }

    // Check if user belongs to the same barbershop
    if (user.barbershopId !== req.user.barbershopId) {
      return ApiResponse.error(res, "Acesso negado", 403)
    }

    // Cannot delete yourself
    if (user.id === req.user.id) {
      return ApiResponse.error(res, "Não é possível remover sua própria conta", 400)
    }

    // Delete user
    const deleted = db.delete("users", id)

    if (!deleted) {
      return ApiResponse.error(res, "Erro ao remover usuário", 500)
    }

    return ApiResponse.success(res, null, "Usuário removido com sucesso")
  } catch (error) {
    console.error("Delete user error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

module.exports = router
