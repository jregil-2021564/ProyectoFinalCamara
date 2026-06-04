'use strict';

import PDFDocument from 'pdfkit';

/**
 * Genera un PDF voucher de pago de multa en memoria (Buffer).
 * Se adjunta al correo del usuario.
 *
 * @param {Object} datos
 * @returns {Promise<Buffer>}
 */
export const generarVoucherPDF = (datos) => {
  return new Promise((resolve, reject) => {
    const {
      // Usuario
      nombreUsuario,
      emailUsuario,
      // Multa
      multaId,
      placa,
      tipoInfraccion,
      velocidad,
      pasoRojo,
      montoMulta,
      fechaPago,
      // Tarjeta
      tarjetaUsada,
      creditoRestante,
      // Referencia
      referencia,
    } = datos;

    const doc    = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data',  chunk => chunks.push(chunk));
    doc.on('end',   ()    => resolve(Buffer.concat(chunks)));
    doc.on('error', err   => reject(err));

    const W = doc.page.width;

    // ── Encabezado ────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 100).fill('#1a3a5c');

    doc.fillColor('white')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('SISTEMA DE VIGILANCIA DE TRÁNSITO', 50, 28, { align: 'center' });

    doc.fontSize(13)
       .font('Helvetica')
       .text('VOUCHER DE PAGO DE MULTA', 50, 58, { align: 'center' });

    doc.moveDown(4);

    // ── Sello PAGADA ──────────────────────────────────────────────────────────
    doc.save();
    doc.rotate(-20, { origin: [W / 2, 160] });
    doc.rect(W / 2 - 100, 130, 200, 60)
       .lineWidth(4)
       .strokeColor('#27ae60')
       .stroke();
    doc.fillColor('#27ae60')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('✓  PAGADA', W / 2 - 90, 148);
    doc.restore();

    // ── Separador ─────────────────────────────────────────────────────────────
    doc.moveTo(50, 210).lineTo(W - 50, 210).lineWidth(1).strokeColor('#cccccc').stroke();

    // ── Datos del usuario ─────────────────────────────────────────────────────
    let y = 225;

    doc.fillColor('#1a3a5c')
       .fontSize(13)
       .font('Helvetica-Bold')
       .text('DATOS DEL TITULAR', 50, y);
    y += 20;

    doc.fillColor('#333333').font('Helvetica').fontSize(11);
    fila(doc, 50, y, 'Nombre:',  nombreUsuario); y += 18;
    fila(doc, 50, y, 'Correo:',  emailUsuario);  y += 18;
    fila(doc, 50, y, 'Placa:',   placa);          y += 18;

    y += 10;
    doc.moveTo(50, y).lineTo(W - 50, y).lineWidth(0.5).strokeColor('#dddddd').stroke();
    y += 15;

    // ── Datos de la multa ─────────────────────────────────────────────────────
    doc.fillColor('#1a3a5c')
       .fontSize(13)
       .font('Helvetica-Bold')
       .text('DETALLE DE LA MULTA', 50, y);
    y += 20;

    doc.fillColor('#333333').font('Helvetica').fontSize(11);
    fila(doc, 50, y, 'ID de Multa:',     String(multaId));     y += 18;
    fila(doc, 50, y, 'Tipo Infracción:', tipoInfraccion);      y += 18;

    if (velocidad) {
      fila(doc, 50, y, 'Velocidad:',    `${velocidad} km/h`); y += 18;
    }
    if (pasoRojo) {
      fila(doc, 50, y, 'Semáforo rojo:', 'SÍ');               y += 18;
    }

    fila(doc, 50, y, 'Estado:',        'PAGADA');              y += 18;
    fila(doc, 50, y, 'Fecha de Pago:', fechaPago);             y += 18;

    y += 10;
    doc.moveTo(50, y).lineTo(W - 50, y).lineWidth(0.5).strokeColor('#dddddd').stroke();
    y += 15;

    // ── Datos del pago ────────────────────────────────────────────────────────
    doc.fillColor('#1a3a5c')
       .fontSize(13)
       .font('Helvetica-Bold')
       .text('DETALLE DEL PAGO', 50, y);
    y += 20;

    doc.fillColor('#333333').font('Helvetica').fontSize(11);
    fila(doc, 50, y, 'Tarjeta utilizada:', tarjetaUsada);      y += 18;
    fila(doc, 50, y, 'Crédito restante:',  creditoRestante);   y += 18;
    fila(doc, 50, y, 'Referencia:',        referencia);        y += 18;

    y += 15;

    // ── Monto destacado ───────────────────────────────────────────────────────
    doc.rect(50, y, W - 100, 50).fill('#f0f7f0');
    doc.fillColor('#1a3a5c')
       .fontSize(13)
       .font('Helvetica-Bold')
       .text('MONTO PAGADO', 60, y + 10);
    doc.fillColor('#27ae60')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text(montoMulta, W - 200, y + 10, { width: 150, align: 'right' });

    y += 70;

    // ── Nota legal ────────────────────────────────────────────────────────────
    doc.moveTo(50, y).lineTo(W - 50, y).lineWidth(1).strokeColor('#cccccc').stroke();
    y += 15;

    doc.fillColor('#888888')
       .fontSize(9)
       .font('Helvetica')
       .text(
         'Este voucher es el comprobante oficial del pago de la multa indicada. ' +
         'Consérvelo como constancia. Este documento fue generado automáticamente ' +
         'por el Sistema de Vigilancia de Tránsito.',
         50, y, { width: W - 100, align: 'center' }
       );

    y += 35;

    // ── Pie de página ─────────────────────────────────────────────────────────
    doc.rect(0, doc.page.height - 40, W, 40).fill('#1a3a5c');
    doc.fillColor('white')
       .fontSize(9)
       .text(
         `Generado el ${fechaPago}  |  Referencia: ${referencia}`,
         50, doc.page.height - 25,
         { align: 'center' }
       );

    doc.end();
  });
};

// ── Helper: fila clave → valor ────────────────────────────────────────────────
function fila(doc, x, y, clave, valor) {
  doc.fillColor('#555555').font('Helvetica-Bold').text(clave, x, y, { continued: true });
  doc.fillColor('#222222').font('Helvetica').text(`  ${valor}`);
}