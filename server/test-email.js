import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { emailService } from './src/services/email.service.js';

// Load env from root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function testEmail() {
  console.log('🚀 Initiating Email Security Check...');
  console.log('FROM:', process.env.SMTP_FROM);
  console.log('HOST:', process.env.SMTP_HOST);

  const testRecipient = 'richardkwakuopoku06@gmail.com'; // Your email from the MONGODB_URI
  
  try {
    const success = await emailService.sendWelcomeEmail(testRecipient, 'Quads Admin');
    if (success) {
      console.log('✅ SUCCESS: Test email dispatched to', testRecipient);
      console.log('Check your inbox (and spam folder) for a message from QUADS.');
    } else {
      console.error('❌ FAILED: Email service returned false. Check SMTP credentials.');
    }
  } catch (error) {
    console.error('❌ ERROR: Exception during email dispatch:', error);
  }
}

testEmail();
