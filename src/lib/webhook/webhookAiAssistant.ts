import { GoogleGenerativeAI } from '@google/generative-ai';
import { WhatsAppMessageService } from '@/lib/whatsapp/messageService';

const AI_SALES_PROMPT = `You are the AI Assistant for our business on WhatsApp.
Reply to prospective and current customers warmly, concisely (under 2 sentences), and address their inquiry directly.
Help qualify their interest, answer questions about our services, and offer to schedule a consultation or connect with a specialist.
If they need live human assistance, invite them to reply with 'AGENT'.
Keep tone professional, prompt, and helpful. Avoid markdown bolding over-use.`;

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
    if (lower.includes('price') || lower.includes('cost') || lower.includes('pricing') || lower.includes('quote')) {
      replyText = "Thanks for asking! Our service packages are tailored to your needs. Reply 'AGENT' to connect with a specialist or share your requirements.";
    } else if (lower.includes('demo') || lower.includes('call') || lower.includes('meeting') || lower.includes('consult')) {
      replyText = "We'd love to set up a consultation with you! Please share your preferred date/time or reply 'AGENT' to connect immediately.";
    } else {
      replyText = "Hello! Thank you for reaching out. How can we assist you today? Reply 'AGENT' if you would like to speak directly with our team.";
    }
  }

  await WhatsAppMessageService.send({
    to: fromPhone,
    type: 'text',
    text: replyText,
  });
}
