class ApiResponse {
  static success(res, data = null, message = "Sucesso", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    })
  }

  static error(res, message = "Erro interno", statusCode = 500, details = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    })
  }

  static paginated(res, data, pagination, message = "Sucesso") {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
      },
      timestamp: new Date().toISOString(),
    })
  }
}

module.exports = ApiResponse
