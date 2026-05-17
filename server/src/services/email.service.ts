import axios from 'axios';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private readonly apiKey: string;
  private readonly apiUrl: string = 'https://api.resend.com/emails';

  constructor() {
    // We use SMTP_PASS as the API key for Resend since that's where the user stored it
    this.apiKey = process.env.SMTP_PASS || 're_123456789';
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
        .btn { display: inline-block; background: #000000; color: #ffffff !important; text-decoration: none; padding: 16px 32px; font-weight: 900; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; margin: 24px 0; border: none; }
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
            <!-- Brand Neobrutalist Logo Container -->
            <div style="display: inline-block; transform: rotate(-3deg); border: 4px solid #ffffff; border-radius: 16px; padding: 8px 32px; background: #000000; margin: 10px 0;">
              <span style="font-family: 'Arial', sans-serif; font-weight: 900; font-style: italic; font-size: 32px; color: #ff6b6b; letter-spacing: -1.5px; text-transform: uppercase;">QUADS</span>
            </div>
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
      console.log(`[EmailService] Posting to Resend API for: ${options.to}`);
      
      const response = await axios.post(
        this.apiUrl,
        {
          from: `QUADS <${fromEmail}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        console.log('[EmailService] Success! Email ID:', response.data?.id);
        return true;
      }

      console.error('[EmailService] Resend API Non-200 Response:', response.status, response.data);
      return false;
    } catch (error: any) {
      if (error.response) {
        console.error('[EmailService] Resend API Error:', error.response.status, error.response.data);
      } else {
        console.error('[EmailService] Fatal Error:', error.message);
      }
      return false;
    }
  }

  // ─── Templates ─────────────────────────────────────

  async sendWelcomeEmail(to: string, name: string, role: string = 'buyer'): Promise<boolean> {
    const isSeller = role === 'seller' || role === 'admin';
    const subject = `Welcome to QUADS — Ready to ${isSeller ? 'Sell' : 'Shop'}? 🎉`;
    
    const roleContent = isSeller 
      ? `
        <div class="role-badge">💼 CAMPUS MERCHANT ACTIVATED</div>
        <h2>Start Your Student Business Empire, ${name}!</h2>
        <p>Your seller store is officially active. You are now fully unlocked to list products, accept secure campus payments, and reach thousands of potential UMaT student buyers immediately.</p>
        
        <div style="background: #fffacd; padding: 20px; border: 2px solid #000; margin: 24px 0;">
          <p style="margin: 0; font-weight: 900; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px;">🚀 GETTING STARTED:</p>
          <ul style="margin: 12px 0 0 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
            <li><strong>Configure Payouts:</strong> Enter your Mobile Money details in your profile to receive funds directly.</li>
            <li><strong>List with Care:</strong> Take clear photos in good lighting and set competitive student-friendly prices.</li>
            <li><strong>Boost Conversions:</strong> Generate custom seller coupons or bundles to attract buyers to your listings.</li>
          </ul>
        </div>
      `
      : `
        <div class="role-badge">🎉 CAMPUS ACCESS GRANTED</div>
        <h2>Welcome to UMaT's Official Marketplace, ${name}!</h2>
        <p>Your student credentials have been verified. You're now unlocked to browse, buy, and trade directly with fellow peers on campus. No shipping fees, no off-campus meetups, just pure convenience.</p>
        
        <div style="background: #fffacd; padding: 20px; border: 2px solid #000; margin: 24px 0;">
          <p style="margin: 0; font-weight: 900; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px;">🔍 SHOPPING TIPS:</p>
          <ul style="margin: 12px 0 0 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
            <li><strong>Find Deals:</strong> Filter by categories to find textbook deals, tech gear, or dorm essentials.</li>
            <li><strong>Escrow Protection:</strong> Pay securely via Mobile Money (MTN, Telecel, AirtelTigo). Funds are held safely in escrow until you verify the item!</li>
            <li><strong>Handoff Safe:</strong> Meet the seller in broad daylight at popular campus spots like the library or campus cafeterias.</li>
          </ul>
        </div>
      `;

    const body = `
      ${roleContent}
      
      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'https://quadsmarket.tech'}/dashboard" class="btn btn-primary" style="display: inline-block; background: #ff6b6b; color: #ffffff !important; text-decoration: none; padding: 16px 32px; font-weight: 900; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; margin: 24px 0; border: 2px solid #000; box-shadow: 4px 4px 0 0 #000000;">Enter Dashboard</a>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 13px; color: #666;">
        <strong>Safety First:</strong> Never share sensitive personal info. Keep all coordination inside the campus platform for your peace of mind and protection.
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

  // Price alert email templates
  async sendPriceDropAlert(to: string, name: string, productTitle: string, currentPrice: number, originalPrice: number, productId: string): Promise<boolean> {
    const savings = originalPrice - currentPrice;
    const savingsPercent = ((savings / originalPrice) * 100).toFixed(0);
    
    const subject = `Price Drop Alert: ${productTitle} is now GHS ${currentPrice.toFixed(2)}`;
    const body = `
      <h2>📉 Price Drop Alert!</h2>
      <p>Hi ${name},</p>
      <p>One of your saved items has dropped in price:</p>
      
      <div style="background: #fffacd; border: 2px solid #000; padding: 24px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #000;">${productTitle}</h3>
        <p><span class="highlight">Was:</span> GHS ${originalPrice.toFixed(2)}</p>
        <p><span class="highlight">Now:</span> GHS ${currentPrice.toFixed(2)}</p>
        <p><span class="highlight">You save:</span> GHS ${savings.toFixed(2)} (${savingsPercent}% off)</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'https://quadsmarket.tech'}/products/${productId}" class="btn btn-primary">View Item</a>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 13px; color: #666; text-align: center;">
        You're receiving this because you saved this item and have price alerts enabled.
        <br>Manage your alert preferences in your account settings.
      </p>
    `;
    return this.sendEmail({ to, subject, html: this.wrapEmail(body) });
  }

  async sendPriceIncreaseAlert(to: string, name: string, productTitle: string, currentPrice: number, originalPrice: number, productId: string): Promise<boolean> {
    const increase = currentPrice - originalPrice;
    const increasePercent = ((increase / originalPrice) * 100).toFixed(0);
    
    const subject = `Price Increase Alert: ${productTitle} is now GHS ${currentPrice.toFixed(2)}`;
    const body = `
      <h2>📈 Price Increase Alert</h2>
      <p>Hi ${name},</p>
      <p>One of your saved items has increased in price:</p>
      
      <div style="background: #ffebee; border: 2px solid #000; padding: 24px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #000;">${productTitle}</h3>
        <p><span class="highlight">Was:</span> GHS ${originalPrice.toFixed(2)}</p>
        <p><span class="highlight">Now:</span> GHS ${currentPrice.toFixed(2)}</p>
        <p><span class="highlight">Increase:</span> GHS ${increase.toFixed(2)} (${increasePercent}% increase)</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'https://quadsmarket.tech'}/products/${productId}" class="btn">View Item</a>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 13px; color: #666; text-align: center;">
        You're receiving this because you saved this item and have price alerts enabled.
        <br>Manage your alert preferences in your account settings.
      </p>
    `;
    return this.sendEmail({ to, subject, html: this.wrapEmail(body) });
  }
}

export const emailService = new EmailService();