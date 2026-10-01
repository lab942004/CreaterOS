import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'creatoros-super-secret-jwt-key-2026',
  environment: process.env.NODE_ENV || 'development',
  demoMode: process.env.DEMO_MODE !== 'false', // Enabled by default for full out-of-the-box experience
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
  }
};
