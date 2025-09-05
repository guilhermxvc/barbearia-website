const express = require("express")
const { authenticate, authorize } = require("../middlewares/auth")
const { validate } = require("../middlewares/validation")
const { auditLogger } = require("../middlewares/logging")
const db = require("../config/database")
const ApiResponse = require("../utils/response")

const router = express.Router()

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Listar produtos (apenas managers)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [styling, care, tools, other]
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filtrar produtos com estoque baixo
 *     responses:
 *       200:
 *         description: Lista de produtos
 */
router.get("/", authenticate, authorize("manager"), (req, res) => {
  try {
    const { category, active, lowStock } = req.query
    const barbershopId = req.user.barbershopId

    let products = db.findAllByField("products", "barbershopId", barbershopId)

    // Apply filters
    if (category) {
      products = products.filter((product) => product.category === category)
    }

    if (active !== undefined) {
      const isActive = active === "true"
      products = products.filter((product) => product.active === isActive)
    }

    if (lowStock === "true") {
      products = products.filter((product) => product.stock <= product.minStock)
    }

    // Sort by name
    products.sort((a, b) => a.name.localeCompare(b.name))

    return ApiResponse.success(res, products, "Produtos obtidos com sucesso")
  } catch (error) {
    console.error("Get products error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Criar novo produto (apenas managers)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - stock
 *               - minStock
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               minStock:
 *                 type: integer
 *               category:
 *                 type: string
 *                 enum: [styling, care, tools, other]
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 */
router.post(
  "/",
  authenticate,
  authorize("manager"),
  validate("createProduct"),
  auditLogger("CREATE_PRODUCT"),
  (req, res) => {
    try {
      const { name, description, price, stock, minStock, category } = req.body
      const barbershopId = req.user.barbershopId

      // Check if product name already exists in this barbershop
      const existingProduct = db.products.find(
        (product) => product.barbershopId === barbershopId && product.name.toLowerCase() === name.toLowerCase(),
      )

      if (existingProduct) {
        return ApiResponse.error(res, "Já existe um produto com este nome", 409)
      }

      // Create product
      const newProduct = db.create("products", {
        barbershopId,
        name: name.trim(),
        description: description?.trim() || "",
        price: Number.parseFloat(price),
        stock: Number.parseInt(stock),
        minStock: Number.parseInt(minStock),
        category,
        active: true,
      })

      return ApiResponse.success(res, newProduct, "Produto criado com sucesso", 201)
    } catch (error) {
      console.error("Create product error:", error)
      return ApiResponse.error(res, "Erro interno do servidor", 500)
    }
  },
)

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obter produto por ID (apenas managers)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do produto
 */
router.get("/:id", authenticate, authorize("manager"), (req, res) => {
  try {
    const { id } = req.params
    const product = db.findById("products", id)

    if (!product) {
      return ApiResponse.error(res, "Produto não encontrado", 404)
    }

    // Check if product belongs to user's barbershop
    if (product.barbershopId !== req.user.barbershopId) {
      return ApiResponse.error(res, "Acesso negado a este produto", 403)
    }

    return ApiResponse.success(res, product, "Produto obtido com sucesso")
  } catch (error) {
    console.error("Get product error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Atualizar produto (apenas managers)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               minStock:
 *                 type: integer
 *               category:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 */
router.put("/:id", authenticate, authorize("manager"), auditLogger("UPDATE_PRODUCT"), (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price, stock, minStock, category, active } = req.body

    const product = db.findById("products", id)

    if (!product) {
      return ApiResponse.error(res, "Produto não encontrado", 404)
    }

    // Check if product belongs to user's barbershop
    if (product.barbershopId !== req.user.barbershopId) {
      return ApiResponse.error(res, "Acesso negado a este produto", 403)
    }

    // Validate input
    if (name && name.trim().length < 2) {
      return ApiResponse.error(res, "Nome deve ter pelo menos 2 caracteres", 400)
    }

    if (price && (isNaN(price) || price <= 0)) {
      return ApiResponse.error(res, "Preço deve ser um número positivo", 400)
    }

    if (stock !== undefined && (isNaN(stock) || stock < 0)) {
      return ApiResponse.error(res, "Estoque deve ser um número não negativo", 400)
    }

    if (minStock !== undefined && (isNaN(minStock) || minStock < 0)) {
      return ApiResponse.error(res, "Estoque mínimo deve ser um número não negativo", 400)
    }

    // Check for duplicate name (excluding current product)
    if (name) {
      const existingProduct = db.products.find(
        (p) =>
          p.id !== Number.parseInt(id) &&
          p.barbershopId === req.user.barbershopId &&
          p.name.toLowerCase() === name.toLowerCase(),
      )

      if (existingProduct) {
        return ApiResponse.error(res, "Já existe um produto com este nome", 409)
      }
    }

    // Update product
    const updatedProduct = db.update("products", id, {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(price && { price: Number.parseFloat(price) }),
      ...(stock !== undefined && { stock: Number.parseInt(stock) }),
      ...(minStock !== undefined && { minStock: Number.parseInt(minStock) }),
      ...(category && { category }),
      ...(active !== undefined && { active: Boolean(active) }),
    })

    return ApiResponse.success(res, updatedProduct, "Produto atualizado com sucesso")
  } catch (error) {
    console.error("Update product error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/products/{id}/stock:
 *   put:
 *     summary: Atualizar estoque do produto (apenas managers)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *               - operation
 *             properties:
 *               quantity:
 *                 type: integer
 *               operation:
 *                 type: string
 *                 enum: [add, subtract, set]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estoque atualizado com sucesso
 */
router.put("/:id/stock", authenticate, authorize("manager"), auditLogger("UPDATE_PRODUCT_STOCK"), (req, res) => {
  try {
    const { id } = req.params
    const { quantity, operation, reason } = req.body

    if (!quantity || !operation) {
      return ApiResponse.error(res, "Quantidade e operação são obrigatórias", 400)
    }

    if (!["add", "subtract", "set"].includes(operation)) {
      return ApiResponse.error(res, "Operação deve ser add, subtract ou set", 400)
    }

    const product = db.findById("products", id)

    if (!product) {
      return ApiResponse.error(res, "Produto não encontrado", 404)
    }

    // Check if product belongs to user's barbershop
    if (product.barbershopId !== req.user.barbershopId) {
      return ApiResponse.error(res, "Acesso negado a este produto", 403)
    }

    let newStock
    const qty = Number.parseInt(quantity)

    switch (operation) {
      case "add":
        newStock = product.stock + qty
        break
      case "subtract":
        newStock = product.stock - qty
        break
      case "set":
        newStock = qty
        break
    }

    if (newStock < 0) {
      return ApiResponse.error(res, "Estoque não pode ser negativo", 400)
    }

    // Update product stock
    const updatedProduct = db.update("products", id, {
      stock: newStock,
    })

    // Log stock movement (in a real app, you'd have a stock_movements table)
    console.log(
      `[STOCK] Product ${product.name}: ${operation} ${qty} (${product.stock} -> ${newStock}) - Reason: ${reason || "N/A"}`,
    )

    return ApiResponse.success(res, updatedProduct, "Estoque atualizado com sucesso")
  } catch (error) {
    console.error("Update product stock error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Remover produto (apenas managers)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Produto removido com sucesso
 */
router.delete("/:id", authenticate, authorize("manager"), auditLogger("DELETE_PRODUCT"), (req, res) => {
  try {
    const { id } = req.params

    const product = db.findById("products", id)

    if (!product) {
      return ApiResponse.error(res, "Produto não encontrado", 404)
    }

    // Check if product belongs to user's barbershop
    if (product.barbershopId !== req.user.barbershopId) {
      return ApiResponse.error(res, "Acesso negado a este produto", 403)
    }

    // Delete product
    const deleted = db.delete("products", id)

    if (!deleted) {
      return ApiResponse.error(res, "Erro ao remover produto", 500)
    }

    return ApiResponse.success(res, null, "Produto removido com sucesso")
  } catch (error) {
    console.error("Delete product error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

/**
 * @swagger
 * /api/products/low-stock:
 *   get:
 *     summary: Obter produtos com estoque baixo (apenas managers)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Produtos com estoque baixo
 */
router.get("/low-stock", authenticate, authorize("manager"), (req, res) => {
  try {
    const barbershopId = req.user.barbershopId

    const lowStockProducts = db
      .findAllByField("products", "barbershopId", barbershopId)
      .filter((product) => product.stock <= product.minStock && product.active)
      .sort((a, b) => a.name.localeCompare(b.name))

    return ApiResponse.success(res, lowStockProducts, "Produtos com estoque baixo obtidos")
  } catch (error) {
    console.error("Get low stock products error:", error)
    return ApiResponse.error(res, "Erro interno do servidor", 500)
  }
})

module.exports = router
