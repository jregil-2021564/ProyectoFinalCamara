'use strict';

import { Router }      from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { iniciarCamara, estadoCamara } from './camara.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/camara/estado:
 *   get:
 *     tags: [Cámara]
 *     summary: Obtiene el estado de la cámara
 *     description: Devuelve el estado actual del sistema de cámara. El controller verifica internamente que el usuario tenga rol ADMIN_ROLE
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado de la cámara obtenido exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 *       403:
 *         description: No tienes permisos de administrador
 */
router.get('/estado', validateJWT, estadoCamara);

/**
 * @swagger
 * /api/v1/camara/iniciar:
 *   post:
 *     tags: [Cámara]
 *     summary: Inicia la cámara
 *     description: Inicia el sistema de cámara para el reconocimiento de placas. El controller verifica internamente que el usuario tenga rol ADMIN_ROLE
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               configuracion:
 *                 type: object
 *                 description: Parámetros opcionales de configuración para el inicio de la cámara
 *     responses:
 *       200:
 *         description: Cámara iniciada exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 *       403:
 *         description: No tienes permisos de administrador
 */
router.post('/iniciar', validateJWT, iniciarCamara);

export default router;