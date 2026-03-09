import { config } from '../config.js';
import { logger } from '../utils/logger.js';

interface GenerateRequest {
  prompt: string;
  num: number;
  model: string;
  image_size: string;
}

interface ApiResponse {
  code: number;
  message: string;
  data: {
    url: string;
  } | null;
}

export async function generateImage(options: {
  prompt: string;
  style: string;
  aspectRatio: string;
  resolution: string;
}): Promise<string> {
  const fullPrompt =
    options.style && options.style !== 'none'
      ? `style: ${options.style}. ${options.prompt}`
      : options.prompt;

  const imageSize = options.aspectRatio || '1:1';

  const request: GenerateRequest = {
    prompt: fullPrompt,
    num: 1,
    model: config.nanoBanana.model,
    image_size: imageSize,
  };

  logger.info('Submitting generation request', {
    prompt: fullPrompt.substring(0, 100),
    imageSize,
  });

  const response = await fetch(`${config.nanoBanana.apiUrl}/v1/images/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.nanoBanana.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Nano Banana API HTTP error', { status: response.status, errorText });
    throw new Error(`Nano Banana API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as ApiResponse;

  if (data.code !== 0 || !data.data?.url) {
    logger.error('Nano Banana API returned error', { code: data.code, message: data.message });
    throw new Error(`Generation failed: ${data.message || 'Unknown error'}`);
  }

  logger.info('Generation completed', { imageUrl: data.data.url });
  return data.data.url;
}
