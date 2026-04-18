import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { writeFile } from 'fs/promises';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        inlineData?: {
          mimeType: string;
          data: string;
        };
        text?: string;
      }>;
    };
  }>;
}

export async function generateImage(options: {
  prompt: string;
  style: string;
  aspectRatio: string;
  resolution: string;
}): Promise<string> {
  const fullPrompt = options.style && options.style !== 'none'
    ? `${options.prompt} в стиле ${options.style}`
    : options.prompt;

  const requestBody = {
    contents: [{
      parts: [{
        text: `Сгенерируй изображение: ${fullPrompt}. Соотношение сторон: ${options.aspectRatio}.`
      }]
    }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    }
  };

  logger.info('Отправка запроса в Gemini', { prompt: fullPrompt });

  const response = await fetch(
    `${config.nanoBanana.apiUrl}/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${config.nanoBanana.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const data = await response.json() as GeminiResponse;
  const imagePart = data.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

  if (!imagePart?.inlineData?.data) {
    throw new Error('Изображение не сгенерировано');
  }

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
  const filename = `/tmp/gemini_${Date.now()}.png`;
  await writeFile(filename, buffer);
  
  return filename;
}
