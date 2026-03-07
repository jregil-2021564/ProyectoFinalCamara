'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
  miSaldo,
  agregarTarjeta,
  recargarSaldo,
  misTarjetas,
  eliminarTarjeta,
  historialRecargas,
} from './saldo.controller.js';

const router = Router();

// ── Saldo ─────────────────────────────────────────────────────────────────────
router.get   ('/mi-saldo',         validateJWT, miSaldo);

// ── Tarjetas ──────────────────────────────────────────────────────────────────
router.get   ('/mis-tarjetas',     validateJWT, misTarjetas);
router.post  ('/agregar-tarjeta',  validateJWT, agregarTarjeta);
router.delete('/mis-tarjetas/:id', validateJWT, eliminarTarjeta);

// ── Recargas ──────────────────────────────────────────────────────────────────
router.post  ('/recargar',         validateJWT, recargarSaldo);
router.get   ('/historial',        validateJWT, historialRecargas);

export default router;