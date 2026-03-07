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
router.get ('/mi-cuenta',          validateJWT, miCuenta);
router.post('/solicitar-deposito', validateJWT, solicitarDeposito);
router.post('/confirmar-deposito', validateJWT, confirmarDeposito);

// ── Solo admin ────────────────────────────────────────────────────────────────
router.get ('/solicitudes',        validateJWT, isAdmin, listarSolicitudes);
router.post('/aprobar-deposito',   validateJWT, isAdmin, aprobarDeposito);
router.post('/rechazar-deposito',  validateJWT, isAdmin, rechazarDeposito);

export default router;
