const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const BREVO_HOST = 'smtp-relay.brevo.com';
const BREVO_PORT = Number(process.env.EMAIL_PORT) || 2525;

const requiredEmailVariables = ['EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
const missingEmailVariables = requiredEmailVariables.filter(
    (variableName) => !process.env[variableName]
);

if (missingEmailVariables.length > 0) {
    throw new Error(
        `Missing email environment variables: ${missingEmailVariables.join(', ')}`
    );
}

// Create one transporter and reuse it for every message. This avoids opening a
// new SMTP connection for each request and makes the mail utility easy to scale.
const transporter = nodemailer.createTransport({
    host: BREVO_HOST,
    port: BREVO_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error) => {
    if (error) {
        console.error('Brevo SMTP connection error:', error.message);
        return;
    }

    console.log('Brevo SMTP mailer initialized successfully.');
});

/**
 * Send an email through Brevo SMTP.
 *
 * `email` and `text` are retained for compatibility with existing callers.
 * New callers may use `to` and `html` instead.
 */
const sendEmail = async ({
    to,
    email,
    subject,
    text,
    html
}) => {
    const recipient = to || email;

    if (!recipient || !subject || (!text && !html)) {
        throw new Error('Email requires a recipient, subject, and text or HTML body.');
    }

    try {
        console.log(`Sending email to ${recipient}`);

        const message = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: recipient,
            subject,
            text,
            html
        });

        console.log(`Email sent successfully: ${message.messageId}`);
        return message;
    } catch (error) {
        console.error('Email sending error:', error.message);
        throw error;
    }
};

module.exports = sendEmail;