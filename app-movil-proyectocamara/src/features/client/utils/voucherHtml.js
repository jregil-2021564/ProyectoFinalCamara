// src/features/client/utils/voucherHtml.js
export const buildRechargeVoucherHtml = ({ numeroCuenta, monto, tarjeta, fecha, referencia }) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 32px; color: #0f172a; }
      .header { text-align: center; margin-bottom: 24px; }
      .header h1 { color: #1E336C; font-size: 20px; margin: 0; }
      .header p { color: #94a3b8; font-size: 12px; margin-top: 4px; }
      .box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
      .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
      .row:last-child { border-bottom: none; }
      .label { color: #94a3b8; font-size: 12px; }
      .value { font-weight: 700; font-size: 14px; }
      .amount { text-align: center; margin: 24px 0; }
      .amount .value { font-size: 32px; color: #C0A731; }
      .footer { text-align: center; margin-top: 24px; color: #94a3b8; font-size: 11px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Comprobante de Recarga</h1>
      <p>MuniKinal · ProyectoCamara</p>
    </div>
    <div class="amount">
      <p class="label">MONTO RECARGADO</p>
      <p class="value">Q${Number(monto || 0).toFixed(2)}</p>
    </div>
    <div class="box">
      <div class="row"><span class="label">Número de cuenta</span><span class="value">${numeroCuenta || "—"}</span></div>
      <div class="row"><span class="label">Tarjeta</span><span class="value">${tarjeta || "—"}</span></div>
      <div class="row"><span class="label">Fecha</span><span class="value">${fecha || "—"}</span></div>
      <div class="row"><span class="label">Referencia</span><span class="value">${referencia || "—"}</span></div>
    </div>
    <p class="footer">Este comprobante es generado automáticamente y no requiere firma.</p>
  </body>
</html>
`;