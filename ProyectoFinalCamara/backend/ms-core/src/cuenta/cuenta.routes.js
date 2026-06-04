'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { isAdmin }     from '../../middlewares/validation.js';
import {
  miCuenta,
  solicitarDeposito,
  aprobarDeposito,
  rechazarDeposito,
  confirmarDeposito,
  listarSolicitudes,
} from './cuenta.controller.js';

const router = Router();

// ── Usuario autenticado ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/cuenta/mi-cuenta:
 *   get:
 *     tags: [Cuenta]
 *     summary: Obtiene los datos de la cuenta del usuario
 *     description: Devuelve la información de la cuenta bancaria del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos de cuenta obtenidos exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.get('/mi-cuenta', validateJWT, miCuenta);

/**
 * @swagger
 * /api/v1/cuenta/solicitar-deposito:
 *   post:
 *     tags: [Cuenta]
 *     summary: Solicita un depósito
 *     description: El usuario autenticado solicita un depósito que deberá ser aprobado por un administrador
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monto
 *             properties:
 *               monto:
 *                 type: number
 *                 description: Monto del depósito a solicitar
 *               descripcion:
 *                 type: string
 *                 description: Descripción u observación del depósito
 *     responses:
 *       201:
 *         description: Solicitud de depósito creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.post('/solicitar-deposito', validateJWT, solicitarDeposito);

/**
 * @swagger
 * /api/v1/cuenta/confirmar-deposito:
 *   post:
 *     tags: [Cuenta]
 *     summary: Confirma un depósito pendiente
 *     description: El usuario confirma la recepción o realización de un depósito previamente solicitado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - depositoId
 *             properties:
 *               depositoId:
 *                 type: string
 *                 description: ID del depósito a confirmar
 *     responses:
 *       200:
 *         description: Depósito confirmado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token inválido o no proporcionado
 *       404:
 *         description: Solicitud de depósito no encontrada
 */
router.post('/confirmar-deposito', validateJWT, confirmarDeposito);

// ── Solo admin ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/cuenta/solicitudes:
 *   get:
 *     tags: [Cuenta]
 *     summary: Lista solicitudes de depósito (solo ADMIN)
 *     description: Devuelve todas las solicitudes de depósito pendientes para revisión por el administrador
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Solicitudes obtenidas exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 *       403:
 *         description: No tienes permisos de administrador
 */
router.get('/solicitudes', validateJWT, isAdmin, listarSolicitudes);

/**
 * @swagger
 * /api/v1/cuenta/aprobar-deposito:
 *   post:
 *     tags: [Cuenta]
 *     summary: Aprueba una solicitud de depósito (solo ADMIN)
 *     description: El administrador aprueba una solicitud de depósito pendiente, acreditando el monto a la cuenta del usuario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - depositoId
 *             properties:
 *               depositoId:
 *                 type: string
 *                 description: ID de la solicitud de depósito a aprobar
 *     responses:
 *       200:
 *         description: Depósito aprobado exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 *       403:
 *         description: No tienes permisos de administrador
 *       404:
 *         description: Solicitud de depósito no encontrada
 */
router.post('/aprobar-deposito', validateJWT, isAdmin, aprobarDeposito);

/**
 * @swagger
 * /api/v1/cuenta/rechazar-deposito:
 *   post:
 *     tags: [Cuenta]
 *     summary: Rechaza una solicitud de depósito (solo ADMIN)
 *     description: El administrador rechaza una solicitud de depósito pendiente
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - depositoId
 *             properties:
 *               depositoId:
 *                 type: string
 *                 description: ID de la solicitud de depósito a rechazar
 *               motivo:
 *                 type: string
 *                 description: Motivo del rechazo
 *     responses:
 *       200:
 *         description: Depósito rechazado exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 *       403:
 *         description: No tienes permisos de administrador
 *       404:
 *         description: Solicitud de depósito no encontrada
 */
router.post('/rechazar-deposito', validateJWT, isAdmin, rechazarDeposito);

export default router;