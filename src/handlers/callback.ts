import type { BotContext } from '../types.js';
import type { Bot } from 'grammy';
import { buildAspectRatioKeyboard, buildResolutionKeyboard, buildConfirmGenerationKeyboard, buildAdminKeyboard } from '../keyboards/index.js';
import { GENERATION_COST, STYLES } from '../utils/constants.js';
import { getTotalCredits, getUserById, updateUserLanguage, deductCredits } from '../services/user.js';
import { createGeneration } from '../services/history.js';
import { addGenerationJob } from '../queues/generation.queue.js';
import { showHistoryPage } from '../commands/history.js';
import { settingsCommand } from '../commands/settings.js';
import { balanceCommand } from '../commands/balance.js';
import { buyCommand } from '../commands/buy.js';
import { referralCommand } from '../commands/referral.js';
import { helpCommand } from '../commands/help.js';
import { generateCommand } from '../commands/generate.js';
import {
  handleAdminStats,
  handleAdminUsers,
  handleAdminToggleBan,
  handleAdminAddCredits,
  handleAdminPromo,
  handleAdminBroadcast,
  adminCommand,
  executeBroadcast,
} from '../commands/admin.js';
import { sendInvoice, handleMockBuyConfirm } from './payment.js';
import { logger } from '../utils/logger.js';
import { truncate } from '../utils/helpers.js';

export function createCallbackHandler(bot: Bot<BotContext>) {
  return async (ctx: BotContext) => {
    const data = ctx.callbackQuery?.data;
    if (!data || !ctx.dbUser) {
      await ctx.answerCallbackQuery();
      return;
    }

    try {
      await routeCallback(ctx, bot, data);
    } catch (error) {
      logger.error('Callback handler error', { error, data });
      await ctx.answerCallbackQuery(ctx.t('error.general'));
    }
  };
}

async function routeCallback(ctx: BotContext, bot: Bot<BotContext>, data: string) {
  // Main menu
  if (data === 'main:generate') {
    await ctx.answerCallbackQuery();
    await generateCommand(ctx);
    return;
  }
  if (data === 'main:balance') {
    await ctx.answerCallbackQuery();
    await balanceCommand(ctx);
    return;
  }
  if (data === 'main:buy') {
    await ctx.answerCallbackQuery();
    await buyCommand(ctx);
    return;
  }
  if (data === 'main:history') {
    await ctx.answerCallbackQuery();
    ctx.session.historyPage = 1;
    await showHistoryPage(ctx, ctx.dbUser!.id, 1);
    return;
  }
  if (data === 'main:referral') {
    await ctx.answerCallbackQuery();
    await referralCommand(ctx);
    return;
  }
  if (data === 'main:settings') {
    await ctx.answerCallbackQuery();
    await settingsCommand(ctx);
    return;
  }
  if (data === 'main:help') {
    await ctx.answerCallbackQuery();
    await helpCommand(ctx);
    return;
  }

  // Style selection
  if (data.startsWith('style:')) {
    const styleId = data.slice(6);
    ctx.session.style = styleId;
    ctx.session.step = 'ratio';
    await ctx.editMessageText(ctx.t('generate.select_ratio'), {
      reply_markup: buildAspectRatioKeyboard(ctx.dbUser!.language),
    });
    await ctx.answerCallbackQuery();
    return;
  }

  // Aspect ratio selection
  if (data.startsWith('ratio:')) {
    const ratio = data.slice(6);
    ctx.session.aspectRatio = ratio;
    ctx.session.step = 'resolution';
    await ctx.editMessageText(ctx.t('generate.select_resolution'), {
      reply_markup: buildResolutionKeyboard(ctx.dbUser!.language),
    });
    await ctx.answerCallbackQuery();
    return;
  }

  // Resolution selection
  if (data.startsWith('resolution:')) {
    const resolution = data.slice(11);
    ctx.session.resolution = resolution;
    ctx.session.step = 'confirm';

    const styleName = STYLES.find((s) => s.id === ctx.session.style)?.label ?? ctx.session.style ?? '—';
    const cost = GENERATION_COST[resolution] ?? 1;
    const prompt = ctx.session.prompt ?? '';

    await ctx.editMessageText(
      ctx.t('generate.confirm', {
        prompt: truncate(prompt, 100),
        style: styleName,
        ratio: ctx.session.aspectRatio ?? '1:1',
        resolution,
        credits: cost,
      }),
      { reply_markup: buildConfirmGenerationKeyboard(ctx) },
    );
    await ctx.answerCallbackQuery();
    return;
  }

  // Generation confirm
  if (data === 'generate:confirm') {
    await handleGenerationConfirm(ctx);
    return;
  }

  // Generation cancel
  if (data === 'generate:cancel') {
    ctx.session.step = undefined;
    ctx.session.prompt = undefined;
    ctx.session.style = undefined;
    ctx.session.aspectRatio = undefined;
    ctx.session.resolution = undefined;
    await ctx.editMessageText(ctx.t('generate.cancelled'));
    await ctx.answerCallbackQuery();
    return;
  }

  // History navigation
  if (data.startsWith('history:page:')) {
    const page = parseInt(data.slice(13), 10);
    await showHistoryPage(ctx, ctx.dbUser!.id, page);
    return;
  }

  // History regenerate
  if (data.startsWith('history:regen:')) {
    const genId = parseInt(data.slice(14), 10);
    await handleRegenerate(ctx, genId);
    return;
  }

  // Buy packs
  if (data.startsWith('buy:')) {
    const packId = data.slice(4);
    await ctx.answerCallbackQuery();
    await sendInvoice(ctx, packId);
    return;
  }

  // Mock payment confirm
  if (data.startsWith('mock_buy_confirm:')) {
    const packId = data.slice(17);
    await handleMockBuyConfirm(ctx, packId);
    return;
  }

  // Mock payment cancel
  if (data === 'mock_buy_cancel') {
    await ctx.editMessageText(ctx.t('payment.mock_cancelled'));
    await ctx.answerCallbackQuery();
    return;
  }

  // Settings language change
  if (data.startsWith('settings:lang:')) {
    const lang = data.slice(14);
    await updateUserLanguage(ctx.dbUser!.id, lang);
    const langName = lang === 'ru' ? '🇷🇺 Русский' : '🇬🇧 English';
    await ctx.editMessageText(ctx.t('settings.language_changed', { lang: langName }));
    await ctx.answerCallbackQuery();
    return;
  }

  // Admin panel
  if (data === 'admin:menu') {
    await ctx.editMessageText(ctx.t('admin.title'), { reply_markup: buildAdminKeyboard(ctx) });
    await ctx.answerCallbackQuery();
    return;
  }
  if (data === 'admin:stats') {
    await handleAdminStats(ctx);
    return;
  }
  if (data === 'admin:users') {
    await handleAdminUsers(ctx);
    return;
  }
  if (data === 'admin:promo') {
    await handleAdminPromo(ctx);
    return;
  }
  if (data === 'admin:broadcast') {
    await handleAdminBroadcast(ctx);
    return;
  }
  if (data.startsWith('admin:toggle_ban:')) {
    const userId = parseInt(data.slice(17), 10);
    await handleAdminToggleBan(ctx, userId);
    return;
  }
  if (data.startsWith('admin:add_credits:')) {
    const userId = parseInt(data.slice(18), 10);
    await handleAdminAddCredits(ctx, userId);
    return;
  }
  if (data === 'admin:broadcast_send') {
    const text = ctx.session.broadcastText;
    if (!text) {
      await ctx.answerCallbackQuery(ctx.t('error.general'));
      return;
    }
    ctx.session.broadcastText = undefined;
    await executeBroadcast(ctx, bot, text);
    return;
  }

  await ctx.answerCallbackQuery();
}

