import type { Context, SessionFlavor } from 'grammy';
import type { User as PrismaUser } from '@prisma/client';

export interface SessionData {
  step?: string;
  prompt?: string;
  style?: string;
  aspectRatio?: string;
  resolution?: string;
  historyPage?: number;
  adminAction?: string;
  adminTargetUserId?: number;
  broadcastText?: string;
}

export type BotContext = Context &
  SessionFlavor<SessionData> & {
    dbUser?: PrismaUser;
    t: (key: string, params?: Record<string, string | number>) => string;
  };

export interface GenerationOptions {
  prompt: string;
  style: string;
  aspectRatio: string;
  resolution: string;
  userId: number;
  generationId: number;
  chatId: number;
  language: string;
  creditsUsed: number;
}

export interface NanoBananaResponse {
  code: number;
  message: string;
  data: {
    url: string;
  } | null;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  description: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    price: 9900,
    currency: 'RUB',
    description: '10 генераций',
  },
  {
    id: 'basic',
    name: 'Basic',
    credits: 30,
    price: 24900,
    currency: 'RUB',
    description: '30 генераций',
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 100,
    price: 69900,
    currency: 'RUB',
    description: '100 генераций',
  },
  {
    id: 'ultra',
    name: 'Ultra',
    credits: 300,
    price: 179900,
    currency: 'RUB',
    description: '300 генераций',
  },
];
