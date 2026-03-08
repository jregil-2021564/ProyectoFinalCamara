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
router.get   ('/mi-saldo',          validateJWT, miSaldo);

// ── Tarjetas ──────────────────────────────────────────────────────────────────
router.get   ('/mis-tarjetas',      validateJWT, misTarjetas);
router.post  ('/agregar-tarjeta',   validateJWT, agregarTarjeta);   // PASO 1: envía código al correo
router.post  ('/verificar-tarjeta', validateJWT, verificarTarjeta); // PASO 2: confirma con el código
router.delete('/mis-tarjetas/:id',  validateJWT, eliminarTarjeta);

// ── Recargas ──────────────────────────────────────────────────────────────────
router.post  ('/recargar',          validateJWT, recargarSaldo);
router.get   ('/historial',         validateJWT, historialRecargas);

export default router;