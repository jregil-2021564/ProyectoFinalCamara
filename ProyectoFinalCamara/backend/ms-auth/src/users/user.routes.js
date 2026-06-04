import { Router } from 'express';
import {
  getAllUsers,
  updateUserRole,
  getUserRoles,
  getUsersByRole,
} from './user.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags: [Usuarios]
 *     summary: Obtiene todos los usuarios
 *     description: Devuelve el listado completo de usuarios registrados en el sistema
 *     responses:
 *       200:
 *         description: Listado de usuarios obtenido exitosamente
 */
router.get('/', getAllUsers);

/**
 * @swagger
 * /api/v1/users/{userId}/role:
 *   put:
 *     tags: [Usuarios]
 *     summary: Actualiza el rol de un usuario
 *     description: Cambia el rol asignado a un usuario específico
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario al que se le actualizará el rol
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 description: Nuevo rol a asignar al usuario
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/:userId/role', ...updateUserRole);

/**
 * @swagger
 * /api/v1/users/{userId}/roles:
 *   get:
 *     tags: [Usuarios]
 *     summary: Obtiene los roles de un usuario
 *     description: Devuelve todos los roles asignados a un usuario específico
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Roles del usuario obtenidos exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:userId/roles', ...getUserRoles);

/**
 * @swagger
 * /api/v1/users/by-role/{roleName}:
 *   get:
 *     tags: [Usuarios]
 *     summary: Obtiene usuarios por rol
 *     description: Devuelve todos los usuarios que tienen asignado un rol específico
 *     parameters:
 *       - name: roleName
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del rol a filtrar
 *     responses:
 *       200:
 *         description: Usuarios encontrados exitosamente
 *       404:
 *         description: Rol no encontrado
 */
router.get('/by-role/:roleName', ...getUsersByRole);

export default router;