async function handleGenerationConfirm(ctx: BotContext) {
  const user = ctx.dbUser!;
  const { prompt, style, aspectRatio, resolution } = ctx.session;

  if (!prompt || !style || !aspectRatio || !resolution || !ctx.chat) {
    await ctx.answerCallbackQuery(ctx.t('error.general'));
    return;
  }

  const cost = GENERATION_COST[resolution] ?? 1;
  const totalCredits = await getTotalCredits(user.id);

  if (totalCredits < cost) {
    await ctx.editMessageText(
      ctx.t('generate.insufficient_credits', {
        required: cost,
        available: totalCredits,
      }),
    );
    await ctx.answerCallbackQuery();
    return;
  }

  // Deduct credits immediately to prevent double-spending
  const deducted = await deductCredits(user.id, cost);
  if (!deducted) {
    await ctx.editMessageText(ctx.t('generate.insufficient_credits', { required: cost, available: totalCredits }));
    await ctx.answerCallbackQuery();
    return;
  }

  // Clear session
  ctx.session.step = undefined;
  ctx.session.prompt = undefined;
  ctx.session.style = undefined;
  ctx.session.aspectRatio = undefined;
  ctx.session.resolution = undefined;

  await ctx.editMessageText(ctx.t('generate.processing'));
  await ctx.answerCallbackQuery();

  // Create generation record
  const generation = await createGeneration({
    userId: user.id,
    prompt,
    style,
    aspectRatio,
    resolution,
    creditsUsed: cost,
  });

  // Dispatch to BullMQ queue — returns immediately, worker processes in background
  await addGenerationJob({
    prompt,
    style,
    aspectRatio,
    resolution,
    userId: user.id,
    generationId: generation.id,
    chatId: ctx.chat.id,
    language: user.language,
    creditsUsed: cost,
  });

  logger.info('Generation job queued', { generationId: generation.id, userId: user.id });
}

async function handleRegenerate(ctx: BotContext, generationId: number) {
  const { getGenerationById } = await import('../services/history.js');
  const gen = await getGenerationById(generationId);

  if (!gen || gen.userId !== ctx.dbUser!.id) {
    await ctx.answerCallbackQuery(ctx.t('error.general'));
    return;
  }

  ctx.session.prompt = gen.prompt;
  ctx.session.style = gen.style ?? undefined;
  ctx.session.aspectRatio = gen.aspectRatio;
  ctx.session.resolution = gen.resolution;

  // Go straight to confirm
  const cost = GENERATION_COST[gen.resolution] ?? 1;
  const styleName = STYLES.find((s) => s.id === gen.style)?.label ?? gen.style ?? '—';

  ctx.session.step = 'confirm';

  await ctx.reply(
    ctx.t('generate.confirm', {
      prompt: truncate(gen.prompt, 100),
      style: styleName,
      ratio: gen.aspectRatio,
      resolution: gen.resolution,
      credits: cost,
    }),
    { reply_markup: buildConfirmGenerationKeyboard(ctx) },
  );
  await ctx.answerCallbackQuery();
}
