const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../server/src/services/email.service.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const targetString = `  async sendWelcomeEmail(to: string, name: string, role: string = 'buyer'): Promise<boolean> {`;
// Find index of this method
const startIndex = content.indexOf(targetString);
if (startIndex === -1) {
  console.error("Could not find start of sendWelcomeEmail method!");
  process.exit(1);
}

// Find the end of this method.
const oldEndSegment = `    return this.sendEmail({ to, subject, html: this.wrapEmail(body) });\r\n  }`;
const oldEndSegmentLF = `    return this.sendEmail({ to, subject, html: this.wrapEmail(body) });\n  }`;

let endIndex = content.indexOf(oldEndSegment, startIndex);
let endLength = oldEndSegment.length;

if (endIndex === -1) {
  endIndex = content.indexOf(oldEndSegmentLF, startIndex);
  endLength = oldEndSegmentLF.length;
}

if (endIndex === -1) {
  console.error("Could not find end of sendWelcomeEmail method!");
  process.exit(1);
}

const before = content.substring(0, startIndex);
const after = content.substring(endIndex + endLength);

const replacement = `  async sendWelcomeEmail(to: string, name: string, role: string = 'buyer'): Promise<boolean> {
    const isSeller = role === 'seller' || role === 'admin';
    const subject = \`Welcome to QUADS — Ready to \${isSeller ? 'Sell' : 'Shop'}? 🎉\`;
    
    const roleContent = isSeller 
      ? \`
        <div class="role-badge">💼 CAMPUS MERCHANT ACTIVATED</div>
        <h2>Start Your Student Business Empire, \${name}!</h2>
        <p>Your seller store is officially active. You are now fully unlocked to list products, accept secure campus payments, and reach thousands of potential UMaT student buyers immediately.</p>
        
        <div style="background: #fffacd; padding: 20px; border: 2px solid #000; margin: 24px 0;">
          <p style="margin: 0; font-weight: 900; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px;">🚀 GETTING STARTED:</p>
          <ul style="margin: 12px 0 0 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
            <li><strong>Configure Payouts:</strong> Enter your Mobile Money details in your profile to receive funds directly.</li>
            <li><strong>List with Care:</strong> Take clear photos in good lighting and set competitive student-friendly prices.</li>
            <li><strong>Boost Conversions:</strong> Generate custom seller coupons or bundles to attract buyers to your listings.</li>
          </ul>
        </div>
      \`
      : \`
        <div class="role-badge">🎉 CAMPUS ACCESS GRANTED</div>
        <h2>Welcome to UMaT's Official Marketplace, \${name}!</h2>
        <p>Your student credentials have been verified. You're now unlocked to browse, buy, and trade directly with fellow peers on campus. No shipping fees, no off-campus meetups, just pure convenience.</p>
        
        <div style="background: #fffacd; padding: 20px; border: 2px solid #000; margin: 24px 0;">
          <p style="margin: 0; font-weight: 900; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px;">🔍 SHOPPING TIPS:</p>
          <ul style="margin: 12px 0 0 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
            <li><strong>Find Deals:</strong> Filter by categories to find textbook deals, tech gear, or dorm essentials.</li>
            <li><strong>Escrow Protection:</strong> Pay securely via Mobile Money (MTN, Telecel, AirtelTigo). Funds are held safely in escrow until you verify the item!</li>
            <li><strong>Handoff Safe:</strong> Meet the seller in broad daylight at popular campus spots like the library or campus cafeterias.</li>
          </ul>
        </div>
      \`;

    const body = \`
      \${roleContent}
      
      <div style="text-align: center;">
        <a href="\${process.env.CLIENT_URL || 'https://quadsmarket.tech'}/dashboard" class="btn btn-primary" style="display: inline-block; background: #ff6b6b; color: #ffffff !important; text-decoration: none; padding: 16px 32px; font-weight: 900; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; margin: 24px 0; border: 2px solid #000; box-shadow: 4px 4px 0 0 #000000;">Enter Dashboard</a>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 13px; color: #666;">
        <strong>Safety First:</strong> Never share sensitive personal info. Keep all coordination inside the campus platform for your peace of mind and protection.
      </p>
    \`;
    
    return this.sendEmail({ to, subject, html: this.wrapEmail(body) });
  }`;

fs.writeFileSync(targetFile, before + replacement + after, 'utf8');
console.log("Welcome email template updated successfully!");
