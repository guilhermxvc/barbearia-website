const swaggerJsdoc = require("swagger-jsdoc")
const swaggerUi = require("swagger-ui-express")

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Barbearia API",
      version: "1.0.0",
      description: "API completa para sistema de gestão de barbearia",
      contact: {
        name: "Suporte Técnico",
        email: "suporte@barbearia.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor de Desenvolvimento",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "1" },
            name: { type: "string", example: "João Silva" },
            email: { type: "string", example: "joao@email.com" },
            phone: { type: "string", example: "(11) 99999-9999" },
            role: { type: "string", enum: ["client", "barber", "manager"], example: "client" },
            barbershopId: { type: "string", example: "1" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Appointment: {
          type: "object",
          properties: {
            id: { type: "string", example: "1" },
            clientId: { type: "string", example: "1" },
            barberId: { type: "string", example: "2" },
            serviceId: { type: "string", example: "1" },
            date: { type: "string", format: "date" },
            time: { type: "string", example: "14:00" },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"],
              example: "confirmed",
            },
            totalPrice: { type: "number", example: 35.0 },
            notes: { type: "string", example: "Cliente prefere corte baixo" },
          },
        },
        Service: {
          type: "object",
          properties: {
            id: { type: "string", example: "1" },
            name: { type: "string", example: "Corte Masculino" },
            description: { type: "string", example: "Corte tradicional masculino" },
            price: { type: "number", example: 25.0 },
            duration: { type: "number", example: 30 },
            category: { type: "string", example: "Cortes" },
            active: { type: "boolean", example: true },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string", example: "1" },
            name: { type: "string", example: "Pomada Modeladora" },
            description: { type: "string", example: "Pomada para modelar cabelo" },
            price: { type: "number", example: 15.0 },
            stock: { type: "number", example: 50 },
            category: { type: "string", example: "Produtos para Cabelo" },
            active: { type: "boolean", example: true },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Erro interno do servidor" },
            error: { type: "string", example: "INTERNAL_SERVER_ERROR" },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Operação realizada com sucesso" },
            data: { type: "object" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Caminho para os arquivos de rotas
}

const specs = swaggerJsdoc(options)

module.exports = {
  specs,
  swaggerUi,
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Barbearia API Documentation",
  }),
}
