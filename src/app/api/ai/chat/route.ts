import { GoogleGenerativeAI } from '@google/generative-ai';
import { PASSION_FRUIT_SYSTEM_PROMPT, PRECONFIGURED_FAQ_ANSWERS } from '@/lib/gemini/systemPrompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getKnowledgeFallback(query: string): string {
  const lower = query.toLowerCase();

  if (lower.includes('meta') || lower.includes('connect') || lower.includes('waba') || lower.includes('webhook') || lower.includes('token')) {
    return PRECONFIGURED_FAQ_ANSWERS.meta_setup;
  }
  if (lower.includes('inbox') || lower.includes('chat') || lower.includes('team') || lower.includes('read') || lower.includes('assign')) {
    return PRECONFIGURED_FAQ_ANSWERS.team_inbox;
  }
  if (lower.includes('automation') || lower.includes('flow') || lower.includes('node') || lower.includes('bot') || lower.includes('button') || lower.includes('carousel')) {
    return PRECONFIGURED_FAQ_ANSWERS.automations;
  }
  if (lower.includes('broadcast') || lower.includes('campaign') || lower.includes('template')) {
    return PRECONFIGURED_FAQ_ANSWERS.broadcasts;
  }
  if (lower.includes('passion fruit') || lower.includes('what') || lower.includes('feature')) {
    return PRECONFIGURED_FAQ_ANSWERS.what_is_pf;
  }

  return `### Passion Fruit AI Assistant

I am here to guide you with everything in **Passion Fruit**:
- **Meta WhatsApp Cloud API setup**: Configure your Phone ID, WABA ID, and Permanent Token in **/settings**.
- **Shared Team Inbox (/inbox)**: Live 2.5s message syncing, read receipts, and agent assignment.
- **4-Node Flow Builder (/automations)**: Create Interactive Buttons, List Menus, and Product Carousels.
- **Broadcast Campaigns (/campaigns)**: Segment contacts by tags and dispatch Meta-approved templates.

*(Tip: To enable custom generative responses for any question, add your free \`GEMINI_API_KEY\` from Google AI Studio to \`.env.local\`)*`;
}

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
