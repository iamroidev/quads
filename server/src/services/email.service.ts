import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private resend: Resend;

  constructor() {
    // We use SMTP_PASS as the API key for Resend since that's where the user stored it
    const apiKey = process.env.SMTP_PASS || 're_123456789';
    this.resend = new Resend(apiKey);
  }

  private getBaseStyles(): string {
    return `
      <style>
        body { margin: 0; padding: 0; background: #faf8f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border: 4px solid #000000; box-shadow: 12px 12px 0 0 rgba(0,0,0,0.1); }
        .header { background: #000000; padding: 40px 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
        .header span { color: #ff6b6b; }
        .content { padding: 40px 32px; color: #1a1a1a; line-height: 1.6; font-size: 16px; }
        .content h2 { color: #000000; font-size: 24px; font-weight: 900; margin-top: 0; text-transform: uppercase; letter-spacing: -0.5px; }
        .btn { display: inline-block; background: #000000; color: #ffffff !important; text-decoration: none; padding: 16px 32px; font-weight: 900; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; margin: 24px 0; border: none; transition: all 0.2s; }
        .btn-primary { background: #ff6b6b; color: #ffffff !important; }
        .footer { background: #faf8f5; padding: 32px; text-align: center; font-size: 11px; color: #666666; border-top: 2px solid #eeeeee; }
        .footer a { color: #000000; text-decoration: underline; font-weight: 700; }
        .divider { height: 4px; background: #000000; margin: 32px 0; opacity: 0.1; }
        .highlight { background: #fffacd; padding: 2px 6px; font-weight: 700; border: 1px solid #000; }
        .role-badge { display: inline-block; background: #000; color: #fff; padding: 4px 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
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
            <p><strong>QUADS Marketplace</strong> — Institutional Exchange</p>
            <p><a href="${process.env.CLIENT_URL || 'https://quadsmarket.tech'}">quadsmarket.tech</a> · Support: support@quadsmarket.tech</p>
            <p style="margin-top: 16px;">This is an official system transmission. Please do not reply directly to this address.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const fromEmail = process.env.SMTP_FROM || 'support@quadsmarket.tech';
      console.log(`[EmailService] Attempting to send to ${options.to} via Resend API`);
      
      const { data, error } = await this.resend.emails.send({
        from: `QUADS <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        console.error('[EmailService] Resend API Error:', error);
        return false;
      }

      console.log('[EmailService] Success! Email ID:', data?.id);
      return true;
    } catch (error) {
      console.error('[EmailService] Fatal Error:', error);
      return false;
    }
  }

  // ─── Templates ─────────────────────────────────────

  async sendWelcomeEmail(to: string, name: string, role: string = 'buyer'): Promise<boolean> {
    const isSeller = role === 'seller' || role === 'admin';
    const subject = `Welcome to QUADS — Ready to ${isSeller ? 'Sell' : 'Shop'}? 🎉`;
    
    const roleContent = isSeller 
      ? `
        <div class="role-badge">SELLER ACCOUNT ACTIVATED</div>
        <h2>Start your campus empire, ${name}!</h2>
        <p>Your seller profile is now live. You can now list items, track sales, and grow your brand within the UMaT community.</p>
        
        <div style="background: #fffacd; padding: 20px; border: 2px solid #000; margin: 24px 0;">
          <p style="margin: 0; font-weight: 700;">NEXT STEPS:</p>
          <ul style="margin: 12px 0 0 0; padding-left: 20px;">
            <li>Complete your <strong>Payout Setup</strong> in the dashboard</li>
            <li>List your first item with clear photos</li>
            <li>Share your shop link with friends</li>
          </ul>
        </div>
      `
      : `
        <div class="role-badge">BUYER ACCOUNT ACTIVATED</div>
        <h2>Welcome to the Market, ${name}!</h2>
        <p>You now have access to hundreds of verified listings from students across campus.</p>
        <p>From electronics to textbooks, find what you need securely.</p>
      `;

    const body = `
      ${roleContent}
      
      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'https://quadsmarket.tech'}/dashboard" class="btn btn-primary">Enter Dashboard</a>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 13px; color: #666;">
        <strong>Safety First:</strong> Always meet in public spaces like the library or campus cafeterias for item handovers.
      </p>
    `;
    
    return this.sendEmail({ to, subject, html: this.wrapEmail(body) });
  }

  async sendVerificationEmail(to: string, name: string, code: string): Promise<boolean> {
    const subject = `${code} is your QUADS verification code`;
    const body = `
      <h2>Identity Verification</h2>
      <p>Hi ${name}, use the security code below to verify your account action:</p>
      
      <div style="background: #000000; color: #ff6b6b; padding: 32px; text-align: center; margin: 24px 0; font-size: 42px; font-weight: 900; letter-spacing: 10px;">
        ${code}
      </div>
      
      <p style="font-size: 12px; color: #666; text-align: center;">This code expires in 10 minutes. If you did not request this, please secure your account.</p>
    `;
    return this.sendEmail({ to, subject, html: this.wrapEmail(body) });
  }

  async sendOrderUpdateEmail(to: string, orderId: string, status: string): Promise<boolean> {
    const statusMessages: Record<string, string> = {
      pending: 'Waiting for seller confirmation.',
      confirmed: 'Seller has confirmed! Preparing for handover.',
      ready: 'Item is ready for pickup/delivery!',
      completed: 'Transaction successful. Thank you!',
      cancelled: 'Order has been cancelled.',
    };

    const subject = `Order Update: ${status.toUpperCase()}`;
    const body = `
      <h2>Order Status Update</h2>
      <p>Your order <strong>#${orderId.slice(-8).toUpperCase()}</strong> has shifted status:</p>
      
      <div style="background: #faf8f5; border: 2px solid #000; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 24px; font-weight: 900; text-transform: uppercase;">${status}</span>
        <p style="margin-top: 8px; font-size: 14px; opacity: 0.6;">${statusMessages[status] || ''}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'https://quadsmarket.tech'}/orders/${orderId}" class="btn">View Order Details</a>
      </div>
    `;
    return this.sendEmail({ to, subject, html: this.wrapEmail(body) });
  }

  async sendPaymentReceiptEmail(to: string, orderId: string, amount: number): Promise<boolean> {
    const subject = 'Receipt for Order #' + orderId.slice(-8).toUpperCase();
    const body = `
      <h2>Payment Confirmed ✓</h2>
      <p>Your payment has been received and is being held securely in escrow.</p>
      
      <div style="background: #faf8f5; border: 2px solid #000; padding: 24px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-size: 13px; opacity: 0.6;">REFERENCE</td>
            <td style="padding: 8px 0; font-size: 13px; font-weight: 700; text-align: right;">#${orderId.slice(-8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 13px; opacity: 0.6;">AMOUNT PAID</td>
            <td style="padding: 8px 0; font-size: 13px; font-weight: 700; text-align: right;">GHS ${amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 13px; opacity: 0.6;">PROTECTION</td>
            <td style="padding: 8px 0; font-size: 13px; font-weight: 700; text-align: right; color: #059669;">QUADS ESCROW</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'https://quadsmarket.tech'}/orders/${orderId}" class="btn btn-primary">Track Progress</a>
      </div>
    `;
    return this.sendEmail({ to, subject, html: this.wrapEmail(body) });
  }
}

export const emailService = new EmailService();