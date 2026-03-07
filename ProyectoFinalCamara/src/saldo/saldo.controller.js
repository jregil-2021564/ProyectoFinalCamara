'use strict';

import crypto              from 'crypto';
import mongoose            from 'mongoose';
import { v4 as uuidv4 }   from 'uuid';

import { Tarjeta }  from './tarjeta.model.js';           // MongoDB
import { Recarga }  from './recarga.model.js';           // MongoDB
import { Cuenta }   from '../cuenta/cuenta.model.js';   // PostgreSQL
import { findUserById } from '../../helpers/user-db.js'; // para obtener email/nombre
import {
  sendAlertaRecarga,
  sendAlertaTarjetaAgregada,
} from '../../helpers/email-saldo.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const detectarMarca = (numero) => {
  const n = numero.replace(/\D/g, '');
  if (/^4/.test(n))                             return 'VISA';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'MASTERCARD';
  if (/^3[47]/.test(n))                        return 'AMEX';
  if (/^6(?:011|22126|4[4-9]|5)/.test(n))      return 'DISCOVER';
  return 'OTRA';
};

const luhn = (numero) => {
  const digits = numero.replace(/\D/g, '').split('').map(Number).reverse();
  const suma   = digits.reduce((acc, d, i) => {
    if (i % 2 !== 0) { d *= 2; if (d > 9) d -= 9; }
    return acc + d;
  }, 0);
  return suma % 10 === 0;
};

const fechaVigente = (fechaStr) => {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(fechaStr)) return false;
  const [mm, yy] = fechaStr.split('/').map(Number);
  return new Date(2000 + yy, mm, 1) > new Date();
};

const hashNumero = (numero) =>
  crypto.createHash('sha256').update(numero.replace(/\D/g, '')).digest('hex');

const esObjectIdValido = (id) => mongoose.Types.ObjectId.isValid(id);

// Obtiene el userId como string limpio — maneja Id / id indistintamente
const getUserId = (req) => String(req.user?.Id ?? req.user?.id ?? '').trim();

const MONTO_MIN =   10;
const MONTO_MAX = 5000;

