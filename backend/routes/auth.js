const express = require("express")
const bcrypt = require("bcryptjs")
const { generateToken, authenticate } = require("../middlewares/auth")
const { validate, validateBarbershopCode, validateUniqueEmail } = require("../middlewares/validation")
const { authLimiter } = require("../middlewares/security")
const { auditLogger } = require("../middlewares/logging")
const db = require("../config/database")
const ApiResponse = require("../utils/response")

const router = express.Router()

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autenticar usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
router.post("/login", authLimiter, validate("login"), auditLogger("LOGIN"), async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = db.findByField("users", "email", email.toLowerCase())

    if (!user) {
      return ApiResponse.error(res, "Credenciais inválidas", 401)
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return ApiResponse.error(res, "Credenciais inválidas", 401)
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Get barbershop info if user belongs to one
    let barbershop = null
    if (user.barbershopId) {
      barbershop = db.findById("barbershops", user.barbershopId)
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      barbershopId: user.barbershopId,
      barbershop: barbershop
        ? {
            id: barbershop.id,
            name: barbershop.name,
            plan: barbershop.plan,
          }
        : null,
    }

    return ApiResponse.success(
      res,
      {
        user: userData,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      },
      "Login realizado com sucesso",
    )
  } catch (error) {
    console.error("Login error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [client, barber, manager]
 *               barbershopCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       409:
 *         description: Email já existe
 */
router.post(
  "/register",
  authLimiter,
  validate("register"),
  validateUniqueEmail,
  validateBarbershopCode,
  auditLogger("REGISTER"),
  async (req, res) => {
    try {
      const { name, email, password, phone, role, barbershopCode } = req.body

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Determine barbershop ID
      let barbershopId = null
      if (role !== "client" && req.barbershop) {
        barbershopId = req.barbershop.id
      }

      // Create user
      const newUser = db.create("users", {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        role,
        barbershopId,
        avatar: null,
      })

      // Generate token
      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      })

      // Get barbershop info if applicable
      let barbershop = null
      if (barbershopId) {
        barbershop = db.findById("barbershops", barbershopId)
      }

      const userData = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        avatar: newUser.avatar,
        barbershopId: newUser.barbershopId,
        barbershop: barbershop
          ? {
              id: barbershop.id,
              name: barbershop.name,
              plan: barbershop.plan,
            }
          : null,
      }

      return ApiResponse.success(
        res,
        {
          user: userData,
          token,
          expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        },
        "Usuário criado com sucesso",
        201,
      )
    } catch (error) {
      console.error("Register error:", error)
      return ApiResponse.error(res, "Erro interno do servidor", 500)
    }
  },
)

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obter dados do usuário logado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       401:
 *         description: Token inválido
 */
router.get("/me", authenticate, (req, res) => {
  try {
    const user = db.findById("users", req.user.id)

    if (!user) {
      return ApiResponse.error(res, "Usuário não encontrado", 404)
    }

    // Get barbershop info if applicable
    let barbershop = null
    if (user.barbershopId) {
      barbershop = db.findById("barbershops", user.barbershopId)
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      barbershopId: user.barbershopId,
      barbershop: barbershop
        ? {
            id: barbershop.id,
            name: barbershop.name,
            plan: barbershop.plan,
          }
        : null,
    }

    return ApiResponse.success(res, userData, "Dados do usuário obtidos com sucesso")
  } catch (error) {
    console.error("Get user error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar token de acesso
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 *       401:
 *         description: Token inválido
 */
router.post("/refresh", authenticate, (req, res) => {
  try {
    // Generate new token
    const token = generateToken({
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
    })

    return ApiResponse.success(
      res,
      {
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      },
      "Token renovado com sucesso",
    )
  } catch (error) {
    console.error("Refresh token error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Fazer logout (invalidar token)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 */
router.post("/logout", authenticate, auditLogger("LOGOUT"), (req, res) => {
  // In a real implementation, you would add the token to a blacklist
  // For this mock implementation, we just return success
  return ApiResponse.success(res, null, "Logout realizado com sucesso")
})

module.exports = router
