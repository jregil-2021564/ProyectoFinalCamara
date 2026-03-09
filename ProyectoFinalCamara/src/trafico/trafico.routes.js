'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
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

// Público - llamado desde Python
router.post('/infracciones', registrarInfraccion);

// Protegidos con JWT
router.get('/multas', validateJWT, obtenerMultas);
router.get('/multas/:placa', validateJWT, obtenerMultasPorPlaca);
router.post('/vehiculos', validateJWT, registrarVehiculo);

// Agregando parte Hugo Benjamín Samayoa Díaz - 2021462
router.get('/buscar/:placa', validateJWT, verMultasPorPlaca);
router.get('/validar-saldo/:multaId', validateJWT, validarSaldo);
router.put('/aumentar-multas', validateJWT, aumentarMultas);
router.post('/pagar/:multaId', validateJWT, pagarMulta);

// Solo ADMIN_ROLE - actualizar datos de multa
router.put('/multas/:multaId', validateJWT, actualizarDatosMulta);

export default router;