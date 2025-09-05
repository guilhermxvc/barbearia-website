const jwt = require("jsonwebtoken")
const db = require("../config/database")
const ApiResponse = require("../utils/response")

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  })
}

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ApiResponse.error(res, "Token de acesso requerido", 401)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    try {
      const decoded = verifyToken(token)

      // Find user in database
      const user = db.findById("users", decoded.userId)

      if (!user) {
        return ApiResponse.error(res, "Usuário não encontrado", 401)
      }

      // Add user info to request
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        barbershopId: user.barbershopId,
      }

      next()
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return ApiResponse.error(res, "Token expirado", 401)
      }
      return ApiResponse.error(res, "Token inválido", 401)
    }
  } catch (error) {
    return ApiResponse.error(res, "Erro na autenticação", 500)
  }
}

// Authorization middleware - check user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, "Usuário não autenticado", 401)
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.error(res, "Acesso negado. Permissões insuficientes", 403)
    }

    next()
  }
}

// Check if user belongs to barbershop
const checkBarbershopAccess = (req, res, next) => {
  const { barbershopId } = req.params

  if (!req.user) {
    return ApiResponse.error(res, "Usuário não autenticado", 401)
  }

  // Managers and barbers must belong to the barbershop
  if (["manager", "barber"].includes(req.user.role)) {
    if (!req.user.barbershopId || req.user.barbershopId !== Number.parseInt(barbershopId)) {
      return ApiResponse.error(res, "Acesso negado a esta barbearia", 403)
    }
  }

  next()
}

// Check if user can access specific barber data
const checkBarberAccess = (req, res, next) => {
  const { barberId } = req.params

  if (!req.user) {
    return ApiResponse.error(res, "Usuário não autenticado", 401)
  }

  // Barbers can only access their own data
  if (req.user.role === "barber" && req.user.id !== Number.parseInt(barberId)) {
    return ApiResponse.error(res, "Acesso negado aos dados deste barbeiro", 403)
  }

  // Managers can access any barber in their barbershop
  if (req.user.role === "manager") {
    const barber = db.findById("users", barberId)
    if (!barber || barber.barbershopId !== req.user.barbershopId) {
      return ApiResponse.error(res, "Barbeiro não encontrado nesta barbearia", 404)
    }
  }

  next()
}

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)

      try {
        const decoded = verifyToken(token)
        const user = db.findById("users", decoded.userId)

        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            barbershopId: user.barbershopId,
          }
        }
      } catch (jwtError) {
        // Ignore JWT errors in optional auth
      }
    }

    next()
  } catch (error) {
    next()
  }
}

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
  checkBarbershopAccess,
  checkBarberAccess,
  optionalAuth,
}
