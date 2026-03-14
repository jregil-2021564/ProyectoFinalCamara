'use strict';

import { spawn }         from 'child_process';
import path              from 'path';
import { fileURLToPath } from 'url';
import { Multa }         from '../trafico/multa.model.js';
import { getUserRoleNames } from '../../helpers/role-db.js';

const __dirname     = path.dirname(fileURLToPath(import.meta.url));
const PYTHON_SCRIPT = path.resolve(__dirname, '../../python/speed_detector.py');
const PYTHON_CMD    = process.platform === 'win32' ? 'python' : 'python3';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/camara/iniciar
// Solo ADMIN_ROLE — activa la cámara en background
// Body: {} (placa opcional)
// ─────────────────────────────────────────────────────────────────────────────
export const iniciarCamara = async (req, res) => {
  try {
    const userId = String(req.user?.Id ?? req.user?.id ?? '').trim();

    // 1. Verificar ADMIN_ROLE
    const roles = req.user?.UserRoles?.map(ur => ur.Role?.Name).filter(Boolean)
      ?? await getUserRoleNames(userId);

    if (!roles.includes('ADMIN_ROLE')) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores pueden activar la cámara.',
      });
    }

    // 2. Placa opcional — si no viene, monitorea todos los vehículos
    const { placa } = req.body ?? {};
    const placaLimpia = placa?.trim().toUpperCase() || 'TODOS';

    // 3. Responder de inmediato — la cámara corre en background
    res.status(200).json({
      success: true,
      message: `Cámara iniciada. Monitoreando: ${placaLimpia}. La ventana se abrió en el servidor.`,
      placa:   placaLimpia,
      nota:    'Presiona Q en la ventana para cerrar. Las multas se registran automáticamente.',
    });

    // 4. Lanzar Python en background
    console.log(`\n[CÁMARA] ▶ Iniciando vigilancia (${placaLimpia})...`);

    const args = placaLimpia !== 'TODOS' ? [PYTHON_SCRIPT, placaLimpia] : [PYTHON_SCRIPT];

    const proc = spawn(PYTHON_CMD, args, {
      stdio:    ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    let stdoutData = '';

    proc.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    proc.stderr.on('data', (data) => {
      process.stdout.write(`[PYTHON] ${data.toString()}`);
    });

    proc.on('close', async (code) => {
      console.log(`\n[CÁMARA] ■ Script cerrado (código ${code})`);

      if (!stdoutData.trim()) {
        console.warn('[CÁMARA] Python no devolvió datos de resultado.');
        return;
      }

      try {
        const resultado = JSON.parse(stdoutData.trim());

        if (resultado.error) {
          console.error('[CÁMARA] Error de Python:', resultado.error);
          return;
        }

        const { plate, plate_ocr, violations, max_speed, ran_red, match } = resultado;

        console.log(`[CÁMARA] Placa objetivo : ${plate}`);
        console.log(`[CÁMARA] OCR detectó    : ${plate_ocr || 'ninguna'} | Coincide: ${match}`);
        console.log(`[CÁMARA] Velocidad máx  : ${max_speed} km/h | Pasó rojo: ${ran_red}`);

        if (!violations || violations.length === 0) {
          console.log(`[CÁMARA] Sin infracciones para ${plate}`);
          return;
        }

        for (const v of violations) {
          const esVelocidad = v.reason.toLowerCase().includes('velocidad');

          await Multa.create({
            placa:            plate,
            tipo_infraccion:  esVelocidad ? 'VELOCIDAD' : 'SEMAFORO_ROJO',
            velocidad:        esVelocidad ? max_speed : null,
            paso_rojo:        ran_red,
            monto_multa:      v.amount,
            estado:           'PENDIENTE',
            modelo_detectado: plate_ocr || null,
          });

          console.log(`[MULTA ✓] ${plate} — ${v.reason} — Q${v.amount}`);
        }

        console.log(`[CÁMARA] ${violations.length} multa(s) registrada(s) para ${plate}\n`);

      } catch (parseError) {
        console.error('[CÁMARA] Error parseando resultado:', parseError.message);
        console.error('[CÁMARA] stdout raw:', stdoutData);
      }
    });

    proc.on('error', (err) => {
      console.error('[CÁMARA] Error lanzando Python:', err.message);
      if (err.code === 'ENOENT') {
        console.error(`[CÁMARA] Verifica que Python esté instalado. Comando usado: ${PYTHON_CMD}`);
      }
    });

  } catch (error) {
    console.error('Error en iniciarCamara:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/camara/estado
// ─────────────────────────────────────────────────────────────────────────────
export const estadoCamara = async (req, res) => {
  try {
    const userId = String(req.user?.Id ?? req.user?.id ?? '').trim();

    const roles = req.user?.UserRoles?.map(ur => ur.Role?.Name).filter(Boolean)
      ?? await getUserRoleNames(userId);

    if (!roles.includes('ADMIN_ROLE')) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Sistema de cámara activo.',
      uso:     'POST /api/v1/camara/iniciar  —  body vacío o { "placa": "P-123ABC" }',
    });

  } catch (error) {
    console.error('Error en estadoCamara:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};