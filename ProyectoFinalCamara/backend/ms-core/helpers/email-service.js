import { config } from '../configs/config.js';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const sendViaBrevo = async ({ to, subject, html }) => {
    if (!config.smtp.brevoApiKey) {
        throw new Error('BREVO_API_KEY not configured');
    }

    const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': config.smtp.brevoApiKey,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            sender: {
                name: config.smtp.fromName || 'ProyectoCamara',
                email: config.smtp.fromEmail,
            },
            to: [{ email: to }],
            subject,
            htmlContent: html,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Brevo API error: ${response.status} - ${errorBody}`);
    }

    return response.json();
};

export const sendVerificationEmail = async (email, name, verificationToken) => {
    try {
        const frontendUrl = config.app.frontendUrl || 'http://localhost:3000';
        const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

        await sendViaBrevo({
            to: email,
            subject: 'Verify your email address',
            html: `
                <h2>Welcome ${name}!</h2>
                <p>Please verify your email address by clicking the link below:</p>
                <a href='${verificationUrl}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
                    Verify Email
                </a>
                <p>If you cannot click the link, copy and paste this URL into your browser:</p>
                <p>${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
            `,
        });
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
};

export const sendPasswordResetEmail = async (email, name, resetToken) => {
    try {
        const frontendUrl = config.app.frontendUrl || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        await sendViaBrevo({
            to: email,
            subject: 'Reset your password',
            html: `
                <h2>Password Reset Request</h2>
                <p>Hello ${name},</p>
                <p>You requested to reset your password. Click the link below to reset it:</p>
                <a href='${resetUrl}' style='background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
                    Reset Password
                </a>
                <p>If you cannot click the link, copy and paste this URL into your browser:</p>
                <p>${resetUrl}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            `,
        });
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
};

export const sendWelcomeEmail = async (email, name) => {
    try {
        await sendViaBrevo({
            to: email,
            subject: 'Welcome to AuthDotnet!',
            html: `
                <h2>Welcome to AuthDotnet, ${name}!</h2>
                <p>Your account has been successfully verified and activated.</p>
                <p>You can now enjoy all the features of our platform.</p>
                <p>If you have any questions, feel free to contact our support team.</p>
                <p>Thank you for joining us!</p>
            `,
        });
    } catch (error) {
        console.error('Error sending welcome email:', error);
        throw error;
    }
};

export const sendPasswordChangedEmail = async (email, name) => {
    try {
        await sendViaBrevo({
            to: email,
            subject: 'Password Changed Successfully',
            html: `
                <h2>Password Changed</h2>
                <p>Hello ${name},</p>
                <p>Your password has been successfully updated.</p>
                <p>If you didn't make this change, please contact our support team immediately.</p>
                <p>This is an automated email, please do not reply to this message.</p>
            `,
        });
    } catch (error) {
        console.error('Error sending password changed email:', error);
        throw error;
    }
};

export const sendDepositoSolicitudAdmin = async ({
    solicitudId, usuarioNombre, usuarioEmail, monto, numeroCuenta,
}) => {
    const adminEmail = process.env.SMTP_USERNAME;

    await sendViaBrevo({
        to: adminEmail,
        subject: `Nueva solicitud de depósito - ${usuarioNombre}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">📥 Nueva Solicitud de Depósito</h2>
                <table style="width:100%; border-collapse: collapse;">
                    <tr><td style="padding:8px; border:1px solid #ddd;"><strong>ID Solicitud</strong></td><td style="padding:8px; border:1px solid #ddd;">${solicitudId}</td></tr>
                    <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Usuario</strong></td><td style="padding:8px; border:1px solid #ddd;">${usuarioNombre}</td></tr>
                    <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Email</strong></td><td style="padding:8px; border:1px solid #ddd;">${usuarioEmail}</td></tr>
                    <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Cuenta</strong></td><td style="padding:8px; border:1px solid #ddd;">${numeroCuenta}</td></tr>
                    <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Monto Solicitado</strong></td><td style="padding:8px; border:1px solid #ddd; color: #27ae60;"><strong>Q${monto.toFixed(2)}</strong></td></tr>
                </table>
                <br/>
                <p>Para procesar esta solicitud usa los siguientes endpoints en tu sistema:</p>
                <p>✅ <strong>Aprobar:</strong> POST /api/v1/cuenta/aprobar-deposito → <code>{ "solicitudId": "${solicitudId}" }</code></p>
                <p>❌ <strong>Rechazar:</strong> POST /api/v1/cuenta/rechazar-deposito → <code>{ "solicitudId": "${solicitudId}", "motivo": "..." }</code></p>
            </div>
        `,
    });
};

export const sendDepositoAprobado = async ({
    usuarioNombre, usuarioEmail, monto, token, tokenExpiry,
}) => {
    const expiracion = new Date(tokenExpiry).toLocaleString('es-GT');

    await sendViaBrevo({
        to: usuarioEmail,
        subject: '✅ Tu solicitud de depósito fue aprobada',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #27ae60;">✅ Depósito Aprobado</h2>
                <p>Hola <strong>${usuarioNombre}</strong>,</p>
                <p>Tu solicitud de depósito por <strong style="color: #27ae60;">Q${monto.toFixed(2)}</strong> ha sido <strong>aprobada</strong>.</p>
                <p>Usa el siguiente token para confirmar tu depósito:</p>
                <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 14px;">
                    ${token}
                </div>
                <p style="color: #e74c3c;">⚠️ Este token expira el: <strong>${expiracion}</strong></p>
                <p>Para confirmar tu depósito, envía una petición a:</p>
                <p><strong>POST /api/v1/cuenta/confirmar-deposito</strong></p>
                <p>Con el body: <code>{ "token": "${token}" }</code></p>
                <p>Si no solicitaste este depósito, ignora este correo.</p>
            </div>
        `,
    });
};

export const sendDepositoRechazado = async ({
    usuarioNombre, usuarioEmail, monto, motivo,
}) => {
    await sendViaBrevo({
        to: usuarioEmail,
        subject: '❌ Tu solicitud de depósito fue rechazada',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e74c3c;">❌ Depósito Rechazado</h2>
                <p>Hola <strong>${usuarioNombre}</strong>,</p>
                <p>Tu solicitud de depósito por <strong>Q${monto.toFixed(2)}</strong> ha sido <strong>rechazada</strong>.</p>
                <p><strong>Motivo:</strong> ${motivo}</p>
                <p>Puedes realizar una nueva solicitud cuando lo desees.</p>
                <p>Si tienes dudas, contacta al administrador.</p>
            </div>
        `,
    });
};