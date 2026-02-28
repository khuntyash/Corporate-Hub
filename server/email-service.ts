import nodemailer from 'nodemailer';
import type { Inquiry, Order, User } from '@shared/schema';

// Create a transporter using Gmail SMTP
// Note: We create it lazily to avoid crashing on startup if env vars are missing.
const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP credentials not found in environment variables. Emails will not be sent.");
    return null;
  }

  // IPv6 Compatible Configuration (Standard Gmail SMTP)
  return nodemailer.createTransport({
    host: 'smtp.gmail.com', // Uses standard DNS resolution (supports both IPv4 and IPv6 natively)
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    }
  });
};

const COMPANY_NAME = process.env.COMPANY_NAME || 'Corporate Hub';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

// Reusable styling for emails to ensure a professional look
const emailStyles = `
  body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-top: 4px solid #0f172a; border-radius: 8px; background-color: #ffffff; }
  .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px; }
  .header h1 { color: #0f172a; margin: 0; font-size: 24px; }
  .content { margin-bottom: 30px; }
  .data-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  .data-table th, .data-table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
  .data-table th { background-color: #f8fafc; font-weight: 600; width: 40%; color: #475569; }
  .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #64748b; }
  .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; background-color: #e2e8f0; color: #1e293b; }
`;

/**
 * Sends inquiry emails to both the user and the admin.
 */
