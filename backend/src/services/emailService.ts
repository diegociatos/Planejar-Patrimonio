import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpSecure,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: `"${env.smtpFromName}" <${env.smtpFrom}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendWelcomeEmail = async (
  email: string,
  name: string,
  temporaryPassword: string
): Promise<boolean> => {
  const html = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a4a5e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #c9a227; color: #1a4a5e; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .credentials { background-color: #fff; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Planejar Patrimonio</h1>
        </div>
        <div class="content">
          <h2>Bem-vindo(a), ${name}!</h2>
          <p>Sua conta foi criada com sucesso no sistema Planejar Patrimonio.</p>
          <div class="credentials">
            <p><strong>Seus dados de acesso:</strong></p>
            <p>E-mail: <strong>${email}</strong></p>
            <p>Senha temporaria: <strong>${temporaryPassword}</strong></p>
          </div>
          <p><strong>Importante:</strong> Por seguranca, voce devera alterar sua senha no primeiro acesso.</p>
          <p style="text-align: center; margin-top: 20px;">
            <a href="https://gestao.planejarpatrimonio.com.br" class="button">Acessar o Sistema</a>
          </p>
        </div>
        <div class="footer">
          <p>Este e um e-mail automatico. Nao responda a esta mensagem.</p>
          <p>2026 Planejar Patrimonio. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Bem-vindo ao Planejar Patrimonio - Seus dados de acesso',
    html,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  newPassword: string
): Promise<boolean> => {
  const html = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a4a5e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #c9a227; color: #1a4a5e; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .credentials { background-color: #fff; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Planejar Patrimonio</h1>
        </div>
        <div class="content">
          <h2>Ola, ${name}!</h2>
          <p>Sua senha foi redefinida com sucesso.</p>
          <div class="credentials">
            <p><strong>Nova senha temporaria:</strong></p>
            <p><strong>${newPassword}</strong></p>
          </div>
          <p><strong>Importante:</strong> Por seguranca, voce devera alterar sua senha no proximo acesso.</p>
          <p style="text-align: center; margin-top: 20px;">
            <a href="https://gestao.planejarpatrimonio.com.br" class="button">Acessar o Sistema</a>
          </p>
        </div>
        <div class="footer">
          <p>Este e um e-mail automatico. Nao responda a esta mensagem.</p>
          <p>2026 Planejar Patrimonio. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Planejar Patrimonio - Sua senha foi redefinida',
    html,
  });
};
