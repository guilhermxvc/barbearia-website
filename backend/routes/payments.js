const express = require("express")
const { authenticate, authorize } = require("../middlewares/auth")
const { auditLogger } = require("../middlewares/logging")
const db = require("../config/database")
const ApiResponse = require("../utils/response")

const router = express.Router()

/**
 * @swagger
 * /api/payments/create:
 *   post:
 *     summary: Criar cobrança (mock)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - description
 *             properties:
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               appointmentId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Cobrança criada com sucesso
 */
router.post("/create", authenticate, auditLogger("CREATE_PAYMENT"), (req, res) => {
  try {
    const { amount, description, appointmentId } = req.body

    if (!amount || !description) {
      return ApiResponse.error(res, "Valor e descrição são obrigatórios", 400)
    }

    if (amount <= 0) {
      return ApiResponse.error(res, "Valor deve ser positivo", 400)
    }

    // Mock payment creation
    const payment = {
      id: Math.random().toString(36).substring(2, 15),
      amount: Number.parseFloat(amount),
      description: description.trim(),
      status: "pending",
      appointmentId: appointmentId || null,
      userId: req.user.id,
      createdAt: new Date().toISOString(),
      paymentUrl: `https://mock-payment-gateway.com/pay/${Math.random().toString(36).substring(2, 15)}`,
    }

    return ApiResponse.success(res, payment, "Cobrança criada com sucesso", 201)
  } catch (error) {
    console.error("Create payment error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/payments/status/{id}:
 *   get:
 *     summary: Verificar status do pagamento (mock)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status do pagamento
 */
router.get("/status/:id", authenticate, (req, res) => {
  try {
    const { id } = req.params

    // Mock payment status check
    const statuses = ["pending", "processing", "completed", "failed"]
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

    const paymentStatus = {
      id,
      status: randomStatus,
      updatedAt: new Date().toISOString(),
      ...(randomStatus === "completed" && {
        completedAt: new Date().toISOString(),
        transactionId: `txn_${Math.random().toString(36).substring(2, 15)}`,
      }),
      ...(randomStatus === "failed" && {
        failureReason: "Cartão recusado",
      }),
    }

    return ApiResponse.success(res, paymentStatus, "Status do pagamento obtido")
  } catch (error) {
    console.error("Get payment status error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/payments/process:
 *   post:
 *     summary: Processar pagamento de plano (mock)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *               - paymentMethod
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [basic, professional, premium]
 *               paymentMethod:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [credit_card, pix, boleto]
 *                   cardNumber:
 *                     type: string
 *                   expiryDate:
 *                     type: string
 *                   cvv:
 *                     type: string
 *     responses:
 *       200:
 *         description: Pagamento processado com sucesso
 */
router.post("/process", auditLogger("PROCESS_PLAN_PAYMENT"), (req, res) => {
  try {
    const { plan, paymentMethod } = req.body

    if (!plan || !paymentMethod) {
      return ApiResponse.error(res, "Plano e método de pagamento são obrigatórios", 400)
    }

    const planPrices = {
      basic: 99.0,
      professional: 125.0,
      premium: 199.0,
    }

    if (!planPrices[plan]) {
      return ApiResponse.error(res, "Plano inválido", 400)
    }

    // Mock payment processing
    const isSuccess = Math.random() > 0.1 // 90% success rate

    if (isSuccess) {
      const payment = {
        id: `pay_${Math.random().toString(36).substring(2, 15)}`,
        plan,
        amount: planPrices[plan],
        status: "completed",
        transactionId: `txn_${Math.random().toString(36).substring(2, 15)}`,
        paymentMethod: paymentMethod.type,
        processedAt: new Date().toISOString(),
      }

      return ApiResponse.success(res, payment, "Pagamento processado com sucesso")
    } else {
      return ApiResponse.error(res, "Falha no processamento do pagamento. Tente novamente.", 400)
    }
  } catch (error) {
    console.error("Process payment error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

module.exports = router
