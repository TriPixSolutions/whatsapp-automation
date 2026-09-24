import { SettingsDB, MessagesDB, Contact } from '@/lib/db';
import { sendCheckoutResponse, generateWhatsAppOrderId } from '@/lib/meta/checkout';
import { WhatsAppMessageService } from '@/lib/whatsapp/messageService';

/**
 * Intercepts and processes in-chat WhatsApp Checkout and Buy Now interactive triggers
 */
export async function handleWhatsAppCheckoutAction(
  fromPhone: string,
  triggerText: string,
  contact: Contact
): Promise<boolean> {
  const settings = SettingsDB.get();
  const { phoneNumberId, accessToken } = settings;

  // 1. Checkout / Buy Now trigger
  if (triggerText.startsWith('checkout_') || triggerText.startsWith('buy_')) {
    const rawItem = triggerText.replace(/^(checkout_|buy_)/, '').replace(/_/g, ' ');
    const itemName = rawItem ? rawItem.charAt(0).toUpperCase() + rawItem.slice(1) : 'Featured Item';
    const orderId = generateWhatsAppOrderId();

    const result = await sendCheckoutResponse({
      phoneNumberId,
      accessToken,
      to: fromPhone,
      productName: itemName,
      price: '$89.00',
      orderId,
    });

    MessagesDB.create({
      metaMessageId: result.messageId || `wamid.chk_${Date.now()}`,
      phoneNumber: fromPhone,
      contactId: contact.id,
      direction: 'outbound',
      type: 'interactive',
      status: result.success ? 'sent' : 'failed',
      content: `Checkout Link Generated for ${itemName} (Order #${orderId})`,
      payload: { orderId, itemName, price: '$89.00' },
      errorMessage: result.error,
    });

    return true;
  }

  // 2. Payment Confirmation confirmation trigger
  if (triggerText.startsWith('pay_confirm_')) {
    const orderId = triggerText.replace('pay_confirm_', '');
    const confirmMsg = `🎉 *Payment Received!*\n\nThank you, ${contact.firstName || 'Customer'}! We are preparing order *#${orderId}*. A tracking number will be sent here shortly.`;

    await WhatsAppMessageService.send({
      to: fromPhone,
      type: 'text',
      text: confirmMsg,
    });

    return true;
  }

  return false;
}
