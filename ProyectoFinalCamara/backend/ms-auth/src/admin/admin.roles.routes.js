'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { isAdmin } from '../../middlewares/validation.js';
import {
    assignRole,
    removeRole,
    listUsersWithRoles,
    listAvailableRoles,
} from './admin.roles.controller.js';

const router = Router();

// Todos los endpoints requieren JWT válido + rol ADMIN_ROLE
router.use(validateJWT, isAdmin);

/**
 * @swagger
 * /api/v1/admin/roles/assign:
 *   post:
 *     tags: [Admin - Roles]
 *     summary: Asigna un rol a un usuario (solo ADMIN)
 *     description: Permite al administrador asignar un rol específico a cualquier usuario del sistema
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario al que se le asignará el rol
 *               role:
 *                 type: string
 *                 description: Nombre del rol a asignar
 *     responses:
 *       200:
 *         description: Rol asignado exitosamente
 *       400:
 *         description: Datos inválidos o el usuario ya tiene ese rol
 *       401:
 *         description: Token inválido o no proporcionado
 *       403:
 *         description: No tienes permisos de administrador
 *       404:
 *         description: Usuario o rol no encontrado
 */
router.post('/assign', assignRole);

/**
 * @swagger
 * /api/v1/admin/roles/remove:
 *   delete:
 *     tags: [Admin - Roles]
 *     summary: Quita un rol a un usuario (solo ADMIN)
 *     description: Permite al administrador remover un rol específico de un usuario del sistema
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario al que se le quitará el rol
 *               role:
 *                 type: string
 *                 description: Nombre del rol a remover
 *     responses:
 *       200:
 *         description: Rol removido exitosamente
 *       400:
 *         description: Datos inválidos o el usuario no tiene ese rol
 *       401:
 *         description: Token inválido o no proporcionado
 *       403:
 *         description: No tienes permisos de administrador
 *       404:
 *         description: Usuario o rol no encontrado
 */
router.delete('/remove', removeRole);

/**
 * @swagger
 * /api/v1/admin/roles/users:
 *   get:
 *     tags: [Admin - Roles]
 *     summary: Lista usuarios con sus roles (solo ADMIN)
 *     description: Devuelve todos los usuarios del sistema junto con los roles que tienen asignados
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listado de usuarios con roles obtenido exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 *       403:
 *         description: No tienes permisos de administrador
 */
router.get('/users', listUsersWithRoles);

/**
 * @swagger
 * /api/v1/admin/roles/available:
 *   get:
 *     tags: [Admin - Roles]
 *     summary: Lista los roles disponibles (solo ADMIN)
 *     description: Devuelve todos los roles disponibles que pueden ser asignados a los usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles disponibles obtenidos exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 *       403:
 *         description: No tienes permisos de administrador
 */
router.get('/available', listAvailableRoles);

export default router;