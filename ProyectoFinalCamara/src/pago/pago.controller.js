'use strict';

import { Multa } from '../trafico/multa.model.js';
import { Cuenta } from '../cuenta/cuenta.model.js';
import { UserProfile } from '../users/user.model.js';

// ── POST /api/v1/pagos/pagar-multa ───────────────────────────────────────────
// El usuario paga una multa con su saldo
export const pagarMulta = async (req, res) => {
  try {
    const { multaId } = req.body;

    if (!multaId) {
      return res.status(400).json({ success: false, message: 'multaId es requerido' });
    }

    // 1. Buscar la multa en MongoDB
    const multa = await Multa.findById(multaId);
    if (!multa) {
      return res.status(404).json({ success: false, message: 'Multa no encontrada' });
    }

    // 2. Verificar que la multa esté pendiente
    if (multa.estado !== 'PENDIENTE') {
      return res.status(400).json({
        success: false,
        message: `Esta multa ya fue ${multa.estado.toLowerCase()}`,
      });
    }

    // 3. Verificar que la placa de la multa coincida con la placa del usuario
    const perfil = await UserProfile.findOne({ where: { UserId: req.user.Id } });
    if (!perfil || !perfil.Placa) {
      return res.status(400).json({
        success: false,
        message: 'No tienes una placa registrada en tu perfil',
      });
    }

    if (perfil.Placa.toUpperCase() !== multa.placa.toUpperCase()) {
      return res.status(403).json({
        success: false,
        message: `Esta multa pertenece a la placa ${multa.placa}, tu placa registrada es ${perfil.Placa}`,
      });
    }

    // 4. Buscar la cuenta del usuario
    const cuenta = await Cuenta.findOne({ where: { UserId: req.user.Id } });
    if (!cuenta) {
      return res.status(404).json({ success: false, message: 'No tienes una cuenta registrada' });
    }

    // 5. Verificar saldo suficiente
    const saldoActual = parseFloat(cuenta.Saldo);
    const montoMulta  = parseFloat(multa.monto_multa);

    if (saldoActual < montoMulta) {
      return res.status(400).json({
        success: false,
        message: `Saldo insuficiente. Tu saldo es Q${saldoActual.toFixed(2)} y la multa es Q${montoMulta.toFixed(2)}. Realiza un depósito primero.`,
        saldoActual:  `Q${saldoActual.toFixed(2)}`,
        montoMulta:   `Q${montoMulta.toFixed(2)}`,
        diferencia:   `Q${(montoMulta - saldoActual).toFixed(2)}`,
      });
    }

    // 6. Descontar saldo y marcar multa como PAGADA
    const nuevoSaldo = saldoActual - montoMulta;
    await cuenta.update({ Saldo: nuevoSaldo });
    await multa.updateOne({ estado: 'PAGADA' });

    return res.status(200).json({
      success: true,
      message: `Multa pagada exitosamente.`,
      recibo: {
        multaId:        multa._id,
        placa:          multa.placa,
        tipoInfraccion: multa.tipo_infraccion,
        montoPagado:    `Q${montoMulta.toFixed(2)}`,
        saldoAnterior:  `Q${saldoActual.toFixed(2)}`,
        saldoActual:    `Q${nuevoSaldo.toFixed(2)}`,
        estado:         'PAGADA',
        fechaPago:      new Date().toLocaleString('es-GT'),
      },
    });
  } catch (error) {
    console.error('Error en pagarMulta:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ── GET /api/v1/pagos/mis-multas ─────────────────────────────────────────────
// El usuario ve solo sus propias multas (por su placa)
export const misMultas = async (req, res) => {
  try {
    const perfil = await UserProfile.findOne({ where: { UserId: req.user.Id } });

    if (!perfil || !perfil.Placa) {
      return res.status(400).json({
        success: false,
        message: 'No tienes una placa registrada en tu perfil',
      });
    }

    const multas = await Multa.find({ placa: perfil.Placa.toUpperCase() }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      placa:  perfil.Placa,
      total:  multas.length,
      multas: multas.map(m => ({
        id:             m._id,
        placa:          m.placa,
        tipoInfraccion: m.tipo_infraccion,
        velocidad:      m.velocidad,
        pasoRojo:       m.paso_rojo,
        montoMulta:     `Q${parseFloat(m.monto_multa).toFixed(2)}`,
        estado:         m.estado,
        modeloDetectado: m.modelo_detectado,
        colorDetectado:  m.color_detectado,
        anioDetectado:   m.anio_detectado,
        fecha:          m.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error en misMultas:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};