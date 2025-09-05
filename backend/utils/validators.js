const Joi = require("joi")

const schemas = {
  // Auth schemas
  login: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email deve ter um formato válido",
      "any.required": "Email é obrigatório",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Senha deve ter pelo menos 6 caracteres",
      "any.required": "Senha é obrigatória",
    }),
  }),

  register: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      "string.min": "Nome deve ter pelo menos 2 caracteres",
      "string.max": "Nome deve ter no máximo 100 caracteres",
      "any.required": "Nome é obrigatório",
    }),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string()
      .pattern(/^$$\d{2}$$\s\d{4,5}-\d{4}$/)
      .required()
      .messages({
        "string.pattern.base": "Telefone deve estar no formato (11) 99999-9999",
      }),
    role: Joi.string().valid("client", "barber", "manager").required(),
    barbershopCode: Joi.when("role", {
      is: Joi.valid("barber", "manager"),
      then: Joi.string().required(),
      otherwise: Joi.optional(),
    }),
  }),

  // Appointment schemas
  createAppointment: Joi.object({
    barberId: Joi.number().integer().positive().required(),
    serviceId: Joi.number().integer().positive().required(),
    date: Joi.date().iso().min("now").required().messages({
      "date.min": "Data deve ser futura",
    }),
    time: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required()
      .messages({
        "string.pattern.base": "Horário deve estar no formato HH:MM",
      }),
    notes: Joi.string().max(500).optional(),
  }),

  updateAppointmentStatus: Joi.object({
    status: Joi.string().valid("pending", "confirmed", "in-progress", "completed", "cancelled", "no-show").required(),
  }),

  // Service schemas
  createService: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    price: Joi.number().positive().precision(2).required(),
    duration: Joi.number().integer().positive().required().messages({
      "number.positive": "Duração deve ser um número positivo em minutos",
    }),
  }),

  // Product schemas
  createProduct: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    price: Joi.number().positive().precision(2).required(),
    stock: Joi.number().integer().min(0).required(),
    minStock: Joi.number().integer().min(0).required(),
    category: Joi.string().valid("styling", "care", "tools", "other").required(),
  }),
}

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schemas[schema].validate(req.body, { abortEarly: false })

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }))

      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
        details,
      })
    }

    next()
  }
}

module.exports = { validate, schemas }
