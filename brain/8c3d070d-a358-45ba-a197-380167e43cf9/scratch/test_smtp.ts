
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function testSMTP() {
  console.log('🚀 Starting SMTP Test...');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('User:', process.env.SMTP_USER);
  console.log('From:', process.env.SMTP_FROM);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: 'quads_test_target@gmail.com', // Change this to your email if you want to see it
      subject: 'QUADS SMTP TEST',
      text: 'If you see this, the SMTP is working perfectly!',
      html: '<b>If you see this, the SMTP is working perfectly!</b>',
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP Test Failed:', error);
  }
}

testSMTP();
