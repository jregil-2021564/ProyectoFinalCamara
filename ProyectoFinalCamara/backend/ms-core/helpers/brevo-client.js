import { config } from '../configs/config.js';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export const sendViaBrevo = async ({ to, subject, html, attachments }) => {
    if (!config.smtp.brevoApiKey) {
        throw new Error('BREVO_API_KEY not configured');
    }

    const body = {
        sender: {
            name: config.smtp.fromName || 'ProyectoCamara',
            email: config.smtp.fromEmail,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
    };

    if (attachments && attachments.length > 0) {
        body.attachment = attachments.map(a => ({
            content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content,
            name: a.filename,
        }));
    }

    const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': config.smtp.brevoApiKey,
            'content-type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Brevo API error: ${response.status} - ${errorBody}`);
    }

    return response.json();
};