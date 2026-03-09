import { Worker } from 'bullmq';
import { Api } from 'grammy';
import { config } from '../config.js';
import { generateImage } from '../services/image-generator.js';
import { updateGenerationStatus } from '../services/history.js';
import { addCredits } from '../services/user.js';
import { logger } from '../utils/logger.js';
import { translations } from '../i18n/index.js';
import { truncate } from '../utils/helpers.js';
import type { GenerationOptions } from '../types.js';

const api = new Api(config.botToken);

function t(lang: string, key: string, params?: Record<string, string | number>): string {
  const dict = translations[(lang === 'en' ? 'en' : 'ru') as 'ru' | 'en'] ?? translations['ru'];
  let text: string = (dict as Record<string, string>)[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

export function createGenerationWorker() {
  const worker = new Worker<GenerationOptions>(
    'generation',
    async (job) => {
      const { prompt, style, aspectRatio, resolution, generationId, userId, chatId, language, creditsUsed } = job.data;

      logger.info('Processing generation job', { jobId: job.id, generationId, userId });

      await updateGenerationStatus(generationId, 'PROCESSING');

      try {
        const imageUrl = await generateImage({
          prompt,
          style,
          aspectRatio,
          resolution,
        });

        await updateGenerationStatus(generationId, 'COMPLETED', { imageUrl });

        // Send image to user via Telegram API
        await api.sendPhoto(chatId, imageUrl, {
          caption: t(language, 'generate.success', { prompt: truncate(prompt, 100), credits: creditsUsed }),
        });

        logger.info('Generation job completed', { jobId: job.id, generationId, imageUrl });
        return { imageUrl };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await updateGenerationStatus(generationId, 'FAILED', { errorMessage });

        // Refund credits on failure
        await addCredits(userId, creditsUsed);

        // Notify user about failure
        try {
          await api.sendMessage(chatId, t(language, 'generate.failed'));
        } catch (sendError) {
          logger.error('Failed to send error message to user', { chatId, sendError });
        }

        logger.error('Generation job failed', { jobId: job.id, generationId, error: errorMessage });
        throw error; // Re-throw so BullMQ marks job as failed
      }
    },
    {
      connection: {
        url: config.redisUrl,
      },
      concurrency: 5, // Process up to 5 generations in parallel
    },
  );

  worker.on('error', (err) => {
    logger.error('Worker error', { error: err.message });
  });

  return worker;
}
