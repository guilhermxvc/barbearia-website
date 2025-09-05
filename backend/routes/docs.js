const express = require("express")
const router = express.Router()

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Autenticação e autorização
 *   - name: Users
 *     description: Gestão de usuários
 *   - name: Appointments
 *     description: Gestão de agendamentos
 *   - name: Services
 *     description: Gestão de serviços
 *   - name: Products
 *     description: Gestão de produtos
 *   - name: Barbers
 *     description: Gestão de barbeiros
 *   - name: Clients
 *     description: Gestão de clientes
 *   - name: Reports
 *     description: Relatórios e estatísticas
 *   - name: Notifications
 *     description: Sistema de notificações
 *   - name: AI
 *     description: Assistente de IA
 *   - name: Payments
 *     description: Sistema de pagamentos
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Realizar login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: joao@email.com
 *               password:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login realizado com sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Listar agendamentos
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por data específica
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, in_progress, completed, cancelled, no_show]
 *         description: Filtrar por status
 *       - in: query
 *         name: barberId
 *         schema:
 *           type: string
 *         description: Filtrar por barbeiro
 *     responses:
 *       200:
 *         description: Lista de agendamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *   post:
 *     summary: Criar novo agendamento
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - barberId
 *               - serviceId
 *               - date
 *               - time
 *             properties:
 *               barberId:
 *                 type: string
 *                 example: "2"
 *               serviceId:
 *                 type: string
 *                 example: "1"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               time:
 *                 type: string
 *                 example: "14:00"
 *               notes:
 *                 type: string
 *                 example: "Cliente prefere corte baixo"
 *     responses:
 *       201:
 *         description: Agendamento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Agendamento criado com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 */

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Listar serviços
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo
 *     responses:
 *       200:
 *         description: Lista de serviços
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 */

/**
 * @swagger
 * /api/reports/revenue:
 *   get:
 *     summary: Relatório de faturamento
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final
 *       - in: query
 *         name: barberId
 *         schema:
 *           type: string
 *         description: Filtrar por barbeiro
 *     responses:
 *       200:
 *         description: Dados de faturamento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       example: 2500.00
 *                     appointmentsCount:
 *                       type: number
 *                       example: 85
 *                     averageTicket:
 *                       type: number
 *                       example: 29.41
 *                     dailyRevenue:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           revenue:
 *                             type: number
 */

module.exports = router
