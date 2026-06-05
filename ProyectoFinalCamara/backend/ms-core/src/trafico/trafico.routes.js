'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { listarVehiculos } from './trafico.controller.js';
import {
    registrarInfraccion,
    obtenerMultas,
    obtenerMultasPorPlaca,
    registrarVehiculo,
    verMultasPorPlaca,
    validarSaldo,
    aumentarMultas,
    pagarMulta,
    actualizarDatosMulta,
} from './trafico.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/trafico/infracciones:
 *   post:
 *     tags: [Tráfico]
 *     summary: Registra una infracción
 *     description: Endpoint público llamado desde el sistema Python para registrar una infracción de tráfico
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - placa
 *               - tipo
 *             properties:
 *               placa:
 *                 type: string
 *                 description: Placa del vehículo infractor
 *               tipo:
 *                 type: string
 *                 description: Tipo de infracción cometida
 *               descripcion:
 *                 type: string
 *                 description: Descripción detallada de la infracción
 *     responses:
 *       201:
 *         description: Infracción registrada exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/infracciones', registrarInfraccion);

/**
 * @swagger
 * /api/v1/trafico/multas:
 *   get:
 *     tags: [Tráfico]
 *     summary: Obtiene todas las multas
 *     description: Devuelve el listado de todas las multas registradas en el sistema
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listado de multas obtenido exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.get('/multas', validateJWT, obtenerMultas);

/**
 * @swagger
 * /api/v1/trafico/multas/{placa}:
 *   get:
 *     tags: [Tráfico]
 *     summary: Obtiene multas por placa
 *     description: Devuelve todas las multas asociadas a una placa de vehículo específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: placa
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Placa del vehículo
 *     responses:
 *       200:
 *         description: Multas encontradas exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 *       404:
 *         description: No se encontraron multas para esa placa
 */
router.get('/multas/:placa', validateJWT, obtenerMultasPorPlaca);

/**
 * @swagger
 * /api/v1/trafico/vehiculos:
 *   post:
 *     tags: [Tráfico]
 *     summary: Registra un vehículo
 *     description: Registra un nuevo vehículo en el sistema
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - placa
 *               - marca
 *               - modelo
 *             properties:
 *               placa:
 *                 type: string
 *                 description: Placa del vehículo
 *               marca:
 *                 type: string
 *                 description: Marca del vehículo
 *               modelo:
 *                 type: string
 *                 description: Modelo del vehículo
 *               anio:
 *                 type: integer
 *                 description: Año de fabricación
 *     responses:
 *       201:
 *         description: Vehículo registrado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token inválido o no proporcionado
 *       409:
 *         description: La placa ya está registrada
 */
router.post('/vehiculos', validateJWT, registrarVehiculo);

/**
 * @swagger
 * /api/v1/trafico/buscar/{placa}:
 *   get:
 *     tags: [Tráfico]
 *     summary: Busca multas por placa
 *     description: Busca y devuelve el detalle de multas de un vehículo por su placa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: placa
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Placa del vehículo a buscar
 *     responses:
 *       200:
 *         description: Multas encontradas
 *       401:
 *         description: Token inválido o no proporcionado
 *       404:
 *         description: Vehículo no encontrado
 */
router.get('/buscar/:placa', validateJWT, verMultasPorPlaca);

/**
 * @swagger
 * /api/v1/trafico/validar-saldo/{multaId}:
 *   get:
 *     tags: [Tráfico]
 *     summary: Valida saldo para pagar una multa
 *     description: Verifica si el usuario autenticado tiene saldo suficiente para cubrir el monto de la multa indicada
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: multaId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la multa a validar
 *     responses:
 *       200:
 *         description: Validación de saldo realizada
 *       401:
 *         description: Token inválido o no proporcionado
 *       404:
 *         description: Multa no encontrada
 */
router.get('/validar-saldo/:multaId', validateJWT, validarSaldo);

/**
 * @swagger
 * /api/v1/trafico/aumentar-multas:
 *   put:
 *     tags: [Tráfico]
 *     summary: Aumenta el monto de las multas
 *     description: Aplica un incremento al monto de multas pendientes de pago
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               porcentaje:
 *                 type: number
 *                 description: Porcentaje de incremento a aplicar
 *     responses:
 *       200:
 *         description: Multas actualizadas exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.put('/aumentar-multas', validateJWT, aumentarMultas);

/**
 * @swagger
 * /api/v1/trafico/pagar/{multaId}:
 *   post:
 *     tags: [Tráfico]
 *     summary: Paga una multa
 *     description: Procesa el pago de una multa usando el saldo del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: multaId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la multa a pagar
 *     responses:
 *       200:
 *         description: Multa pagada exitosamente
 *       400:
 *         description: Saldo insuficiente
 *       401:
 *         description: Token inválido o no proporcionado
 *       404:
 *         description: Multa no encontrada
 */
router.post('/pagar/:multaId', validateJWT, pagarMulta);

/**
 * @swagger
 * /api/v1/trafico/multas/{multaId}:
 *   put:
 *     tags: [Tráfico]
 *     summary: Actualiza datos de una multa (solo ADMIN)
 *     description: Permite a un administrador actualizar la información de una multa existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: multaId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la multa a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               monto:
 *                 type: number
 *                 description: Nuevo monto de la multa
 *               descripcion:
 *                 type: string
 *                 description: Nueva descripción de la multa
 *               estado:
 *                 type: string
 *                 description: Nuevo estado de la multa
 *     responses:
 *       200:
 *         description: Multa actualizada exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 *       403:
 *         description: No tienes permisos de administrador
 *       404:
 *         description: Multa no encontrada
 */
router.put('/multas/:multaId', validateJWT, actualizarDatosMulta);

router.get('/vehiculos', validateJWT, listarVehiculos);

export default router;