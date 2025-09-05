const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const compression = require("compression")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

// Import routes
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const appointmentRoutes = require("./routes/appointments")
const barbershopRoutes = require("./routes/barbershops")
const serviceRoutes = require("./routes/services")
const productRoutes = require("./routes/products")
const barberRoutes = require("./routes/barbers")
const clientRoutes = require("./routes/clients")
const reportRoutes = require("./routes/reports")
const notificationRoutes = require("./routes/notifications")
const aiRoutes = require("./routes/ai")
const paymentRoutes = require("./routes/payments")

// Import middlewares
const errorHandler = require("./middlewares/errorHandler")
const { serve, setup } = require("./config/swagger")

const app = express()
const PORT = process.env.PORT || 3000

// Security middlewares
app.use(helmet())
app.use(
  cors({
    origin: ["http://localhost:3001", "http://localhost:3000"],
    credentials: true,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Muitas tentativas. Tente novamente em 15 minutos.",
  },
})
app.use("/api/", limiter)

// General middlewares
app.use(compression())
app.use(morgan("combined"))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Setup Swagger documentation corretamente
app.use("/api-docs", serve, setup)

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/appointments", appointmentRoutes)
app.use("/api/barbershops", barbershopRoutes)
app.use("/api/services", serviceRoutes)
app.use("/api/products", productRoutes)
app.use("/api/barbers", barberRoutes)
app.use("/api/clients", clientRoutes)
app.use("/api/reports", reportRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/payments", paymentRoutes)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint não encontrado",
    path: req.originalUrl,
  })
})

// Error handling middleware
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
  console.log(`📚 Documentação disponível em http://localhost:${PORT}/api-docs`)
  console.log(`🏥 Health check em http://localhost:${PORT}/health`)
})

module.exports = app
