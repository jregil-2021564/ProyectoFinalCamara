'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { pagarMulta, misMultas } from './pago.controller.js';

const router = Router();

// Ambos requieren JWT — solo el dueño de la placa puede ver/pagar sus multas
router.get ('/mis-multas',  validateJWT, misMultas);
router.post('/pagar-multa', validateJWT, pagarMulta);

export default router;