'use strict';

import nodemailer from 'nodemailer';
import { config } from '../configs/config.js';

const createTransporter = () => {
  if (!config.smtp.username || !config.smtp.password) {
    console.warn('SMTP credentials not configured.');
    return null;
  }
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
// Correo: token de verificación para agregar tarjeta
// Se manda ANTES de guardar la tarjeta — sin token no se confirma
// ─────────────────────────────────────────────────────────────────────────────
export const sendVerificacionTarjeta = async ({
  email, nombre, marca, ultimosDigitos, token,
}) => {
  if (!transporter) {
    console.warn('SMTP no configurado — correo de verificación no enviado');
    return;
  }

  await transporter.sendMail({
    from:    `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
    to:      email,
    subject: `🔐 Código de verificación para agregar tarjeta ${marca} **** ${ultimosDigitos}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;
                  border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1a73e8; padding: 24px; text-align: center;">
          <h2 style="color: white; margin: 0;">🔐 Verificación de Tarjeta</h2>
        </div>
        <div style="padding: 24px;">
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Recibimos una solicitud para agregar la siguiente tarjeta a tu cuenta:</p>
          <p style="font-size: 16px; font-weight: bold; color: #1a73e8;">
            ${marca} **** **** **** ${ultimosDigitos}
          </p>
          <p>Tu código de verificación es:</p>
          <div style="background: #f4f4f4; padding: 20px; border-radius: 8px;
                      text-align: center; font-family: monospace; font-size: 36px;
                      font-weight: bold; letter-spacing: 10px; color: #2c3e50; margin: 20px 0;">
            ${token}
          </div>
          <p style="color: #e74c3c;">
            ⏱️ Este código expira en <strong>10 minutos</strong>.
          </p>
          <p>Para confirmar, envía una petición a:</p>
          <div style="background: #f8f9fa; padding: 12px; border-radius: 6px;
                      font-family: monospace; font-size: 13px;">
            POST /api/v1/saldo/verificar-tarjeta<br>
            Body: { "token": "${token}" }
          </div>
          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px;
                      padding: 14px; margin-top: 20px;">
            <p style="margin: 0; color: #856404;">
              ⚠️ <strong>¿No fuiste tú?</strong> Ignora este correo.
              Nadie puede agregar la tarjeta sin este código.
            </p>
          </div>
        </div>
      </div>
    `,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Correo: tarjeta verificada y activada exitosamente
// ─────────────────────────────────────────────────────────────────────────────
export const sendAlertaTarjetaAgregada = async ({
  email, nombre, marca, ultimosDigitos, tipoTarjeta, limiteCredito, fecha,
}) => {
  if (!transporter) return;

  await transporter.sendMail({
    from:    `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
    to:      email,
    subject: `✅ Tarjeta ${marca} **** ${ultimosDigitos} activada en tu cuenta`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;
                  border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #27ae60; padding: 24px; text-align: center;">
          <h2 style="color: white; margin: 0;">✅ Tarjeta Activada</h2>
        </div>
        <div style="padding: 24px;">
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Tu tarjeta fue verificada y activada exitosamente:</p>
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
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Límite de crédito</strong></td>
              <td style="padding:10px; border:1px solid #dee2e6; color:#27ae60;">
                <strong>Q${limiteCredito.toFixed(2)}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Fecha</strong></td>
              <td style="padding:10px; border:1px solid #dee2e6;">${fecha}</td>
            </tr>
          </table>
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px;
                      padding: 14px; margin-top: 16px;">
            <p style="margin: 0; color: #721c24;">
              🚨 <strong>¿No fuiste tú?</strong> Elimina la tarjeta inmediatamente:<br>
              <code>DELETE /api/v1/saldo/mis-tarjetas/{tarjetaId}</code>
            </p>
          </div>
        </div>
      </div>
    `,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Correo: alerta de recarga exitosa
// ─────────────────────────────────────────────────────────────────────────────
export const sendAlertaRecarga = async ({
  email, nombre, marca, ultimosDigitos, monto, saldoNuevo, referencia, fecha,
}) => {
  if (!transporter) return;

  await transporter.sendMail({
    from:    `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
    to:      email,
    subject: `💳 Recarga de Q${monto.toFixed(2)} realizada en tu cuenta`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;
                  border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1a73e8; padding: 24px; text-align: center;">
          <h2 style="color: white; margin: 0;">💳 Alerta de Recarga</h2>
        </div>
        <div style="padding: 24px;">
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Se ha realizado una recarga en tu cuenta:</p>
          <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background:#f8f9fa;">
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Tarjeta</strong></td>
              <td style="padding:10px; border:1px solid #dee2e6;">${marca} **** **** **** ${ultimosDigitos}</td>
            </tr>
            <tr>
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Monto recargado</strong></td>
              <td style="padding:10px; border:1px solid #dee2e6; color:#27ae60;">
                <strong>Q${monto.toFixed(2)}</strong>
              </td>
            </tr>
            <tr style="background:#f8f9fa;">
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Saldo actual</strong></td>
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Q${saldoNuevo.toFixed(2)}</strong></td>
            </tr>
            <tr>
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Referencia</strong></td>
              <td style="padding:10px; border:1px solid #dee2e6;
                         font-family:monospace; font-size:12px;">${referencia}</td>
            </tr>
            <tr style="background:#f8f9fa;">
              <td style="padding:10px; border:1px solid #dee2e6;"><strong>Fecha</strong></td>
              <td style="padding:10px; border:1px solid #dee2e6;">${fecha}</td>
            </tr>
          </table>
          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px;
                      padding: 14px; margin-top: 16px;">
            <p style="margin: 0; color: #856404;">
              ⚠️ <strong>¿No fuiste tú?</strong> Elimina tu tarjeta:<br>
              <code>DELETE /api/v1/saldo/mis-tarjetas/{tarjetaId}</code>
            </p>
          </div>
        </div>
      </div>
    `,
  });
};