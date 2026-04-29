"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendStudentCredentials = exports.sendPaymentConfirmationEmail = exports.sendResultNotificationEmail = exports.sendPasswordResetEmail = exports.sendWelcomeEmail = exports.sendEmail = void 0;
const resend_config_1 = require("../config/resend.config");
const logger_util_1 = require("../utils/logger.util");
/**
 * Send an email
 */
const sendEmail = async (options) => {
    const resend = (0, resend_config_1.getResendClient)();
    if (!resend) {
        logger_util_1.logger.warn("Email service not configured. Email not sent:", options.subject);
        return false;
    }
    try {
        await resend.emails.send({
            from: resend_config_1.resendConfig.from,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });
        logger_util_1.logger.info("Email sent successfully:", {
            to: options.to,
            subject: options.subject,
        });
        return true;
    }
    catch (error) {
        logger_util_1.logger.error("Error sending email:", error);
        return false;
    }
};
exports.sendEmail = sendEmail;
/**
 * Send welcome email
 */
const sendWelcomeEmail = async (email, firstName, schoolName, temporaryPassword) => {
    const appUrl = resend_config_1.resendConfig.appUrl;
    const appName = resend_config_1.resendConfig.appName;
    const passwordSection = temporaryPassword
        ? `
      <p>Your temporary password is: <strong>${temporaryPassword}</strong></p>
      <p>Please change your password after logging in for security.</p>
    `
        : "";
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${appName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${appName}</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Welcome, ${firstName}!</h2>
        
        <p>Your account has been created at <strong>${schoolName}</strong>.</p>
        
        <p>You can now log in to access your dashboard and manage your academic activities.</p>
        
        ${passwordSection}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/login" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login Now</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          If you have any questions, please contact your school administrator.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          This email was sent by ${appName}. If you did not create an account, please ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;
    return (0, exports.sendEmail)({
        to: email,
        subject: `Welcome to ${appName}`,
        html,
    });
};
exports.sendWelcomeEmail = sendWelcomeEmail;
/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, firstName, resetToken) => {
    const appUrl = resend_config_1.resendConfig.appUrl;
    const appName = resend_config_1.resendConfig.appName;
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${appName}</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Reset Your Password</h2>
        
        <p>Hi ${firstName},</p>
        
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
        </p>
        
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          This email was sent by ${appName}. If you did not request a password reset, please ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;
    return (0, exports.sendEmail)({
        to: email,
        subject: `Reset Your Password - ${appName}`,
        html,
    });
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
/**
 * Send result notification email
 */
const sendResultNotificationEmail = async (email, firstName, termName, schoolName) => {
    const appUrl = resend_config_1.resendConfig.appUrl;
    const appName = resend_config_1.resendConfig.appName;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Results are Ready</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${appName}</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Your Results are Ready!</h2>
        
        <p>Hi ${firstName},</p>
        
        <p>Your <strong>${termName}</strong> results at <strong>${schoolName}</strong> are now available for viewing.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/results" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Results</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Note: You must have paid your school fees to view your results.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          This email was sent by ${appName}.
        </p>
      </div>
    </body>
    </html>
  `;
    return (0, exports.sendEmail)({
        to: email,
        subject: `Your ${termName} Results are Ready - ${schoolName}`,
        html,
    });
};
exports.sendResultNotificationEmail = sendResultNotificationEmail;
/**
 * Send payment confirmation email
 */
const sendPaymentConfirmationEmail = async (email, firstName, amount, termName, reference, schoolName) => {
    const appName = resend_config_1.resendConfig.appName;
    const formattedAmount = new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
    }).format(amount);
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${appName}</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #28a745;">Payment Confirmed!</h2>
        
        <p>Hi ${firstName},</p>
        
        <p>Your payment has been successfully processed.</p>
        
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Term:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${termName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Reference:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${reference}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0;"><strong>School:</strong></td>
              <td style="padding: 10px 0; text-align: right;">${schoolName}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Please keep this email as your payment receipt.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          This email was sent by ${appName}.
        </p>
      </div>
    </body>
    </html>
  `;
    return (0, exports.sendEmail)({
        to: email,
        subject: `Payment Confirmed - ${formattedAmount} - ${schoolName}`,
        html,
    });
};
exports.sendPaymentConfirmationEmail = sendPaymentConfirmationEmail;
/**
 * Send student credentials to guardian
 */
const sendStudentCredentials = async (email, data) => {
    const appName = resend_config_1.resendConfig.appName;
    const appUrl = resend_config_1.resendConfig.appUrl;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Student Account Credentials</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${appName}</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Student Credentials</h2>
        
        <p>Dear ${data.guardianName},</p>
        
        <p>A student account has been created for <strong>${data.studentName}</strong>.</p>
        
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #eee;">
          <p style="margin: 5px 0;"><strong>Student Name:</strong> ${data.studentName}</p>
          <p style="margin: 5px 0;"><strong>Student ID:</strong> ${data.studentId}</p>
          <p style="margin: 5px 0;"><strong>Login Email:</strong> ${data.loginEmail}</p>
          <p style="margin: 5px 0;"><strong>Password:</strong> ${data.password}</p>
        </div>
        
        <p>Please keep these credentials secure. The student can use the email and password to log in to the portal.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/login" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Portal</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          This email was sent by ${appName}. If you did not expect this, please contact the school administration.
        </p>
      </div>
    </body>
    </html>
  `;
    return (0, exports.sendEmail)({
        to: email,
        subject: `Student Credentials - ${data.studentName} - ${appName}`,
        html,
    });
};
exports.sendStudentCredentials = sendStudentCredentials;
//# sourceMappingURL=email.service.js.map