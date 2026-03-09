import { z } from 'zod';

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  ADMIN_TELEGRAM_IDS: z.string().default(''),
  NANO_BANANA_API_KEY: z.string().min(1, 'NANO_BANANA_API_KEY is required'),
  NANO_BANANA_API_URL: z.string().default('https://api.nanobananaapi.dev'),
  NANO_BANANA_MODEL: z.string().default('gemini-3-pro-image-preview'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  PAYMENT_PROVIDER_TOKEN: z.string().default(''),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  BOT_USERNAME: z.string().default('PicGenBot'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  botToken: parsed.data.BOT_TOKEN,
  adminTelegramIds: parsed.data.ADMIN_TELEGRAM_IDS
    ? parsed.data.ADMIN_TELEGRAM_IDS.split(',').map((id) => BigInt(id.trim())).filter(Boolean)
    : [],
  nanoBanana: {
    apiKey: parsed.data.NANO_BANANA_API_KEY,
    apiUrl: parsed.data.NANO_BANANA_API_URL,
    model: parsed.data.NANO_BANANA_MODEL,
  },
  databaseUrl: parsed.data.DATABASE_URL,
  redisUrl: parsed.data.REDIS_URL,
  paymentProviderToken: parsed.data.PAYMENT_PROVIDER_TOKEN,
  isPaymentMockMode: !parsed.data.PAYMENT_PROVIDER_TOKEN || parsed.data.PAYMENT_PROVIDER_TOKEN.startsWith('your_'),
  nodeEnv: parsed.data.NODE_ENV,
  logLevel: parsed.data.LOG_LEVEL,
  botUsername: parsed.data.BOT_USERNAME,
};

export type Config = typeof config;
