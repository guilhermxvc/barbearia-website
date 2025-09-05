const morgan = require("morgan")

// Custom token for user ID
morgan.token("user-id", (req) => {
  return req.user ? req.user.id : "anonymous"
})

// Custom token for user role
morgan.token("user-role", (req) => {
  return req.user ? req.user.role : "guest"
})

// Custom format for API logging
const apiLogFormat =
  ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms - :user-role'

// Development logging
const developmentLogger = morgan("dev")

// Production logging
const productionLogger = morgan(apiLogFormat, {
  skip: (req, res) => {
    // Skip health checks and static files
    return req.url === "/health" || req.url.startsWith("/static")
  },
})

// Error logging
const errorLogger = morgan(apiLogFormat, {
  skip: (req, res) => res.statusCode < 400,
})

// Audit logging for sensitive operations
const auditLogger = (action) => {
  return (req, res, next) => {
    const originalSend = res.send

    res.send = function (data) {
      // Log the action after response
      if (res.statusCode < 400) {
        console.log(
          `[AUDIT] ${new Date().toISOString()} - User ${req.user?.id} (${req.user?.role}) performed ${action} - ${req.method} ${req.originalUrl}`,
        )
      }

      originalSend.call(this, data)
    }

    next()
  }
}

module.exports = {
  developmentLogger,
  productionLogger,
  errorLogger,
  auditLogger,
}
