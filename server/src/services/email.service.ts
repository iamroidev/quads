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
        .header { background: #F5ECD7; padding: 40px 24px; text-align: center; border-bottom: 3px solid #1a1a1a; }
        .header h1 { color: #111111; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
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

  private wrapEmail(body: string, headerContent?: string): string {
    const defaultHeader = `
      <div style="text-align: center; padding: 32px 0 20px;">
        <div style="display: inline-flex; align-items: flex-end; gap: 5px;">
          <div style="position: relative; width: 56px; height: 56px; border: 4px solid #1a1a1a; background: #FFFDF7; display: inline-block; vertical-align: bottom; box-shadow: 4px 4px 0 0 #1a1a1a;">
            <div style="position: absolute; top: 11px; left: 11px; width: 22px; height: 22px; border: 6px solid #111; background: transparent;"></div>
            <div style="position: absolute; bottom: 8px; right: 8px; width: 10px; height: 5px; background: #111; transform: rotate(45deg);"></div>
            <div style="position: absolute; top: 4px; right: 4px; width: 9px; height: 9px; border-radius: 50%; background: #ff6b6b; border: 2px solid #1a1a1a;"></div>
          </div>
          ${['U','A','D','S'].map(c => `<div style="width: 20px; height: 20px; border: 2px solid #1a1a1a; background: #FFFDF7; display: inline-flex; align-items: center; justify-content: center; vertical-align: bottom; margin-bottom: 1px;"><span style="color: #111; font-size: 10px; font-weight: 900; font-family: Arial, sans-serif;">${c}</span></div>`).join('')}
        </div>
      </div>
    `;
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
            ${headerContent || defaultHeader}
          </div>
          <div class="content">
            ${body}
          </div>
          <div class="footer">
            <p><strong>QUADS Marketplace</strong> — The Official Institutional Exchange · UMaT, Tarkwa</p>
            <p><a href="${process.env.CLIENT_URL || 'https://quadsmarket.tech'}">quadsmarket.tech</a> &nbsp;·&nbsp; support@quadsmarket.tech</p>
            <p style="margin-top: 16px; opacity: 0.7;">Official system transmission. Do not reply to this address.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private wrapEmailWithLogo(body: string, logoBlock: string): string {
    return this.wrapEmail(body, logoBlock);
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

    const subject = isSeller
      ? `Your QUADS Seller Account is Active — ${name}`
      : `Welcome to QUADS — Your Campus Marketplace Account is Ready`;

    // Q logo block — light mode (cork-board background)
    const qLogo = `
      <div style="text-align: center; padding: 36px 0 24px;">
        <div style="display: inline-flex; align-items: flex-end; gap: 6px;">
          <!-- Outer Q box -->
          <div style="position: relative; width: 68px; height: 68px; border: 4px solid #1a1a1a; background: #FFFDF7; display: inline-block; vertical-align: bottom; box-shadow: 5px 5px 0 0 #1a1a1a;">
            <div style="position: absolute; top: 14px; left: 14px; width: 28px; height: 28px; border: 7px solid #111111; background: transparent;"></div>
            <div style="position: absolute; bottom: 10px; right: 10px; width: 12px; height: 6px; background: #111111; transform: rotate(45deg);"></div>
            <div style="position: absolute; top: 5px; right: 5px; width: 10px; height: 10px; border-radius: 50%; background: #ff6b6b; border: 2px solid #1a1a1a;"></div>
          </div>
          <!-- U A D S tiles -->
          ${['U','A','D','S'].map(c => `<div style="width: 24px; height: 24px; border: 2px solid #1a1a1a; background: #FFFDF7; display: inline-flex; align-items: center; justify-content: center; vertical-align: bottom; margin-bottom: 2px; box-shadow: 2px 2px 0 0 #1a1a1a;"><span style="color: #111111; font-size: 12px; font-weight: 900; font-family: Arial, sans-serif;">${c}</span></div>`).join('')}
        </div>
        <!-- Tagline -->
        <div style="margin-top: 14px; font-size: 9px; font-weight: 900; letter-spacing: 2px; color: #6B6B6B; text-transform: uppercase; font-family: Arial, sans-serif; border-top: 1px solid rgba(0,0,0,0.15); padding-top: 10px; display: inline-block;">THE OFFICIAL INSTITUTIONAL MARKETPLACE</div>
      </div>
    `;

    const sellerBody = `
      <div class="role-badge">CAMPUS MERCHANT — ACCOUNT ACTIVATED</div>
      <h2>You Are Live on QUADS, ${name.split(' ')[0]}.</h2>

      <p style="font-size: 15px; line-height: 1.7; color: #333;">
        Your seller account at <strong>UMaT's official campus marketplace</strong> is fully active.
        You can now list products, receive verified orders, and collect payments directly to your Mobile Money account — all within campus.
      </p>

      <div style="background: #faf8f5; border-left: 6px solid #000; padding: 20px 24px; margin: 28px 0;">
        <p style="margin: 0 0 14px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #000;">YOUR FIRST THREE STEPS</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; vertical-align: top; width: 28px;">
              <div style="width: 22px; height: 22px; background: #000; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ff6b6b; font-size: 11px; font-weight: 900;">01</span>
              </div>
            </td>
            <td style="padding: 10px 0 10px 12px; border-bottom: 1px solid #eee;">
              <strong style="font-size: 13px;">Set Up Your Payout</strong><br>
              <span style="font-size: 12px; color: #555; line-height: 1.6;">Go to <em>Profile &rarr; Seller Onboarding</em> and enter your MTN, Telecel, or AirtelTigo Mobile Money number so you can receive earnings automatically.</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; vertical-align: top;">
              <div style="width: 22px; height: 22px; background: #000; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ff6b6b; font-size: 11px; font-weight: 900;">02</span>
              </div>
            </td>
            <td style="padding: 10px 0 10px 12px; border-bottom: 1px solid #eee;">
              <strong style="font-size: 13px;">Create Your First Listing</strong><br>
              <span style="font-size: 12px; color: #555; line-height: 1.6;">Use clear photos against a neutral background. Set a fair price. Add accurate tags so buyers find you in search.</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; vertical-align: top;">
              <div style="width: 22px; height: 22px; background: #000; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ff6b6b; font-size: 11px; font-weight: 900;">03</span>
              </div>
            </td>
            <td style="padding: 10px 0 10px 12px;">
              <strong style="font-size: 13px;">Grow With Tools</strong><br>
              <span style="font-size: 12px; color: #555; line-height: 1.6;">Use the Growth Toolkit to create coupon codes, bundles, and smart pricing to attract more buyers and increase conversions.</span>
            </td>
          </tr>
        </table>
      </div>

      <div style="background: #fff8e1; border: 2px solid #000; padding: 16px 20px; margin: 0 0 28px; font-size: 12px; line-height: 1.6;">
        <strong>How payouts work:</strong> When a buyer completes an order and verifies receipt, QUADS releases your earnings (minus a small platform commission) directly to your registered Mobile Money account within one business day.
      </div>

      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'https://quadsmarket.tech'}/seller/onboarding" style="display: inline-block; background: #ff6b6b; color: #ffffff !important; text-decoration: none; padding: 16px 36px; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: 1.5px; border: 2px solid #000; box-shadow: 5px 5px 0 0 #000000; margin-bottom: 28px;">Complete Seller Setup</a>
      </div>

      <div class="divider"></div>
      <p style="font-size: 12px; color: #888; line-height: 1.7;">
        Respond to buyers promptly. Honour orders you confirm. Coordinate pickup at visible, public campus locations. Your reputation score is visible to all buyers — keep it high.
      </p>
    `;

    const buyerBody = `
      <div class="role-badge">CAMPUS BUYER — ACCOUNT READY</div>
      <h2>Welcome to QUADS, ${name.split(' ')[0]}.</h2>

      <p style="font-size: 15px; line-height: 1.7; color: #333;">
        You now have full access to <strong>UMaT's official campus marketplace</strong> — the only platform built exclusively for the University of Mines and Technology community in Tarkwa.
        Browse thousands of listings from fellow students: textbooks, electronics, food, clothing, services, and more.
      </p>

      <div style="background: #faf8f5; border-left: 6px solid #000; padding: 20px 24px; margin: 28px 0;">
        <p style="margin: 0 0 14px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #000;">HOW BUYING ON QUADS WORKS</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; vertical-align: top; width: 28px;">
              <div style="width: 22px; height: 22px; background: #000; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ff6b6b; font-size: 11px; font-weight: 900;">01</span>
              </div>
            </td>
            <td style="padding: 10px 0 10px 12px; border-bottom: 1px solid #eee;">
              <strong style="font-size: 13px;">Browse and Add to Cart</strong><br>
              <span style="font-size: 12px; color: #555; line-height: 1.6;">Search by category, condition, or keyword. Filter by price, location, or seller rating to find exactly what you need.</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; vertical-align: top;">
              <div style="width: 22px; height: 22px; background: #000; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ff6b6b; font-size: 11px; font-weight: 900;">02</span>
              </div>
            </td>
            <td style="padding: 10px 0 10px 12px; border-bottom: 1px solid #eee;">
              <strong style="font-size: 13px;">Pay Securely via Escrow</strong><br>
              <span style="font-size: 12px; color: #555; line-height: 1.6;">Pay using MTN, Telecel, or AirtelTigo Mobile Money. Your funds are held in QUADS escrow — the seller receives nothing until you confirm receipt.</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; vertical-align: top;">
              <div style="width: 22px; height: 22px; background: #000; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ff6b6b; font-size: 11px; font-weight: 900;">03</span>
              </div>
            </td>
            <td style="padding: 10px 0 10px 12px;">
              <strong style="font-size: 13px;">Verify and Complete</strong><br>
              <span style="font-size: 12px; color: #555; line-height: 1.6;">Meet the seller at a visible campus spot. Inspect the item, enter the handoff code from your order screen to confirm receipt and release payment.</span>
            </td>
          </tr>
        </table>
      </div>

      <div style="background: #fff8e1; border: 2px solid #000; padding: 16px 20px; margin: 0 0 28px; font-size: 12px; line-height: 1.6;">
        <strong>Buyer Protection:</strong> If an item is misrepresented or a seller fails to deliver, open a dispute from your order page. Our moderation team reviews all cases and funds are refunded where warranted.
      </div>

      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'https://quadsmarket.tech'}/products" style="display: inline-block; background: #ff6b6b; color: #ffffff !important; text-decoration: none; padding: 16px 36px; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: 1.5px; border: 2px solid #000; box-shadow: 5px 5px 0 0 #000000; margin-bottom: 28px;">Browse Campus Listings</a>
      </div>

      <div class="divider"></div>
      <p style="font-size: 12px; color: #888; line-height: 1.7;">
        Save items you like. Message sellers directly. Check ratings before buying. Coordinate in safe, well-lit public areas on campus. Your security and satisfaction matter.
      </p>
    `;

    const body = isSeller ? sellerBody : buyerBody;
    return this.sendEmail({ to, subject, html: this.wrapEmailWithLogo(body, qLogo) });
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
