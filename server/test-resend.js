const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

// Load env from quads folder (one level up)
dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
  console.log('--- STARTING EMAIL CONNECTIVITY TEST (AXIOS) ---');
  console.log('Using FROM:', process.env.SMTP_FROM);
  
  const apiKey = process.env.SMTP_PASS;
  if (!apiKey) {
    console.error('❌ FAILED: SMTP_PASS (API KEY) is missing in .env');
    return;
  }
  
  const target = 'richieamaro6@gmail.com';
  console.log(`Sending test email to: ${target}...`);
  
  try {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: `QUADS <${process.env.SMTP_FROM || 'support@quadsmarket.tech'}>`,
        to: target,
        subject: '🚨 QUADS System Connectivity Test (Axios)',
        html: '<h1>Connection Success!</h1><p>If you are reading this, the QUADS server is successfully talking to the Resend API via Axios.</p>'
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200 || response.status === 201) {
      console.log('✅ TEST PASSED: Email sent successfully. ID:', response.data.id);
    } else {
      console.error('❌ TEST FAILED (API Error):', response.status, response.data);
    }
  } catch (err) {
    if (err.response) {
      console.error('❌ TEST FAILED (API Response Error):', err.response.status, err.response.data);
    } else {
      console.error('❌ FATAL ERROR:', err.message);
    }
  }
}

test();
