'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
  miSaldo,
  agregarTarjeta,
  verificarTarjeta,
  recargarSaldo,
  misTarjetas,
  eliminarTarjeta,
  historialRecargas,
} from './saldo.controller.js';

const router = Router();

// ── Saldo ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/saldo/mi-saldo:
 *   get:
 *     tags: [Saldo]
 *     summary: Obtiene el saldo del usuario
 *     description: Devuelve el saldo disponible del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saldo obtenido exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.get('/mi-saldo', validateJWT, miSaldo);

// ── Tarjetas ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/saldo/mis-tarjetas:
 *   get:
 *     tags: [Saldo]
 *     summary: Lista las tarjetas del usuario
 *     description: Devuelve todas las tarjetas de pago registradas por el usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tarjetas obtenidas exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.get('/mis-tarjetas', validateJWT, misTarjetas);

/**
 * @swagger
 * /api/v1/saldo/agregar-tarjeta:
 *   post:
 *     tags: [Saldo]
 *     summary: Agrega una tarjeta (Paso 1 - envía código al correo)
 *     description: Inicia el proceso de agregar una tarjeta enviando un código de verificación al correo del usuario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero
 *               - titular
 *               - expiracion
 *               - cvv
 *             properties:
 *               numero:
 *                 type: string
 *                 description: Número de la tarjeta
 *               titular:
 *                 type: string
 *                 description: Nombre del titular
 *               expiracion:
 *                 type: string
 *                 description: Fecha de expiración (MM/AA)
 *               cvv:
 *                 type: string
 *                 description: Código de seguridad
 *     responses:
 *       200:
 *         description: Código de verificación enviado al correo
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.post('/agregar-tarjeta', validateJWT, agregarTarjeta);

/**
 * @swagger
 * /api/v1/saldo/verificar-tarjeta:
 *   post:
 *     tags: [Saldo]
 *     summary: Verifica y confirma la tarjeta (Paso 2 - confirma con el código)
 *     description: Completa el proceso de agregar tarjeta confirmando el código recibido por correo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *             properties:
 *               codigo:
 *                 type: string
 *                 description: Código de verificación recibido por correo
 *     responses:
 *       200:
 *         description: Tarjeta verificada y agregada exitosamente
 *       400:
 *         description: Código inválido o expirado
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.post('/verificar-tarjeta', validateJWT, verificarTarjeta);

/**
 * @swagger
 * /api/v1/saldo/mis-tarjetas/{id}:
 *   delete:
 *     tags: [Saldo]
 *     summary: Elimina una tarjeta
 *     description: Elimina una tarjeta de pago registrada del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la tarjeta a eliminar
 *     responses:
 *       200:
 *         description: Tarjeta eliminada exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 *       404:
 *         description: Tarjeta no encontrada
 */
router.delete('/mis-tarjetas/:id', validateJWT, eliminarTarjeta);

// ── Recargas ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/saldo/recargar:
 *   post:
 *     tags: [Saldo]
 *     summary: Recarga saldo
 *     description: Realiza una recarga de saldo usando una tarjeta registrada del usuario
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
 *               - tarjetaId
 *             properties:
 *               monto:
 *                 type: number
 *                 description: Monto a recargar
 *               tarjetaId:
 *                 type: string
 *                 description: ID de la tarjeta a usar para el pago
 *     responses:
 *       200:
 *         description: Saldo recargado exitosamente
 *       400:
 *         description: Datos inválidos o tarjeta sin fondos
 *       401:
 *         description: Token inválido o no proporcionado
 *       404:
 *         description: Tarjeta no encontrada
 */
router.post('/recargar', validateJWT, recargarSaldo);

/**
 * @swagger
 * /api/v1/saldo/historial:
 *   get:
 *     tags: [Saldo]
 *     summary: Historial de recargas
 *     description: Devuelve el historial de todas las recargas realizadas por el usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial obtenido exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.get('/historial', validateJWT, historialRecargas);

export default router;