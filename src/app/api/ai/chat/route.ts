import { GoogleGenerativeAI } from '@google/generative-ai';
import { PASSION_FRUIT_SYSTEM_PROMPT, PRECONFIGURED_FAQ_ANSWERS } from '@/lib/gemini/systemPrompt';
import { getKnowledgeFallback } from '@/lib/gemini/knowledgeFallback';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages, chipId } = await req.json();

    // Fast-path: If user clicked a suggested onboarding chip
    if (chipId && PRECONFIGURED_FAQ_ANSWERS[chipId]) {
      const text = PRECONFIGURED_FAQ_ANSWERS[chipId];
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const words = text.split(' ');
          for (let i = 0; i < words.length; i += 4) {
            const chunk = words.slice(i, i + 4).join(' ') + ' ';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
            await new Promise((r) => setTimeout(r, 18));
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Graceful fallback if GEMINI_API_KEY is not configured yet
    if (!apiKey) {
      const lastMessage = messages?.[messages.length - 1]?.content || '';
      const fallbackText = getKnowledgeFallback(lastMessage);

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const words = fallbackText.split(' ');
          for (let i = 0; i < words.length; i += 4) {
            const chunk = words.slice(i, i + 4).join(' ') + ' ';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
            await new Promise((r) => setTimeout(r, 20));
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    // Official Google Gemini API Streaming
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: PASSION_FRUIT_SYSTEM_PROMPT,
    });

    const history = (messages || []).slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || '' }],
    }));

    const lastUserMessage = messages?.[messages.length - 1]?.content || 'Hello';

    const chat = model.startChat({
      history: history.length > 0 ? history : undefined,
    });

    const result = await chat.sendMessageStream(lastUserMessage);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } catch (err: any) {
          console.error('Gemini stream error:', err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: err.message || 'Stream error occurred' })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Gemini Chat API route error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
