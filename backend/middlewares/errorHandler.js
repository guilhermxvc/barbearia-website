const errorHandler = (err, req, res, next) => {
  console.error("Error:", err)

  // Default error
  const error = {
    success: false,
    message: err.message || "Erro interno do servidor",
    statusCode: err.statusCode || 500,
  }

  // Validation error
  if (err.name === "ValidationError") {
    error.message = "Dados inválidos"
    error.statusCode = 400
    error.details = err.details
  }

  // JWT error
  if (err.name === "JsonWebTokenError") {
    error.message = "Token inválido"
    error.statusCode = 401
  }

  if (err.name === "TokenExpiredError") {
    error.message = "Token expirado"
    error.statusCode = 401
  }

  // Duplicate key error (simulated)
  if (err.code === "DUPLICATE_KEY") {
    error.message = "Recurso já existe"
    error.statusCode = 409
  }

  // Not found error
  if (err.code === "NOT_FOUND") {
    error.message = "Recurso não encontrado"
    error.statusCode = 404
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    ...(error.details && { details: error.details }),
  })
}

module.exports = errorHandler
