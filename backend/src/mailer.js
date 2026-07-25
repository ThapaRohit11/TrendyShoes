import nodemailer from 'nodemailer'
import { config } from './config.js'

let transporter

function getTransporter() {
  if (!config.userEmail || !config.appPassword) throw new Error('USER_EMAIL and APP_PASSWORD must be configured')
  transporter ||= nodemailer.createTransport({
    service: 'gmail',
    auth: { user: config.userEmail, pass: config.appPassword },
  })
  return transporter
}

export function sendPasswordResetEmail(recipient, resetUrl) {
  return getTransporter().sendMail({
    from: `TrendyShoes <${config.userEmail}>`,
    to: recipient,
    subject: 'Reset your TrendyShoes password',
    text: `Use this secure link to reset your password: ${resetUrl}\n\nThis link expires in 15 minutes. If you did not request it, ignore this email.`,
    html: `<h2>Reset your TrendyShoes password</h2><p>Use the secure link below to choose a new password. It expires in 15 minutes and can only be used once.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, ignore this email.</p>`,
  })
}

export function sendTwoFactorCode(recipient, code) {
  return getTransporter().sendMail({
    from: `TrendyShoes <${config.userEmail}>`,
    to: recipient,
    subject: 'Your TrendyShoes verification code',
    text: `Your TrendyShoes verification code is ${code}. It expires in 10 minutes. Never share this code.`,
    html: `<h2>Verify your TrendyShoes login</h2><p>Your verification code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes. Never share it.</p>`,
  })
}