export const sendInquiryEmails = async (inquiry: Inquiry) => {
  const transporter = createTransporter();
  if (!transporter) return;

  try {
    // 1. Send "Thank You" email to User
    const userMailOptions = {
      from: `"${COMPANY_NAME}" <${process.env.SMTP_USER}>`,
      to: inquiry.buyerEmail,
      subject: `Thank you for your inquiry - ${COMPANY_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${COMPANY_NAME}</h1>
            </div>
            <div class="content">
              <p>Dear ${inquiry.buyerName},</p>
              <p>Thank you for contacting us. We have received your inquiry regarding <strong>${inquiry.productName}</strong>.</p>
              <p>Our team is currently reviewing your request and will get back to you shortly with more information.</p>
              
              <p><strong>Your Inquiry Details:</strong></p>
              <table class="data-table">
                <tr><th>Product</th><td>${inquiry.productName}</td></tr>
                <tr><th>Subject</th><td>${inquiry.subject}</td></tr>
                ${inquiry.quantity ? `<tr><th>Quantity Needed</th><td>${inquiry.quantity}</td></tr>` : ''}
              </table>
              
              <p style="margin-top: 20px;">If you have any urgent questions, please feel free to reply directly to this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // 2. Send Notification email to Admin
    const adminMailOptions = {
      from: `"${COMPANY_NAME} System" <${process.env.SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject: `[New Inquiry] ${inquiry.subject} - from ${inquiry.buyerName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Inquiry Received</h1>
            </div>
            <div class="content">
              <p>A new product inquiry has been submitted on the platform.</p>
              
              <table class="data-table">
                <tr><th>Product</th><td>${inquiry.productName}</td></tr>
                <tr><th>Name</th><td>${inquiry.buyerName}</td></tr>
                <tr><th>Email</th><td><a href="mailto:${inquiry.buyerEmail}">${inquiry.buyerEmail}</a></td></tr>
                ${inquiry.buyerPhone ? `<tr><th>Phone</th><td>${inquiry.buyerPhone}</td></tr>` : ''}
                ${inquiry.buyerCompany ? `<tr><th>Company</th><td>${inquiry.buyerCompany}</td></tr>` : ''}
                <tr><th>Subject</th><td>${inquiry.subject}</td></tr>
                <tr><th>Message</th><td>${inquiry.message.replace(/\n/g, '<br/>')}</td></tr>
                ${inquiry.quantity ? `<tr><th>Quantity</th><td>${inquiry.quantity}</td></tr>` : ''}
                ${inquiry.budget ? `<tr><th>Budget</th><td>${inquiry.budget}</td></tr>` : ''}
                <tr><th>Priority</th><td><span class="badge">${inquiry.priority ? inquiry.priority.toUpperCase() : 'MEDIUM'}</span></td></tr>
              </table>
              <br/>
              <p>Please log in to the admin dashboard to respond.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Send emails in parallel
    await Promise.all([
      transporter.sendMail(userMailOptions).catch(e => console.error("Failed to send user inquiry email:", e)),
      transporter.sendMail(adminMailOptions).catch(e => console.error("Failed to send admin inquiry email:", e))
    ]);

    console.log(`[Email Service] Inquiry emails sent successfully for ID: ${inquiry.id}`);
  } catch (error) {
    console.error(`[Email Service] Critical error sending inquiry emails:`, error);
  }
};


/**
 * Sends order emails to both the user and the admin.
 */
export const sendOrderEmails = async (order: Order, userEmail: string, userName: string) => {
  const transporter = createTransporter();
  if (!transporter) return;

  try {
    const formattedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // 1. Send Order Confirmation email to User
    const userMailOptions = {
      from: `"${COMPANY_NAME}" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Order Confirmation: ${order.orderNumber} - ${COMPANY_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${COMPANY_NAME}</h1>
            </div>
            <div class="content">
              <p>Dear ${userName},</p>
              <p>Thank you for your order! We are pleased to confirm that we have received your order <strong>${order.orderNumber}</strong> placed on ${formattedDate}.</p>
              
              <p><strong>Order Summary:</strong></p>
              <table class="data-table">
                <tr><th>Order Number</th><td>${order.orderNumber}</td></tr>
                <tr><th>Date</th><td>${formattedDate}</td></tr>
                <tr><th>Subtotal</th><td>₹${order.subtotal}</td></tr>
                <tr><th>Tax</th><td>₹${order.taxAmount}</td></tr>
                <tr><th>Shipping</th><td>₹${order.shippingAmount}</td></tr>
                <tr><th>Total Amount</th><td><strong>₹${order.totalAmount}</strong></td></tr>
                <tr><th>Payment Status</th><td><span class="badge">${order.paymentStatus.toUpperCase()}</span></td></tr>
              </table>
              
              <p style="margin-top: 20px;">We will notify you once your order has been processed and shipped.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // 2. Send Notification email to Admin
    const adminMailOptions = {
      from: `"${COMPANY_NAME} System" <${process.env.SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject: `[New Order] ${order.orderNumber} placed by ${userName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Order Received</h1>
            </div>
            <div class="content">
              <p>A new order has been placed on the platform.</p>
              
              <table class="data-table">
                <tr><th>Order Number</th><td>${order.orderNumber}</td></tr>
                <tr><th>Customer Name</th><td>${userName}</td></tr>
                <tr><th>Customer Email</th><td><a href="mailto:${userEmail}">${userEmail}</a></td></tr>
                <tr><th>Total Amount</th><td>₹${order.totalAmount}</td></tr>
                <tr><th>Status</th><td><span class="badge">${order.status.toUpperCase()}</span></td></tr>
              </table>
              
              <p style="margin-top: 20px;">Please log in to the admin dashboard to view the full order details and arrange fulfillment.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Send emails in parallel
    await Promise.all([
      transporter.sendMail(userMailOptions).catch(e => console.error("Failed to send user order email:", e)),
      transporter.sendMail(adminMailOptions).catch(e => console.error("Failed to send admin order email:", e))
    ]);

    console.log(`[Email Service] Order emails sent successfully for Order: ${order.orderNumber}`);
  } catch (error) {
    console.error(`[Email Service] Critical error sending order emails:`, error);
  }
};

/**
 * Sends a 6-digit OTP to the user's email for registration verification.
 */
export const sendOTPEmail = async (email: string, otp: string) => {
  const transporter = createTransporter();
  if (!transporter) return;

  try {
    const userMailOptions = {
      from: `"${COMPANY_NAME}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Your Verification Code - ${COMPANY_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${COMPANY_NAME}</h1>
            </div>
            <div class="content" style="text-align: center;">
              <p>Thank you for registering with us.</p>
              <p>Please use the following 6-digit verification code to complete your registration:</p>
              
              <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h2 style="font-size: 36px; letter-spacing: 5px; color: #0f172a; margin: 0;">${otp}</h2>
              </div>
              
              <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes.</p>
              <p style="color: #64748b; font-size: 14px;">If you did not request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(userMailOptions);
    console.log(`[Email Service] OTP email sent successfully to: ${email}`);
  } catch (error) {
    console.error(`[Email Service] Critical error sending OTP email:`, error);
  }
};
