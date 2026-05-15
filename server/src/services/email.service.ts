import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  private getBaseStyles(): string {
    return `
      <style>
        body { margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #0a0a0a; padding: 32px 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; }
        .header span { color: #fbbf24; }
        .content { padding: 32px 24px; color: #374151; line-height: 1.7; font-size: 15px; }
        .content h2 { color: #0a0a0a; font-size: 20px; font-weight: 700; margin-top: 0; }
        .btn { display: inline-block; background: #0a0a0a; color: #ffffff; text-decoration: none; padding: 14px 32px; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 2px; border-radius: 4px; margin: 16px 0; }
        .btn-primary { background: #fbbf24; color: #0a0a0a; }
        .footer { background: #f3f4f6; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af; }
        .footer a { color: #6b7280; text-decoration: none; }
        .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
        .highlight { background: #fef3c7; padding: 2px 6px; font-weight: 600; border-radius: 3px; }
      </style>
    `;
  }

  private wrapEmail(body: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${this.getBaseStyles()}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>QUA<span>DS</span></h1>
          </div>
          <div class="content">
            ${body}
          </div>
          <div class="footer">
            <p>QUADS — UMaT Campus Marketplace</p>
            <p><a href="${process.env.CLIENT_URL || 'https://quadsmarket.tech'}">quadsmarket.tech</a> · Support: support@quadsmarket.tech</p>
            <p style="font-size: 11px; margin-top: 12px;">You received this email because you're a member of the QUADS marketplace.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"QUADS" <${process.env.SMTP_FROM || 'noreply@quadsmarket.tech'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);

      if (process.env.NODE_ENV !== 'production' && info.messageId) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // ─── Templates ─────────────────────────────────────

  async sendWelcomeEmail(to: string, name: string, role: string = 'buyer'): Promise<boolean> {
    const subject = `Welcome to QUADS — You're ready to ${role === 'seller' ? 'Sell' : 'Shop'}! 🎉`;
    
    const roleSpecificContent = role === 'seller' 
      ? `
        <div style="background: #fffacd; padding: 20px; border-radius: 8px; border: 2px solid #000; margin: 20px 0;">
          <h3 style="margin-top: 0; text-transform: uppercase; font-size: 14px;">🚀 Seller Quickstart</h3>
          <p style="margin-bottom: 0;">You've joined as a <strong>Seller</strong>. Start by creating your first listing to reach students across the UMaT campus!</p>
        </div>
        <ul>
          <li>📦 <strong>List Items</strong> — Upload photos and set your price</li>
          <li>📈 <strong>Analytics</strong> — Track your shop performance</li>
          <li>💸 <strong>Earnings</strong> — Get paid directly via MoMo or Bank</li>
        </ul>
      `
      : `
        <p>You're now part of <strong>QUADS</strong> — the safest and smartest way to buy and sell on the UMaT campus.</p>
        <ul>
          <li>🛍️ <strong>Browse</strong> — Discover items from verified campus sellers</li>
          <li>💬 <strong>Chat</strong> — Negotiate prices and arrange meetups securely</li>
          <li>🔒 <strong>Pay safely</strong> — Escrow-protected payments via Paystack</li>
        </ul>
      `;

    const body = `
      <h2>Welcome aboard, ${name}!</h2>
      ${roleSpecificContent}
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL || 'https://quadsmarket.tech'}/dashboard" class="btn btn-primary">Go to Dashboard</a>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 13px; color: #6b7280;">
        💡 <strong>Pro tip:</strong> Always meet in public "Safe Zones" on campus for exchanges.
      </p>
    `;
    return this.sendEmail({ to, subject, html: this.wrapEmail(body) });
  }

  async sendOrderUpdateEmail(to: string, orderId: string, status: string): Promise<boolean> {
    const statusMessages: Record<string, string> = {
      pending: 'Your order is awaiting seller confirmation.',
      confirmed: 'The seller has confirmed your order!',
      ready: 'Your order is ready for pickup!',
      completed: 'Your order has been completed. Enjoy!',
      cancelled: 'Your order has been cancelled.',
    };

    const subject = `Order Update: ${status.toUpperCase()}`;
    const body = `
      <h2>Order Status Update</h2>
      <p>Your order <strong>#${orderId.slice(-8).toUpperCase()}</strong> has been updated.</p>
      
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 28px; font-weight: 800; color: #0a0a0a;">${status.toUpperCase()}</span>
      </div>
      
      <p>${statusMessages[status] || 'Your order status has changed.'}</p>
      
      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'https://quadsmarket.tech'}/orders/${orderId}" class="btn">View Order</a>
      </div>
    `;
    return this.sendEmail({ to, subject, html: this.wrapEmail(body) });
  }

  async sendPaymentReceiptEmail(to: string, orderId: string, amount: number): Promise<boolean> {
    const subject = 'Payment Receipt — QUADS';
    const body = `
      <h2>Payment Successful ✓</h2>
      <p>Thank you for your purchase on <strong>QUADS</strong>!</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Order:</strong> #${orderId.slice(-8).toUpperCase()}</p>
        <p style="margin: 4px 0;"><strong>Amount:</strong> GHS ${amount.toFixed(2)}</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #059669;">Paid & Secured</span></p>
      </div>
      
      <p>The seller has been notified and will process your order shortly. Your payment is held securely until you confirm receipt.</p>
      
      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'https://quadsmarket.tech'}/orders/${orderId}" class="btn btn-primary">Track Order</a>
      </div>
    `;
    return this.sendEmail({ to, subject, html: this.wrapEmail(body) });
  }

  async sendVerificationEmail(to: string, name: string, code: string): Promise<boolean> {
    const subject = 'Your QUADS Verification Code';
    const body = `
      <h2>Hi ${name},</h2>
      <p>Use the code below to verify your action on <strong>QUADS</strong>:</p>
      
      <div style="background: #0a0a0a; padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: 800; color: #fbbf24; letter-spacing: 8px;">${code}</span>
      </div>
      
      <p style="font-size: 13px; color: #6b7280;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    `;
    return this.sendEmail({ to, subject, html: this.wrapEmail(body) });
  }
}

export const emailService = new EmailService();