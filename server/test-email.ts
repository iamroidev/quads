import dotenv from 'dotenv';
import path from 'path';
import { emailService } from './src/services/email.service';

dotenv.config({ path: path.join(__dirname, '.env') });

async function testEmail() {
  console.log('🚀 Initiating Email Security Check...');
  console.log('FROM:', process.env.SMTP_FROM);
  console.log('HOST:', process.env.SMTP_HOST);

  const testRecipient = 'richardkwakuopoku06@gmail.com'; 
  
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
