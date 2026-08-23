import nodemailer from 'nodemailer';

export const mailTransport = nodemailer.createTransport({
  host: process.env['SMTP_HOST'],
  port: parseInt(process.env['SMTP_PORT'] as string, 10),
  secure: false,
});