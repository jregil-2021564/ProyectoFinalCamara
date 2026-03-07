'use strict';

import { Router }     from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { iniciarCamara, estadoCamara } from './camara.controller.js';

const router = Router();

// Ambas rutas requieren JWT — el controller verifica ADMIN_ROLE internamente
router.get ('/estado',  validateJWT, estadoCamara);
router.post('/iniciar', validateJWT, iniciarCamara);

export default router;