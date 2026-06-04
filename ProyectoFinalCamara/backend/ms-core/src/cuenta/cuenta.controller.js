'use strict';

import crypto from 'crypto';
import { Cuenta, SolicitudDeposito } from './cuenta.model.js';
import { User, UserProfile } from '../users/user.model.js';
import { config } from '../../configs/config.js';

// ── Helper: generar número de cuenta único ────────────────────────────────────
const generarNumeroCuenta = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random    = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CTA-${timestamp}-${random}`;
};

// ── Helper: generar token de depósito ─────────────────────────────────────────
const generarTokenDeposito = () => crypto.randomBytes(32).toString('hex');

// ── GET /api/v1/cuenta/mi-cuenta ─────────────────────────────────────────────
// Ver saldo de la cuenta del usuario autenticado
export const miCuenta = async (req, res) => {
  try {
    const cuenta = await Cuenta.findOne({
      where: { UserId: req.user.Id },
      include: [{ model: User, as: 'User', attributes: ['Id', 'Name', 'Surname', 'Email'] }],
    });

    if (!cuenta) {
      return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
    }

    return res.status(200).json({
      success: true,
      cuenta: {
        id:            cuenta.Id,
        numeroCuenta:  cuenta.NumeroCuenta,
        saldo:         `Q${parseFloat(cuenta.Saldo).toFixed(2)}`,
        titular:       `${cuenta.User.Name} ${cuenta.User.Surname}`,
        email:         cuenta.User.Email,
        creadaEl:      cuenta.CreatedAt,
      },
    });
  } catch (error) {
    console.error('Error en miCuenta:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ── POST /api/v1/cuenta/solicitar-deposito ────────────────────────────────────
// El usuario solicita un depósito — le llega correo al admin
export const solicitarDeposito = async (req, res) => {
  try {
    const { monto } = req.body;

    if (!monto || isNaN(monto) || parseFloat(monto) < 100) {
      return res.status(400).json({
        success: false,
        message: 'El monto mínimo de depósito es Q100',
      });
    }

    const cuenta = await Cuenta.findOne({ where: { UserId: req.user.Id } });
    if (!cuenta) {
      return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
    }

    // Verificar que no tenga una solicitud PENDIENTE activa
    const solicitudPendiente = await SolicitudDeposito.findOne({
      where: { UserId: req.user.Id, Estado: 'PENDIENTE' },
    });
    if (solicitudPendiente) {
      return res.status(409).json({
        success: false,
        message: 'Ya tienes una solicitud de depósito pendiente. Espera a que el admin la procese.',
      });
    }

    // Crear la solicitud
    const solicitud = await SolicitudDeposito.create({
      UserId:   req.user.Id,
      CuentaId: cuenta.Id,
      Monto:    parseFloat(monto),
      Estado:   'PENDIENTE',
    });

    // Enviar correo al admin
    const { sendDepositoSolicitudAdmin } = await import('../../helpers/email-service.js');
    await sendDepositoSolicitudAdmin({
      solicitudId:  solicitud.Id,
      usuarioNombre: `${req.user.Name} ${req.user.Surname}`,
      usuarioEmail:  req.user.Email,
      monto:         parseFloat(monto),
      numeroCuenta:  cuenta.NumeroCuenta,
    });

    return res.status(201).json({
      success: true,
      message: 'Solicitud de depósito enviada. El administrador revisará tu solicitud y recibirás un correo con la respuesta.',
      solicitud: {
        id:     solicitud.Id,
        monto:  `Q${parseFloat(monto).toFixed(2)}`,
        estado: 'PENDIENTE',
      },
    });
  } catch (error) {
    console.error('Error en solicitarDeposito:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ── POST /api/v1/cuenta/aprobar-deposito ─────────────────────────────────────
// ADMIN aprueba la solicitud — genera token y se lo manda al usuario por correo
export const aprobarDeposito = async (req, res) => {
  try {
    const { solicitudId } = req.body;

    if (!solicitudId) {
      return res.status(400).json({ success: false, message: 'solicitudId es requerido' });
    }

    const solicitud = await SolicitudDeposito.findOne({
      where: { Id: solicitudId, Estado: 'PENDIENTE' },
      include: [{ model: User, as: 'User' }, { model: Cuenta, as: 'Cuenta' }],
    });

    if (!solicitud) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada o ya procesada' });
    }

    // Generar token con expiración de 24 horas
    const token       = generarTokenDeposito();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await solicitud.update({
      Estado:        'APROBADO',
      TokenDeposito: token,
      TokenExpiry:   tokenExpiry,
    });

    // Enviar correo al usuario con el token
    const { sendDepositoAprobado } = await import('../../helpers/email-service.js');
    await sendDepositoAprobado({
      usuarioNombre: `${solicitud.User.Name} ${solicitud.User.Surname}`,
      usuarioEmail:  solicitud.User.Email,
      monto:         parseFloat(solicitud.Monto),
      token,
      tokenExpiry,
    });

    return res.status(200).json({
      success: true,
      message: `Depósito aprobado. Se envió el token al correo del usuario.`,
      data: { solicitudId, monto: `Q${parseFloat(solicitud.Monto).toFixed(2)}` },
    });
  } catch (error) {
    console.error('Error en aprobarDeposito:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ── POST /api/v1/cuenta/rechazar-deposito ────────────────────────────────────
// ADMIN rechaza la solicitud — le manda correo al usuario
export const rechazarDeposito = async (req, res) => {
  try {
    const { solicitudId, motivo } = req.body;

    if (!solicitudId) {
      return res.status(400).json({ success: false, message: 'solicitudId es requerido' });
    }

    const solicitud = await SolicitudDeposito.findOne({
      where: { Id: solicitudId, Estado: 'PENDIENTE' },
      include: [{ model: User, as: 'User' }],
    });

    if (!solicitud) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada o ya procesada' });
    }

    await solicitud.update({
      Estado: 'RECHAZADO',
      Motivo: motivo || 'Sin motivo especificado',
    });

    // Enviar correo al usuario notificando rechazo
    const { sendDepositoRechazado } = await import('../../helpers/email-service.js');
    await sendDepositoRechazado({
      usuarioNombre: `${solicitud.User.Name} ${solicitud.User.Surname}`,
      usuarioEmail:  solicitud.User.Email,
      monto:         parseFloat(solicitud.Monto),
      motivo:        motivo || 'Sin motivo especificado',
    });

    return res.status(200).json({
      success: true,
      message: 'Solicitud rechazada. Se notificó al usuario por correo.',
      data: { solicitudId, motivo: motivo || 'Sin motivo especificado' },
    });
  } catch (error) {
    console.error('Error en rechazarDeposito:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ── POST /api/v1/cuenta/confirmar-deposito ────────────────────────────────────
// El usuario usa el token para confirmar y acreditar el saldo
export const confirmarDeposito = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token requerido' });
    }

    const solicitud = await SolicitudDeposito.findOne({
      where: {
        TokenDeposito: token,
        Estado:        'APROBADO',
        TokenUsado:    false,
        UserId:        req.user.Id, // solo el dueño puede usar su token
      },
      include: [{ model: Cuenta, as: 'Cuenta' }],
    });

    if (!solicitud) {
      return res.status(404).json({ success: false, message: 'Token inválido, ya usado o no te pertenece' });
    }

    // Verificar que el token no haya expirado
    if (new Date() > new Date(solicitud.TokenExpiry)) {
      return res.status(401).json({ success: false, message: 'El token de depósito ha expirado' });
    }

    // Acreditar el saldo y marcar token como usado
    const nuevoSaldo = parseFloat(solicitud.Cuenta.Saldo) + parseFloat(solicitud.Monto);

    await solicitud.Cuenta.update({ Saldo: nuevoSaldo });
    await solicitud.update({ TokenUsado: true });

    return res.status(200).json({
      success: true,
      message: `Depósito de Q${parseFloat(solicitud.Monto).toFixed(2)} acreditado exitosamente.`,
      saldoActual: `Q${nuevoSaldo.toFixed(2)}`,
    });
  } catch (error) {
    console.error('Error en confirmarDeposito:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ── GET /api/v1/cuenta/solicitudes ───────────────────────────────────────────
// ADMIN ve todas las solicitudes pendientes
export const listarSolicitudes = async (req, res) => {
  try {
    const { estado } = req.query; // ?estado=PENDIENTE

    const where = {};
    if (estado) where.Estado = estado.toUpperCase();

    const solicitudes = await SolicitudDeposito.findAll({
      where,
      include: [
        { model: User,   as: 'User',   attributes: ['Id', 'Name', 'Surname', 'Email'] },
        { model: Cuenta, as: 'Cuenta', attributes: ['Id', 'NumeroCuenta', 'Saldo'] },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      total: solicitudes.length,
      solicitudes: solicitudes.map(s => ({
        id:           s.Id,
        usuario:      `${s.User.Name} ${s.User.Surname}`,
        email:        s.User.Email,
        numeroCuenta: s.Cuenta.NumeroCuenta,
        saldoActual:  `Q${parseFloat(s.Cuenta.Saldo).toFixed(2)}`,
        monto:        `Q${parseFloat(s.Monto).toFixed(2)}`,
        estado:       s.Estado,
        motivo:       s.Motivo,
        creadaEl:     s.CreatedAt,
      })),
    });
  } catch (error) {
    console.error('Error en listarSolicitudes:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
