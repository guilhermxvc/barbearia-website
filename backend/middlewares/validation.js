const { validate } = require("../utils/validators")
const ApiResponse = require("../utils/response")

// Custom validation middleware for specific business rules
const validateAppointmentTime = (req, res, next) => {
  const { date, time, barberId } = req.body

  // Check if appointment is in the past
  const appointmentDateTime = new Date(`${date}T${time}`)
  const now = new Date()

  if (appointmentDateTime <= now) {
    return ApiResponse.error(res, "Não é possível agendar para data/hora passada", 400)
  }

  // Check if it's within business hours (8:00 - 18:00)
  const [hours, minutes] = time.split(":").map(Number)
  const appointmentMinutes = hours * 60 + minutes

  if (appointmentMinutes < 8 * 60 || appointmentMinutes >= 18 * 60) {
    return ApiResponse.error(res, "Horário fora do funcionamento (08:00 - 18:00)", 400)
  }

  // Check for conflicts with existing appointments
  const db = require("../config/database")
  const existingAppointment = db.appointments.find(
    (apt) => apt.barberId === barberId && apt.date === date && apt.time === time && apt.status !== "cancelled",
  )

  if (existingAppointment) {
    return ApiResponse.error(res, "Horário já ocupado", 409)
  }

  next()
}

// Validate barbershop code
const validateBarbershopCode = (req, res, next) => {
  const { barbershopCode } = req.body

  if (!barbershopCode) {
    return next()
  }

  const db = require("../config/database")
  const barbershop = db.findByField("barbershops", "code", barbershopCode)

  if (!barbershop) {
    return ApiResponse.error(res, "Código da barbearia inválido", 400)
  }

  req.barbershop = barbershop
  next()
}

// Validate unique email
const validateUniqueEmail = (req, res, next) => {
  const { email } = req.body
  const { id } = req.params // For updates

  const db = require("../config/database")
  const existingUser = db.findByField("users", "email", email)

  // If updating, ignore the current user
  if (existingUser && (!id || existingUser.id !== Number.parseInt(id))) {
    return ApiResponse.error(res, "Email já está em uso", 409)
  }

  next()
}

// Validate service belongs to barbershop
const validateServiceAccess = (req, res, next) => {
  const { serviceId } = req.body || req.params

  if (!serviceId) {
    return next()
  }

  const db = require("../config/database")
  const service = db.findById("services", serviceId)

  if (!service) {
    return ApiResponse.error(res, "Serviço não encontrado", 404)
  }

  // Check if user has access to this service's barbershop
  if (req.user.role !== "client" && service.barbershopId !== req.user.barbershopId) {
    return ApiResponse.error(res, "Acesso negado a este serviço", 403)
  }

  req.service = service
  next()
}

// Validate barber belongs to barbershop
const validateBarberAccess = (req, res, next) => {
  const { barberId } = req.body || req.params

  if (!barberId) {
    return next()
  }

  const db = require("../config/database")
  const barber = db.findById("users", barberId)

  if (!barber || barber.role !== "barber") {
    return ApiResponse.error(res, "Barbeiro não encontrado", 404)
  }

  // For clients, any barber is valid
  if (req.user.role === "client") {
    req.barber = barber
    return next()
  }

  // For managers/barbers, check barbershop access
  if (barber.barbershopId !== req.user.barbershopId) {
    return ApiResponse.error(res, "Acesso negado a este barbeiro", 403)
  }

  req.barber = barber
  next()
}

// File upload validation
const validateFileUpload = (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file) {
      return next()
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(req.file.mimetype)) {
      return ApiResponse.error(res, `Tipo de arquivo não permitido. Permitidos: ${allowedTypes.join(", ")}`, 400)
    }

    // Check file size
    if (req.file.size > maxSize) {
      return ApiResponse.error(res, `Arquivo muito grande. Máximo: ${maxSize / (1024 * 1024)}MB`, 400)
    }

    next()
  }
}

module.exports = {
  validate,
  validateAppointmentTime,
  validateBarbershopCode,
  validateUniqueEmail,
  validateServiceAccess,
  validateBarberAccess,
  validateFileUpload,
}
