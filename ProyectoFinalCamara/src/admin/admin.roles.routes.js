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

router.post('/assign', assignRole);         // Asignar rol a usuario
router.delete('/remove', removeRole);         // Quitar rol a usuario
router.get('/users', listUsersWithRoles); // Ver usuarios con sus roles
router.get('/available', listAvailableRoles); // Ver roles disponibles

export default router;