const formatTarjeta = (t) => ({
  id:              t._id,
  alias:           t.alias || `${t.marca} **** ${t.ultimosDigitos}`,
  marca:           t.marca,
  tipo:            t.tipoTarjeta,
  numero:          `**** **** **** ${t.ultimosDigitos}`,
  vencimiento:     t.fechaVencimiento,
  titular:         t.nombreTitular,
  limiteCredito:   `Q${t.limiteCredito.toFixed(2)}`,
  totalRecargado:  `Q${t.totalRecargado.toFixed(2)}`,
  saldoDisponible: `Q${Math.max(0, t.limiteCredito - t.totalRecargado).toFixed(2)}`,
  agregadaEl:      t.createdAt,
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/saldo/mi-saldo
// Solo muestra el saldo y recargas del usuario autenticado
// ─────────────────────────────────────────────────────────────────────────────
export const miSaldo = async (req, res) => {
  try {
    const userId = getUserId(req);

    // Cuenta en PostgreSQL
    const cuenta = await Cuenta.findOne({ where: { UserId: userId } });
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'No tienes una cuenta registrada. Contacta al administrador.',
      });
    }

    const saldo = parseFloat(cuenta.Saldo);

    // Últimas 5 recargas SOLO de este usuario (MongoDB filtra por userId)
    const ultimasRecargas = await Recarga.find({ userId, estado: 'APROBADA' })
      .populate('tarjetaId', 'ultimosDigitos marca')
      .sort({ createdAt: -1 })
      .limit(5);

    // Total histórico recargado por este usuario
    const agregacion     = await Recarga.aggregate([
      { $match: { userId, estado: 'APROBADA' } },
      { $group: { _id: null, total: { $sum: '$monto' } } },
    ]);
    const totalRecargado = agregacion[0]?.total ?? 0;

    // Tarjetas activas con su saldo disponible
    const tarjetas = await Tarjeta.find({ userId, activa: true })
      .select('-tokenNumero -__v')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      cuenta: {
        numeroCuenta:   cuenta.NumeroCuenta,
        saldoActual:    `Q${saldo.toFixed(2)}`,
        saldoNumerico:  saldo,
        puedesPagar:    saldo > 0,
        totalRecargado: `Q${totalRecargado.toFixed(2)}`,
        desde:          cuenta.CreatedAt,
      },
      tarjetas: tarjetas.map(t => ({
        id:              t._id,
        alias:           t.alias || `${t.marca} **** ${t.ultimosDigitos}`,
        marca:           t.marca,
        numero:          `**** **** **** ${t.ultimosDigitos}`,
        limiteCredito:   `Q${t.limiteCredito.toFixed(2)}`,
        totalRecargado:  `Q${t.totalRecargado.toFixed(2)}`,
        saldoDisponible: `Q${Math.max(0, t.limiteCredito - t.totalRecargado).toFixed(2)}`,
      })),
      ultimasRecargas: ultimasRecargas.map(r => ({
        referencia: r.referencia,
        tarjeta:    r.tarjetaId
          ? `${r.tarjetaId.marca} **** ${r.tarjetaId.ultimosDigitos}`
          : 'N/A',
        monto: `Q${r.monto.toFixed(2)}`,
        fecha: r.createdAt,
      })),
    });

  } catch (error) {
    console.error('Error en miSaldo:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/saldo/agregar-tarjeta
// ─────────────────────────────────────────────────────────────────────────────
/**
 * El userId viene del JWT — no se pide en el body.
 * Body: {
 *   numeroTarjeta, fechaVencimiento, cvv, nombreTitular,
 *   tipoTarjeta?   ("CREDITO" | "DEBITO"),
 *   limiteCredito? (Q100 – Q50,000, default Q5,000),
 *   alias?
 * }
 */
export const agregarTarjeta = async (req, res) => {
  try {
    const userId = getUserId(req);

    const {
      numeroTarjeta,
      fechaVencimiento,
      cvv,
      nombreTitular,
      tipoTarjeta   = 'CREDITO',
      limiteCredito = 5000,
      alias         = null,
    } = req.body;

    // 1. Campos obligatorios
    if (!numeroTarjeta || !fechaVencimiento || !cvv || !nombreTitular) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: numeroTarjeta, fechaVencimiento, cvv, nombreTitular',
      });
    }

    // 2. Número + Luhn
    const numeroLimpio = numeroTarjeta.replace(/\D/g, '');
    if (numeroLimpio.length < 13 || numeroLimpio.length > 19) {
      return res.status(400).json({ success: false, message: 'Número de tarjeta inválido' });
    }
    if (!luhn(numeroLimpio)) {
      return res.status(400).json({ success: false, message: 'El número de tarjeta no es válido' });
    }

    // 3. Fecha
    if (!fechaVigente(fechaVencimiento)) {
      return res.status(400).json({
        success: false,
        message: 'La tarjeta está vencida o la fecha tiene formato incorrecto (MM/YY)',
      });
    }

    // 4. CVV
    const marca       = detectarMarca(numeroLimpio);
    const cvvEsValido = marca === 'AMEX' ? /^\d{4}$/.test(cvv) : /^\d{3}$/.test(cvv);
    if (!cvvEsValido) {
      return res.status(400).json({
        success: false,
        message: marca === 'AMEX'
          ? 'Las tarjetas AMEX requieren CVV de 4 dígitos'
          : 'El CVV debe tener 3 dígitos',
      });
    }

    // 5. Tipo tarjeta
    if (!['CREDITO', 'DEBITO'].includes(tipoTarjeta.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'tipoTarjeta debe ser CREDITO o DEBITO' });
    }

    // 6. Límite de crédito
    const limiteNum = parseFloat(limiteCredito);
    if (isNaN(limiteNum) || limiteNum < 100 || limiteNum > 50000) {
      return res.status(400).json({
        success: false,
        message: 'limiteCredito debe estar entre Q100 y Q50,000',
      });
    }

    // 7. ¿Ya existe esta tarjeta?
    const token     = hashNumero(numeroLimpio);
    const existente = await Tarjeta.findOne({ tokenNumero: token });

    if (existente) {
      if (existente.userId === userId && existente.activa) {
        return res.status(409).json({
          success: false,
          message: `Ya tienes esta tarjeta registrada (**** ${existente.ultimosDigitos})`,
        });
      }
      if (existente.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Esta tarjeta ya está asociada a otra cuenta',
        });
      }
      // Reactivar tarjeta inactiva del mismo usuario
      existente.alias            = alias;
      existente.fechaVencimiento = fechaVencimiento;
      existente.nombreTitular    = nombreTitular.trim().toUpperCase();
      existente.tipoTarjeta      = tipoTarjeta.toUpperCase();
      existente.limiteCredito    = limiteNum;
      existente.activa           = true;
      await existente.save();

      // Correo de alerta — no bloquear la respuesta si falla
      setImmediate(async () => {
        try {
          const user = await findUserById(userId);
          if (user) {
            await sendAlertaTarjetaAgregada({
              email:          user.Email,
              nombre:         `${user.Name} ${user.Surname}`,
              marca:          existente.marca,
              ultimosDigitos: existente.ultimosDigitos,
              tipoTarjeta:    existente.tipoTarjeta,
              limiteCredito:  existente.limiteCredito,
              fecha:          new Date().toLocaleString('es-GT'),
            });
          }
        } catch (e) {
          console.error('Error enviando correo tarjeta reactivada:', e.message);
        }
      });

      return res.status(200).json({
        success: true,
        message: `Tarjeta ${marca} **** ${existente.ultimosDigitos} reactivada`,
        tarjeta: formatTarjeta(existente),
      });
    }

    // 8. Crear nueva tarjeta
    const nueva = await Tarjeta.create({
      userId,
      alias,
      ultimosDigitos:   numeroLimpio.slice(-4),
      marca,
      tipoTarjeta:      tipoTarjeta.toUpperCase(),
      tokenNumero:      token,
      fechaVencimiento,
      nombreTitular:    nombreTitular.trim().toUpperCase(),
      limiteCredito:    limiteNum,
      totalRecargado:   0,
      activa:           true,
    });

    // Correo de alerta — no bloquear la respuesta
    setImmediate(async () => {
      try {
        const user = await findUserById(userId);
        if (user) {
          await sendAlertaTarjetaAgregada({
            email:          user.Email,
            nombre:         `${user.Name} ${user.Surname}`,
            marca:          nueva.marca,
            ultimosDigitos: nueva.ultimosDigitos,
            tipoTarjeta:    nueva.tipoTarjeta,
            limiteCredito:  nueva.limiteCredito,
            fecha:          new Date().toLocaleString('es-GT'),
          });
        }
      } catch (e) {
        console.error('Error enviando correo nueva tarjeta:', e.message);
      }
    });

    return res.status(201).json({
      success: true,
      message: `Tarjeta ${marca} **** ${nueva.ultimosDigitos} agregada correctamente`,
      tarjeta: formatTarjeta(nueva),
    });

  } catch (error) {
    console.error('Error en agregarTarjeta:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/saldo/recargar
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Body: { tarjetaId, monto }
 * tarjetaId = _id de MongoDB (24 chars hex) que devuelve /agregar-tarjeta
 */
export const recargarSaldo = async (req, res) => {
  try {
    const userId               = getUserId(req);
    const { tarjetaId, monto } = req.body;

    // 1. Campos
    if (!tarjetaId || monto === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: tarjetaId, monto',
      });
    }

    // 2. Validar que sea ObjectId válido
    if (!esObjectIdValido(tarjetaId)) {
      return res.status(400).json({
        success: false,
        message: 'tarjetaId inválido. Debe ser el id de 24 caracteres que devolvió /agregar-tarjeta',
      });
    }

    // 3. Monto
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum < MONTO_MIN) {
      return res.status(400).json({
        success: false,
        message: `El monto mínimo de recarga es Q${MONTO_MIN.toFixed(2)}`,
      });
    }
    if (montoNum > MONTO_MAX) {
      return res.status(400).json({
        success: false,
        message: `El monto máximo por recarga es Q${MONTO_MAX.toFixed(2)}`,
      });
    }

    // 4. Buscar tarjeta solo por _id
    const tarjeta = await Tarjeta.findById(tarjetaId);
    if (!tarjeta) {
      return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
    }

    // 5. Verificar que pertenece a ESTE usuario
    if (String(tarjeta.userId).trim() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Esta tarjeta no pertenece a tu cuenta',
      });
    }

    // 6. Activa y vigente
    if (!tarjeta.activa) {
      return res.status(400).json({ success: false, message: 'Esta tarjeta está desactivada' });
    }
    if (!fechaVigente(tarjeta.fechaVencimiento)) {
      return res.status(400).json({
        success: false,
        message: `La tarjeta **** ${tarjeta.ultimosDigitos} está vencida`,
      });
    }

    // 7. Verificar límite disponible en la tarjeta
    const disponible = tarjeta.limiteCredito - tarjeta.totalRecargado;
    if (montoNum > disponible) {
      return res.status(400).json({
        success: false,
        message: `Fondos insuficientes en la tarjeta`,
        limiteCredito:   `Q${tarjeta.limiteCredito.toFixed(2)}`,
        totalRecargado:  `Q${tarjeta.totalRecargado.toFixed(2)}`,
        disponible:      `Q${disponible.toFixed(2)}`,
        montoSolicitado: `Q${montoNum.toFixed(2)}`,
      });
    }

    // 8. Cuenta en PostgreSQL
    const cuenta = await Cuenta.findOne({ where: { UserId: userId } });
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'No tienes una cuenta registrada. Contacta al administrador.',
      });
    }

    // 9. Acreditar saldo
    const saldoAnterior = parseFloat(cuenta.Saldo);
    const saldoNuevo    = saldoAnterior + montoNum;
    await cuenta.update({ Saldo: saldoNuevo });

    // 10. Actualizar totalRecargado en la tarjeta
    tarjeta.totalRecargado += montoNum;
    await tarjeta.save();

    // 11. Registrar transacción
    const referencia = uuidv4();
    const recarga    = await Recarga.create({
      userId,
      tarjetaId:     tarjeta._id,
      monto:         montoNum,
      saldoAnterior,
      saldoNuevo,
      estado:        'APROBADA',
      referencia,
      descripcion:   `Recarga con ${tarjeta.marca} **** ${tarjeta.ultimosDigitos}`,
    });

    // 12. Correo de alerta — sin bloquear respuesta
    setImmediate(async () => {
      try {
        const user = await findUserById(userId);
        if (user) {
          await sendAlertaRecarga({
            email:          user.Email,
            nombre:         `${user.Name} ${user.Surname}`,
            marca:          tarjeta.marca,
            ultimosDigitos: tarjeta.ultimosDigitos,
            monto:          montoNum,
            saldoNuevo,
            referencia:     recarga.referencia,
            fecha:          new Date().toLocaleString('es-GT'),
          });
        }
      } catch (e) {
        console.error('Error enviando correo alerta recarga:', e.message);
      }
    });

    return res.status(200).json({
      success: true,
      message: `Se acreditaron Q${montoNum.toFixed(2)} a tu cuenta`,
      comprobante: {
        referencia:        recarga.referencia,
        tarjeta:           `${tarjeta.marca} **** ${tarjeta.ultimosDigitos}`,
        titular:           tarjeta.nombreTitular,
        montoRecargado:    `Q${montoNum.toFixed(2)}`,
        saldoAnterior:     `Q${saldoAnterior.toFixed(2)}`,
        saldoActual:       `Q${saldoNuevo.toFixed(2)}`,
        limiteTarjeta:     `Q${tarjeta.limiteCredito.toFixed(2)}`,
        disponibleTarjeta: `Q${(tarjeta.limiteCredito - tarjeta.totalRecargado).toFixed(2)}`,
        estado:            'APROBADA',
        fecha:             new Date().toLocaleString('es-GT'),
      },
    });

  } catch (error) {
    console.error('Error en recargarSaldo:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/saldo/mis-tarjetas
// ─────────────────────────────────────────────────────────────────────────────
export const misTarjetas = async (req, res) => {
  try {
    const userId   = getUserId(req);
    const tarjetas = await Tarjeta.find({ userId, activa: true })
      .select('-tokenNumero -__v')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success:  true,
      total:    tarjetas.length,
      tarjetas: tarjetas.map(formatTarjeta),
    });
  } catch (error) {
    console.error('Error en misTarjetas:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/saldo/mis-tarjetas/:id
// ─────────────────────────────────────────────────────────────────────────────
export const eliminarTarjeta = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!esObjectIdValido(req.params.id)) {
      return res.status(400).json({ success: false, message: 'ID de tarjeta inválido' });
    }

    const tarjeta = await Tarjeta.findById(req.params.id);
    if (!tarjeta || String(tarjeta.userId).trim() !== userId || !tarjeta.activa) {
      return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
    }

    tarjeta.activa = false;
    await tarjeta.save();

    return res.status(200).json({
      success: true,
      message: `Tarjeta ${tarjeta.marca} **** ${tarjeta.ultimosDigitos} eliminada correctamente`,
    });
  } catch (error) {
    console.error('Error en eliminarTarjeta:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/saldo/historial
// ─────────────────────────────────────────────────────────────────────────────
export const historialRecargas = async (req, res) => {
  try {
    const userId   = getUserId(req);
    const recargas = await Recarga.find({ userId })
      .populate('tarjetaId', 'ultimosDigitos marca tipoTarjeta')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success:  true,
      total:    recargas.length,
      recargas: recargas.map(r => ({
        id:            r._id,
        referencia:    r.referencia,
        tarjeta:       r.tarjetaId
          ? `${r.tarjetaId.marca} **** ${r.tarjetaId.ultimosDigitos}`
          : 'N/A',
        monto:         `Q${r.monto.toFixed(2)}`,
        saldoAnterior: `Q${r.saldoAnterior.toFixed(2)}`,
        saldoNuevo:    `Q${r.saldoNuevo.toFixed(2)}`,
        estado:        r.estado,
        descripcion:   r.descripcion,
        fecha:         r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error en historialRecargas:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};