'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { pagarMulta, misMultas } from './pago.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/pagos/mis-multas:
 *   get:
 *     tags: [Pagos]
 *     summary: Obtiene las multas del usuario autenticado
 *     description: Devuelve todas las multas asociadas a las placas del usuario autenticado. Solo el dueño de la placa puede ver sus propias multas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Multas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 multas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: ID de la multa
 *                       placa:
 *                         type: string
 *                         description: Placa del vehículo
 *                       monto:
 *                         type: number
 *                         description: Monto de la multa
 *                       estado:
 *                         type: string
 *                         description: Estado de la multa (pendiente/pagada)
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.get('/mis-multas', validateJWT, misMultas);

/**
 * @swagger
 * /api/v1/pagos/pagar-multa:
 *   post:
 *     tags: [Pagos]
 *     summary: Paga una multa
 *     description: Procesa el pago de una multa usando el saldo disponible del usuario. Solo el dueño de la placa puede pagar sus propias multas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - multaId
 *             properties:
 *               multaId:
 *                 type: string
 *                 description: ID de la multa a pagar
 *     responses:
 *       200:
 *         description: Multa pagada exitosamente
 *       400:
 *         description: Saldo insuficiente o multa ya pagada
 *       401:
 *         description: Token inválido o no proporcionado
 *       403:
 *         description: No tienes permiso para pagar esta multa
 *       404:
 *         description: Multa no encontrada
 */
router.post('/pagar-multa', validateJWT, pagarMulta);

export default router;