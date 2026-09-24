import { GoogleGenerativeAI } from '@google/generative-ai';
import { WhatsAppMessageService } from '@/lib/whatsapp/messageService';

const AI_SALES_PROMPT = `You are the AI Sales & Support Assistant for an e-commerce brand on WhatsApp.
Reply to the customer warmly, concisely (under 2 sentences), and answer their inquiry directly.
If they are asking about products, offer to show the catalog.
If they need help, invite them to reply with 'agent' or their order number.
Keep tone professional and helpful. No markdown bolding over-use.`;

export async function handleAiInboundReply(
  fromPhone: string,
  contactId: string,
  customerText: string
): Promise<void> {
  let replyText = '';
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: AI_SALES_PROMPT,
      });
      const result = await model.generateContent(customerText);
      replyText = result.response.text().trim();
    } catch (err) {
      console.warn('AI Sales response fallback due to:', err);
    }
  }

  if (!replyText) {
    const lower = customerText.toLowerCase();
    if (lower.includes('price') || lower.includes('cost') || lower.includes('pricing')) {
      replyText = "Thanks for asking! Our plans start from $49/mo. Reply 'CATALOG' to view all products or 'AGENT' to speak with our sales team.";
    } else if (lower.includes('order') || lower.includes('track') || lower.includes('status')) {
      replyText = "We can help look up your order! Please share your order ID or email address, or reply 'AGENT' for a live representative.";
    } else {
      replyText = "Hello! Thanks for reaching out to us on WhatsApp. How can we help you today? Reply 'CATALOG' to view products or 'HELP' for assistance.";
    }
  }

  await WhatsAppMessageService.send({
    to: fromPhone,
    type: 'text',
    text: replyText,
  });
}
