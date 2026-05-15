import dotenv from 'dotenv';
import path from 'path';
// Load env from root
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { emailService } from './services/email.service';

async function test() {
  console.log('--- STARTING EMAIL CONNECTIVITY TEST ---');
  console.log('Using FROM:', process.env.SMTP_FROM);
  console.log('Using API KEY (first 5 chars):', process.env.SMTP_PASS?.substring(0, 5));
  
  const target = 'richieamaro6@gmail.com'; // Testing with your admin email
  console.log(`Sending test email to: ${target}...`);
  
  const success = await emailService.sendEmail({
    to: target,
    subject: '🚨 QUADS System Connectivity Test',
    html: '<h1>Connection Success!</h1><p>If you are reading this, the QUADS server is successfully talking to the Resend API.</p>'
  });

  if (success) {
    console.log('✅ TEST PASSED: Email sent successfully.');
  } else {
    console.log('❌ TEST FAILED: Check logs above for errors.');
  }
}

test().catch(console.error);
