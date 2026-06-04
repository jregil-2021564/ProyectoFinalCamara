'use strict';

import { v4 as uuidv4 } from 'uuid';
import { Multa }        from '../trafico/multa.model.js';
import { UserProfile }  from '../users/user.model.js';
import { Tarjeta }      from '../saldo/tarjeta.model.js';
import { findUserById } from '../../helpers/user-db.js';
import { generarVoucherPDF } from '../../helpers/voucher-pdf.js';
import mongoose         from 'mongoose';
import nodemailer       from 'nodemailer';
import { config }       from '../../configs/config.js';

const getUserId = (req) => String(req.user?.Id ?? req.user?.id ?? '').trim();

// Transporter (mismo SMTP que ya tienes)
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

// ── POST /api/v1/pagos/pagar-multa ───────────────────────────────────────────
export const pagarMulta = async (req, res) => {
  try {
    const userId               = getUserId(req);
    const { multaId, tarjetaId } = req.body;

    // 1. Campos requeridos
    if (!multaId) {
      return res.status(400).json({ success: false, message: 'multaId es requerido' });
    }
    if (!tarjetaId) {
      return res.status(400).json({
        success: false,
        message: 'tarjetaId es requerido. Elige con qué tarjeta pagar.',
        ayuda:   'Usa GET /api/v1/pagos/mis-multas para ver tus tarjetas con crédito disponible',
      });
    }

    // 2. Formato ObjectId
    if (!mongoose.Types.ObjectId.isValid(tarjetaId)) {
      return res.status(400).json({
        success: false,
        message: 'tarjetaId inválido. Debe ser el id de 24 caracteres de tu tarjeta.',
      });
    }

    // 3. Buscar multa
    const multa = await Multa.findById(multaId);
    if (!multa) {
      return res.status(404).json({ success: false, message: 'Multa no encontrada' });
    }

    // 4. Multa debe estar PENDIENTE
    if (multa.estado !== 'PENDIENTE') {
      return res.status(400).json({
        success: false,
        message: `Esta multa ya fue ${multa.estado.toLowerCase()}`,
      });
    }

    // 5. Placa del usuario debe coincidir
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

    // 6. Buscar tarjeta
    const tarjeta = await Tarjeta.findById(tarjetaId);
    if (!tarjeta) {
      return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
    }

    // 7. Tarjeta pertenece al usuario
    if (String(tarjeta.userId).trim() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Esta tarjeta no pertenece a tu cuenta',
      });
    }

    // 8. Tarjeta activa
    if (!tarjeta.activa) {
      return res.status(400).json({
        success: false,
        message: `La tarjeta ${tarjeta.marca} **** ${tarjeta.ultimosDigitos} está desactivada`,
      });
    }

    // 9. Tarjeta verificada
    if (!tarjeta.verificada) {
      return res.status(403).json({
        success: false,
        message: `La tarjeta ${tarjeta.marca} **** ${tarjeta.ultimosDigitos} no está verificada`,
        siguientePaso: 'POST /api/v1/saldo/verificar-tarjeta',
      });
    }

    // 10. Crédito disponible
    const montoMulta        = parseFloat(multa.monto_multa);
    const creditoDisponible = tarjeta.limiteCredito - tarjeta.totalRecargado;

    if (creditoDisponible <= 0) {
      return res.status(400).json({
        success: false,
        message: `La tarjeta ${tarjeta.marca} **** ${tarjeta.ultimosDigitos} no tiene crédito disponible`,
        limiteCredito:    `Q${tarjeta.limiteCredito.toFixed(2)}`,
        creditoUsado:     `Q${tarjeta.totalRecargado.toFixed(2)}`,
        creditoDisponible:`Q0.00`,
        montoMulta:       `Q${montoMulta.toFixed(2)}`,
        sugerencia:       'Elige otra tarjeta con crédito disponible',
      });
    }

    if (creditoDisponible < montoMulta) {
      return res.status(400).json({
        success: false,
        message: `Crédito insuficiente en la tarjeta ${tarjeta.marca} **** ${tarjeta.ultimosDigitos}`,
        creditoDisponible: `Q${creditoDisponible.toFixed(2)}`,
        montoMulta:        `Q${montoMulta.toFixed(2)}`,
        diferencia:        `Q${(montoMulta - creditoDisponible).toFixed(2)}`,
        sugerencia:        `Te faltan Q${(montoMulta - creditoDisponible).toFixed(2)} de crédito en esta tarjeta`,
      });
    }

    // 11. Descontar crédito de la tarjeta y marcar multa PAGADA
    tarjeta.totalRecargado += montoMulta;
    await tarjeta.save();
    await multa.updateOne({ estado: 'PAGADA' });

    const referencia      = uuidv4();
    const fechaPago       = new Date().toLocaleString('es-GT');
    const creditoRestante = creditoDisponible - montoMulta;
    const tarjetaUsadaTxt = `${tarjeta.marca} **** ${tarjeta.ultimosDigitos}`;

    // 12. Responder al cliente inmediatamente
    res.status(200).json({
      success: true,
      message: 'Multa pagada exitosamente. Se enviará el voucher a tu correo.',
      recibo: {
        multaId:           multa._id,
        placa:             multa.placa,
        tipoInfraccion:    multa.tipo_infraccion,
        montoPagado:       `Q${montoMulta.toFixed(2)}`,
        tarjetaUsada:      tarjetaUsadaTxt,
        creditoAnterior:   `Q${creditoDisponible.toFixed(2)}`,
        creditoRestante:   `Q${creditoRestante.toFixed(2)}`,
        referencia,
        estado:            'PAGADA',
        fechaPago,
      },
    });

    // 13. Generar PDF y enviar correo en background
    setImmediate(async () => {
      try {
        const user = await findUserById(userId);
        if (!user) return;

        const nombreUsuario = `${user.Name} ${user.Surname}`;
        const emailUsuario  = user.Email;

        // Generar PDF voucher
        const pdfBuffer = await generarVoucherPDF({
          nombreUsuario,
          emailUsuario,
          multaId:        multa._id,
          placa:          multa.placa,
          tipoInfraccion: multa.tipo_infraccion,
          velocidad:      multa.velocidad,
          pasoRojo:       multa.paso_rojo,
          montoMulta:     `Q${montoMulta.toFixed(2)}`,
          fechaPago,
          tarjetaUsada:   tarjetaUsadaTxt,
          creditoRestante:`Q${creditoRestante.toFixed(2)}`,
          referencia,
        });

        if (!transporter) {
          console.warn('[PAGO] SMTP no configurado — correo no enviado');
          return;
        }

        // Enviar correo con PDF adjunto
        await transporter.sendMail({
          from:    `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
          to:      emailUsuario,
          subject: `✅ Multa pagada — Placa ${multa.placa} — Q${montoMulta.toFixed(2)}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;
                        border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
              <div style="background: #1a3a5c; padding: 24px; text-align: center;">
                <h2 style="color: white; margin: 0;">✅ Pago de Multa Confirmado</h2>
              </div>
              <div style="padding: 24px;">
                <p>Hola <strong>${nombreUsuario}</strong>,</p>
                <p>Tu multa ha sido pagada exitosamente. Adjunto encontrarás el voucher oficial.</p>

                <table style="width:100%; border-collapse:collapse; margin:16px 0;">
                  <tr style="background:#f8f9fa;">
                    <td style="padding:10px; border:1px solid #dee2e6;"><strong>Placa</strong></td>
                    <td style="padding:10px; border:1px solid #dee2e6;">${multa.placa}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px; border:1px solid #dee2e6;"><strong>Infracción</strong></td>
                    <td style="padding:10px; border:1px solid #dee2e6;">${multa.tipo_infraccion}</td>
                  </tr>
                  <tr style="background:#f8f9fa;">
                    <td style="padding:10px; border:1px solid #dee2e6;"><strong>Monto pagado</strong></td>
                    <td style="padding:10px; border:1px solid #dee2e6; color:#27ae60;">
                      <strong>Q${montoMulta.toFixed(2)}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px; border:1px solid #dee2e6;"><strong>Tarjeta</strong></td>
                    <td style="padding:10px; border:1px solid #dee2e6;">${tarjetaUsadaTxt}</td>
                  </tr>
                  <tr style="background:#f8f9fa;">
                    <td style="padding:10px; border:1px solid #dee2e6;"><strong>Referencia</strong></td>
                    <td style="padding:10px; border:1px solid #dee2e6;
                               font-family:monospace; font-size:12px;">${referencia}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px; border:1px solid #dee2e6;"><strong>Fecha</strong></td>
                    <td style="padding:10px; border:1px solid #dee2e6;">${fechaPago}</td>
                  </tr>
                </table>

                <div style="background:#d4edda; border:1px solid #c3e6cb; border-radius:6px;
                            padding:14px; text-align:center;">
                  <p style="margin:0; color:#155724; font-size:14px;">
                    📎 El voucher PDF está adjunto a este correo.
                    Consérvalo como comprobante oficial del pago.
                  </p>
                </div>
              </div>
            </div>
          `,
          attachments: [
            {
              filename:    `voucher-multa-${multa.placa}-${Date.now()}.pdf`,
              content:     pdfBuffer,
              contentType: 'application/pdf',
            },
          ],
        });

        console.log(`[PAGO] Voucher enviado a ${emailUsuario}`);

      } catch (e) {
        console.error('[PAGO] Error enviando voucher:', e.message);
      }
    });

  } catch (error) {
    console.error('Error en pagarMulta:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
};

// ── GET /api/v1/pagos/mis-multas ─────────────────────────────────────────────
export const misMultas = async (req, res) => {
  try {
    const userId = getUserId(req);
    const perfil = await UserProfile.findOne({ where: { UserId: req.user.Id } });

    if (!perfil || !perfil.Placa) {
      return res.status(400).json({
        success: false,
        message: 'No tienes una placa registrada en tu perfil',
      });
    }

    const multas = await Multa.find({ placa: perfil.Placa.toUpperCase() }).sort({ createdAt: -1 });

    const tarjetas       = await Tarjeta.find({ userId, activa: true, verificada: true })
      .select('marca ultimosDigitos limiteCredito totalRecargado');

    const pendientes     = multas.filter(m => m.estado === 'PENDIENTE');
    const totalPendiente = pendientes.reduce((acc, m) => acc + parseFloat(m.monto_multa), 0);

    return res.status(200).json({
      success: true,
      placa:   perfil.Placa,
      total:   multas.length,
      resumen: {
        multasPendientes: pendientes.length,
        totalPendiente:   `Q${totalPendiente.toFixed(2)}`,
        tarjetasParaPagar: tarjetas.map(t => {
          const disponible = t.limiteCredito - t.totalRecargado;
          return {
            tarjetaId:         t._id,
            tarjeta:           `${t.marca} **** ${t.ultimosDigitos}`,
            creditoDisponible: `Q${Math.max(0, disponible).toFixed(2)}`,
            alcanzaParaPagar:  disponible >= totalPendiente,
          };
        }),
      },
      multas: multas.map(m => ({
        id:              m._id,
        placa:           m.placa,
        tipoInfraccion:  m.tipo_infraccion,
        velocidad:       m.velocidad,
        pasoRojo:        m.paso_rojo,
        montoMulta:      `Q${parseFloat(m.monto_multa).toFixed(2)}`,
        estado:          m.estado,
        modeloDetectado: m.modelo_detectado,
        colorDetectado:  m.color_detectado,
        fecha:           m.createdAt,
      })),
    });

  } catch (error) {
    console.error('Error en misMultas:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};