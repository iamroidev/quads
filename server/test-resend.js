const dotenv = require('dotenv');
const path = require('path');
const { Resend } = require('resend');

// Load env from quads folder (one level up)
dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
  console.log('--- STARTING EMAIL CONNECTIVITY TEST (JS) ---');
  console.log('Using FROM:', process.env.SMTP_FROM);
  
  const apiKey = process.env.SMTP_PASS;
  if (!apiKey) {
    console.error('❌ FAILED: SMTP_PASS (API KEY) is missing in .env');
    return;
  }
  
  const resend = new Resend(apiKey);
  const target = 'richieamaro6@gmail.com';
  
  console.log(`Sending test email to: ${target}...`);
  
  try {
    const { data, error } = await resend.emails.send({
      from: `QUADS <${process.env.SMTP_FROM || 'support@quadsmarket.tech'}>`,
      to: target,
      subject: '🚨 QUADS System Connectivity Test',
      html: '<h1>Connection Success!</h1><p>If you are reading this, the QUADS server is successfully talking to the Resend API via SDK.</p>'
    });

    if (error) {
      console.error('❌ TEST FAILED (Resend Error):', error);
    } else {
      console.log('✅ TEST PASSED: Email sent successfully. ID:', data.id);
    }
  } catch (err) {
    console.error('❌ FATAL ERROR:', err);
  }
}

test();
