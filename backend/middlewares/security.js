const rateLimit = require("express-rate-limit")
const ApiResponse = require("../utils/response")

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limiting for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: "Muitas tentativas de redefinição de senha. Tente novamente em 1 hora.",
  },
})

// Rate limiting for appointment creation
const appointmentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 appointment requests per minute
  message: {
    success: false,
    message: "Muitas tentativas de agendamento. Aguarde um momento.",
  },
})

// Sanitize input data
const sanitizeInput = (req, res, next) => {
  // Remove potentially dangerous characters
  const sanitize = (obj) => {
    if (typeof obj === "string") {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")
    }

    if (typeof obj === "object" && obj !== null) {
      const sanitized = {}
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key])
      }
      return sanitized
    }

    return obj
  }

  if (req.body) {
    req.body = sanitize(req.body)
  }

  if (req.query) {
    req.query = sanitize(req.query)
  }

  next()
}

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true)

    const allowedOrigins = ["http://localhost:3000", "http://localhost:3001", "https://barberpro.vercel.app"]

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error("Não permitido pelo CORS"))
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY")

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff")

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block")

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")

  next()
}

// Request size limiter
const requestSizeLimiter = (req, res, next) => {
  const contentLength = Number.parseInt(req.get("Content-Length"))
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (contentLength > maxSize) {
    return ApiResponse.error(res, "Payload muito grande", 413)
  }

  next()
}

module.exports = {
  authLimiter,
  passwordResetLimiter,
  appointmentLimiter,
  sanitizeInput,
  corsOptions,
  securityHeaders,
  requestSizeLimiter,
}
