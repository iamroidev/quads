import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root - handles both src/ and dist/ structures
dotenv.config(); // Loads from the current working directory (project root)
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '..', '.env') });

// Load development overrides if in development mode
// (Forces backend to connect to local MongoDB database in dev environment)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(process.cwd(), '.env.development'), override: true });
  dotenv.config({ path: path.join(process.cwd(), '..', '.env.development'), override: true });
}

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  JWT_REFRESH_EXPIRE: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  PAYSTACK_SECRET_KEY: string;
  PAYSTACK_PUBLIC_KEY: string;
  GOOGLE_CLIENT_ID: string;
  SUPABASE_URL: string;
  CLIENT_URL: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_SNS_SENDER_ID: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  PLATFORM_COMMISSION: number;
  PLATFORM_NAME: string;
  INSTITUTIONAL_DOMAINS: string;
  CORS_EXTRA_ORIGINS: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
}

const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quads',
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-me',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || '',
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5200',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_SNS_SENDER_ID: process.env.AWS_SNS_SENDER_ID || 'QUADS',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.ethereal.email',
  SMTP_PORT: process.env.SMTP_PORT || '587',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: `"QUADS" <${process.env.SMTP_FROM || 'noreply@quadsmarket.tech'}>`,
  PLATFORM_COMMISSION: parseInt(process.env.PLATFORM_COMMISSION || '10', 10),
  PLATFORM_NAME: process.env.PLATFORM_NAME || 'QUADS',
  INSTITUTIONAL_DOMAINS: process.env.INSTITUTIONAL_DOMAINS || 'umat.edu.gh,st.umat.edu.gh,student.umat.edu.gh',
  CORS_EXTRA_ORIGINS: process.env.CORS_EXTRA_ORIGINS || '',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

export default env;