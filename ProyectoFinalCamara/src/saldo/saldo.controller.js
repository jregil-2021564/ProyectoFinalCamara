'use strict';

import crypto             from 'crypto';
import mongoose           from 'mongoose';
import { v4 as uuidv4 }  from 'uuid';

import { Tarjeta, LIMITE_POR_MARCA } from './tarjeta.model.js';
import { Recarga }                   from './recarga.model.js';
import { Cuenta }                    from '../cuenta/cuenta.model.js';
import { findUserById }              from '../../helpers/user-db.js';
import {
  sendVerificacionTarjeta,
  sendAlertaTarjetaAgregada,
  sendAlertaRecarga,
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

const getUserId = (req) => String(req.user?.Id ?? req.user?.id ?? '').trim();

// Genera token numérico de 6 dígitos
const generarToken6 = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const MONTO_MIN =   10;
const MONTO_MAX = 5000;
const TOKEN_EXPIRY_MINUTES = 10;

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
  verificada:      t.verificada,
  agregadaEl:      t.createdAt,
});


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/saldo/agregar-tarjeta
// PASO 1 — Valida la tarjeta y envía código al correo del usuario
// La tarjeta queda guardada pero NO verificada hasta que confirme el token
// ─────────────────────────────────────────────────────────────────────────────
export const agregarTarjeta = async (req, res) => {
  try {
    const userId = getUserId(req);

    const {
      numeroTarjeta,
      fechaVencimiento,
      cvv,
      nombreTitular,
      tipoTarjeta = 'CREDITO',
      alias       = null,
    } = req.body;

    // 1. Campos obligatorios
    if (!numeroTarjeta || !fechaVencimiento || !cvv || !nombreTitular) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: numeroTarjeta, fechaVencimiento, cvv, nombreTitular',
      });
    }

    // 2. Número de tarjeta — longitud y Luhn
    const numeroLimpio = numeroTarjeta.replace(/\D/g, '');
    if (numeroLimpio.length < 13 || numeroLimpio.length > 19) {
      return res.status(400).json({
        success: false,
        message: 'Número de tarjeta inválido (debe tener entre 13 y 19 dígitos)',
      });
    }
    if (!luhn(numeroLimpio)) {
      return res.status(400).json({
        success: false,
        message: 'El número de tarjeta no es válido',
      });
    }

    // 3. Fecha de vencimiento
    if (!fechaVigente(fechaVencimiento)) {
      return res.status(400).json({
        success: false,
        message: 'La tarjeta está vencida o la fecha tiene formato incorrecto (MM/YY)',
      });
    }

    // 4. CVV — 3 dígitos para todas, 4 para AMEX
    const marca       = detectarMarca(numeroLimpio);
    const cvvValido   = marca === 'AMEX' ? /^\d{4}$/.test(cvv) : /^\d{3}$/.test(cvv);
    if (!cvvValido) {
      return res.status(400).json({
        success: false,
        message: marca === 'AMEX'
          ? 'Las tarjetas AMEX requieren CVV de 4 dígitos'
          : 'El CVV debe tener 3 dígitos',
      });
    }

    // 5. Tipo de tarjeta
    if (!['CREDITO', 'DEBITO'].includes(tipoTarjeta.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'tipoTarjeta debe ser CREDITO o DEBITO',
      });
    }

    // 6. Nombre del titular — no vacío, solo letras y espacios
    const nombreLimpio = nombreTitular.trim().toUpperCase();
    if (nombreLimpio.length < 3 || !/^[A-ZÁÉÍÓÚÑÜ\s]+$/i.test(nombreLimpio)) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del titular es inválido (solo letras y espacios)',
      });
    }

    // 7. Límite fijo por marca — el usuario NO lo elige
    const limiteCredito = LIMITE_POR_MARCA[marca] ?? 50000;

    // 8. ¿Ya existe esta tarjeta?
    const tokenNum  = hashNumero(numeroLimpio);
    const existente = await Tarjeta.findOne({ tokenNumero: tokenNum });

    if (existente) {
      if (existente.userId === userId) {
        if (existente.activa && existente.verificada) {
          return res.status(409).json({
            success: false,
            message: `Ya tienes esta tarjeta registrada y verificada (**** ${existente.ultimosDigitos})`,
          });
        }
        if (existente.activa && !existente.verificada) {
          // Reenviar token de verificación
          const nuevoToken  = generarToken6();
          const expiry      = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);
          existente.tokenVerificacion       = nuevoToken;
          existente.tokenVerificacionExpiry = expiry;
          await existente.save();

          const user = await findUserById(userId);
          if (user) {
            await sendVerificacionTarjeta({
              email:          user.Email,
              nombre:         `${user.Name} ${user.Surname}`,
              marca:          existente.marca,
              ultimosDigitos: existente.ultimosDigitos,
              token:          nuevoToken,
            });
          }

          return res.status(200).json({
            success: true,
            message: `Esta tarjeta ya está pendiente de verificación. Se reenvió el código a tu correo.`,
            tarjetaId: existente._id,
            siguientePaso: 'POST /api/v1/saldo/verificar-tarjeta con el código recibido',
          });
        }
      }
      if (existente.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Esta tarjeta ya está asociada a otra cuenta',
        });
      }
    }

    // 9. Obtener datos del usuario para enviar el correo
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // 10. Generar token de verificación de 6 dígitos
    const tokenVerif = generarToken6();
    const expiry     = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    // 11. Guardar tarjeta como NO verificada
    const nuevaTarjeta = await Tarjeta.create({
      userId,
      alias,
      ultimosDigitos:          numeroLimpio.slice(-4),
      marca,
      tipoTarjeta:             tipoTarjeta.toUpperCase(),
      tokenNumero:             tokenNum,
      fechaVencimiento,
      nombreTitular:           nombreLimpio,
      limiteCredito,           // fijo por marca, el usuario no lo eligió
      totalRecargado:          0,
      verificada:              false,
      tokenVerificacion:       tokenVerif,
      tokenVerificacionExpiry: expiry,
      activa:                  true,
    });

    // 12. Enviar código al correo del usuario
    await sendVerificacionTarjeta({
      email:          user.Email,
      nombre:         `${user.Name} ${user.Surname}`,
      marca,
      ultimosDigitos: nuevaTarjeta.ultimosDigitos,
      token:          tokenVerif,
    });

    return res.status(201).json({
      success: true,
      message: `Se envió un código de verificación a ${user.Email}. Tienes ${TOKEN_EXPIRY_MINUTES} minutos para confirmarlo.`,
      tarjetaId:     nuevaTarjeta._id,
      marca,
      ultimosDigitos: nuevaTarjeta.ultimosDigitos,
      limiteCredito: `Q${limiteCredito.toFixed(2)}`,
      siguientePaso: 'POST /api/v1/saldo/verificar-tarjeta con el código recibido en tu correo',
    });

  } catch (error) {
    console.error('Error en agregarTarjeta:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/saldo/verificar-tarjeta
// PASO 2 — El usuario pone el token de 6 dígitos recibido en su correo
// ─────────────────────────────────────────────────────────────────────────────
export const verificarTarjeta = async (req, res) => {
  try {
    const userId        = getUserId(req);
    const { token }     = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'El token de verificación es requerido',
      });
    }

    // Validar formato: exactamente 6 dígitos
    if (!/^\d{6}$/.test(String(token))) {
      return res.status(400).json({
        success: false,
        message: 'El token debe ser un código de 6 dígitos',
      });
    }

    // Buscar tarjeta pendiente de verificación de este usuario
    const tarjeta = await Tarjeta.findOne({
      userId,
      verificada:        false,
      activa:            true,
      tokenVerificacion: String(token),
    });

    if (!tarjeta) {
      return res.status(400).json({
        success: false,
        message: 'Código incorrecto o no tienes ninguna tarjeta pendiente de verificación',
      });
    }

    // Verificar que el token no haya expirado
    if (!tarjeta.tokenVerificacionExpiry || tarjeta.tokenVerificacionExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'El código expiró. Agrega la tarjeta nuevamente para recibir un nuevo código.',
      });
    }

    // Activar la tarjeta
    tarjeta.verificada              = true;
    tarjeta.tokenVerificacion       = null;
    tarjeta.tokenVerificacionExpiry = null;
    await tarjeta.save();

    // Correo de confirmación
    setImmediate(async () => {
      try {
        const user = await findUserById(userId);
        if (user) {
          await sendAlertaTarjetaAgregada({
            email:          user.Email,
            nombre:         `${user.Name} ${user.Surname}`,
            marca:          tarjeta.marca,
            ultimosDigitos: tarjeta.ultimosDigitos,
            tipoTarjeta:    tarjeta.tipoTarjeta,
            limiteCredito:  tarjeta.limiteCredito,
            fecha:          new Date().toLocaleString('es-GT'),
          });
        }
      } catch (e) {
        console.error('Error enviando correo confirmación tarjeta:', e.message);
      }
    });

    return res.status(200).json({
      success: true,
      message: `Tarjeta ${tarjeta.marca} **** ${tarjeta.ultimosDigitos} verificada y activada correctamente`,
      tarjeta: formatTarjeta(tarjeta),
    });

  } catch (error) {
    console.error('Error en verificarTarjeta:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/saldo/mi-saldo
// ─────────────────────────────────────────────────────────────────────────────
export const miSaldo = async (req, res) => {
  try {
    const userId = getUserId(req);

    const cuenta = await Cuenta.findOne({ where: { UserId: userId } });
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'No tienes una cuenta registrada. Contacta al administrador.',
      });
    }

    const saldo = parseFloat(cuenta.Saldo);

    const ultimasRecargas = await Recarga.find({ userId, estado: 'APROBADA' })
      .populate('tarjetaId', 'ultimosDigitos marca')
      .sort({ createdAt: -1 })
      .limit(5);

    const agregacion     = await Recarga.aggregate([
      { $match: { userId, estado: 'APROBADA' } },
      { $group: { _id: null, total: { $sum: '$monto' } } },
    ]);
    const totalRecargado = agregacion[0]?.total ?? 0;

    // Solo tarjetas VERIFICADAS
    const tarjetas = await Tarjeta.find({ userId, activa: true, verificada: true })
      .select('-tokenNumero -tokenVerificacion -tokenVerificacionExpiry -__v')
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
// POST /api/v1/saldo/recargar
// Solo permite recargar con tarjetas VERIFICADAS
// ─────────────────────────────────────────────────────────────────────────────
export const recargarSaldo = async (req, res) => {
  try {
    const userId               = getUserId(req);
    const { tarjetaId, monto } = req.body;

    if (!tarjetaId || monto === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: tarjetaId, monto',
      });
    }

    if (!esObjectIdValido(tarjetaId)) {
      return res.status(400).json({
        success: false,
        message: 'tarjetaId inválido. Debe ser el id de 24 caracteres que devolvió /agregar-tarjeta',
      });
    }

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

    const tarjeta = await Tarjeta.findById(tarjetaId);
    if (!tarjeta) {
      return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
    }

    if (String(tarjeta.userId).trim() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Esta tarjeta no pertenece a tu cuenta',
      });
    }

    if (!tarjeta.activa) {
      return res.status(400).json({ success: false, message: 'Esta tarjeta está desactivada' });
    }

    // Bloquear si no está verificada
    if (!tarjeta.verificada) {
      return res.status(403).json({
        success: false,
        message: 'Esta tarjeta no está verificada. Completa la verificación primero.',
        siguientePaso: 'POST /api/v1/saldo/verificar-tarjeta con el código enviado a tu correo',
      });
    }

    if (!fechaVigente(tarjeta.fechaVencimiento)) {
      return res.status(400).json({
        success: false,
        message: `La tarjeta **** ${tarjeta.ultimosDigitos} está vencida`,
      });
    }

    const disponible = tarjeta.limiteCredito - tarjeta.totalRecargado;
    if (montoNum > disponible) {
      return res.status(400).json({
        success: false,
        message: 'Fondos insuficientes en la tarjeta',
        limiteCredito:   `Q${tarjeta.limiteCredito.toFixed(2)}`,
        totalRecargado:  `Q${tarjeta.totalRecargado.toFixed(2)}`,
        disponible:      `Q${disponible.toFixed(2)}`,
        montoSolicitado: `Q${montoNum.toFixed(2)}`,
      });
    }

    const cuenta = await Cuenta.findOne({ where: { UserId: userId } });
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'No tienes una cuenta registrada. Contacta al administrador.',
      });
    }

    const saldoAnterior = parseFloat(cuenta.Saldo);
    const saldoNuevo    = saldoAnterior + montoNum;
    await cuenta.update({ Saldo: saldoNuevo });

    tarjeta.totalRecargado += montoNum;
    await tarjeta.save();

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
// Solo muestra tarjetas verificadas
// ─────────────────────────────────────────────────────────────────────────────
export const misTarjetas = async (req, res) => {
  try {
    const userId   = getUserId(req);
    const tarjetas = await Tarjeta.find({ userId, activa: true, verificada: true })
      .select('-tokenNumero -tokenVerificacion -tokenVerificacionExpiry -__v')
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