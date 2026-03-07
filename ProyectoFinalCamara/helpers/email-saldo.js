'use strict';

/**
 * Notificaciones de correo para operaciones de saldo y tarjetas.
 * Usa el mismo transporter de nodemailer que ya tienes configurado.
 */

import nodemailer from 'nodemailer';
import { config }  from '../configs/config.js';

const createTransporter = () => {
  if (!config.smtp.username || !config.smtp.password) return null;
  return nodemailer.createTransport({
    host:    config.smtp.host,
    port:    config.smtp.port,
    secure:  config.smtp.enableSsl,
    auth:    { user: config.smtp.username, pass: config.smtp.password },
    connectionTimeout: 10_000,
    greetingTimeout:   10_000,
    socketTimeout:     10_000,
    tls: { rejectUnauthorized: false },
  });
};

const transporter = createTransporter();

// ─────────────────────────────────────────────────────────────────────────────
// Correo: alerta de recarga exitosa
// Se manda justo después de que se acredita el saldo
// ─────────────────────────────────────────────────────────────────────────────
export const sendAlertaRecarga = async ({
  email,
  nombre,
  marca,
  ultimosDigitos,
  monto,
  saldoNuevo,
  referencia,
  fecha,
}) => {
  if (!transporter) {
    console.warn('SMTP no configurado — correo de alerta no enviado');
    return;
  }

  await transporter.sendMail({
    from:    `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
    to:      email,
    subject: `💳 Recarga de Q${monto.toFixed(2)} realizada en tu cuenta`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1a73e8; padding: 24px; text-align: center;">
          <h2 style="color: white; margin: 0;">💳 Alerta de Recarga</h2>
        </div>
        <div style="padding: 24px;">
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Se ha realizado una recarga en tu cuenta con los siguientes datos:</p>

          <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background:#f8f9fa;">
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Tarjeta</strong></td>
              <td style="padding:10px; border:1px solid #dee2e6;">${marca} **** **** **** ${ultimosDigitos}</td>
            </tr>
            <tr>
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Monto recargado</strong></td>
              <td style="padding:10px; border:1px solid #dee2e6; color:#27ae60;"><strong>Q${monto.toFixed(2)}</strong></td>
            </tr>
            <tr style="background:#f8f9fa;">
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Saldo actual</strong></td>
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Q${saldoNuevo.toFixed(2)}</strong></td>
            </tr>
            <tr>
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Referencia</strong></td>
              <td style="padding:10px; border:1px solid #dee2e6; font-family: monospace; font-size: 12px;">${referencia}</td>
            </tr>
            <tr style="background:#f8f9fa;">
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Fecha</strong></td>
              <td style="padding:10px; border:1px solid #dee2e6;">${fecha}</td>
            </tr>
          </table>

          <div style="background:#fff3cd; border:1px solid #ffc107; border-radius:6px; padding:16px; margin-top:16px;">
            <p style="margin:0; color:#856404;">
              ⚠️ <strong>¿No fuiste tú?</strong> Si no reconoces esta operación, elimina tu tarjeta inmediatamente usando el endpoint:
            </p>
            <p style="margin:8px 0 0; font-family: monospace; font-size: 13px; color:#856404;">
              DELETE /api/v1/saldo/mis-tarjetas/{tarjetaId}
            </p>
          </div>

          <p style="margin-top: 20px; color: #6c757d; font-size: 13px;">
            Este es un correo automático, por favor no respondas a este mensaje.
          </p>
        </div>
      </div>
    `,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Correo: tarjeta agregada
// ─────────────────────────────────────────────────────────────────────────────
export const sendAlertaTarjetaAgregada = async ({
  email,
  nombre,
  marca,
  ultimosDigitos,
  tipoTarjeta,
  limiteCredito,
  fecha,
}) => {
  if (!transporter) {
    console.warn('SMTP no configurado — correo de alerta no enviado');
    return;
  }

  await transporter.sendMail({
    from:    `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
    to:      email,
    subject: `🔐 Nueva tarjeta agregada a tu cuenta`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #2c3e50; padding: 24px; text-align: center;">
          <h2 style="color: white; margin: 0;">🔐 Nueva Tarjeta Registrada</h2>
        </div>
        <div style="padding: 24px;">
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Se ha agregado una nueva tarjeta a tu cuenta:</p>

          <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background:#f8f9fa;">
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Tarjeta</strong></td>
              <td style="padding:10px; border:1px solid #dee2e6;">${marca} **** **** **** ${ultimosDigitos}</td>
            </tr>
            <tr>
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Tipo</strong></td>
              <td style="padding:10px; border:1px solid #dee2e6;">${tipoTarjeta}</td>
            </tr>
            <tr style="background:#f8f9fa;">
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Límite</strong></td>
              <td style="padding:10px; border:1px solid #dee2e6;">Q${limiteCredito.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Fecha</strong></td>
              <td style="padding:10px; border:1px solid #dee2e6;">${fecha}</td>
            </tr>
          </table>

          <div style="background:#f8d7da; border:1px solid #f5c6cb; border-radius:6px; padding:16px; margin-top:16px;">
            <p style="margin:0; color:#721c24;">
              🚨 <strong>¿No fuiste tú?</strong> Si no reconoces esta acción, elimina la tarjeta inmediatamente:
            </p>
            <p style="margin:8px 0 0; font-family: monospace; font-size: 13px; color:#721c24;">
              DELETE /api/v1/saldo/mis-tarjetas/{tarjetaId}
            </p>
          </div>
        </div>
      </div>
    `,
  });
};