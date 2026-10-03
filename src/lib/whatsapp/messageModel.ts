import type { MessageType } from '@/types';
import type { WorkflowNode } from '@/types/automations';

export type OutboundMessageKind = MessageType | 'flow' | 'location' | 'contact_card';

export interface CanonicalOutboundMessage {
  kind: OutboundMessageKind;
  text?: string;
  headerText?: string;
  bodyText?: string;
  footerText?: string;
  templateName?: string;
  languageCode?: string;
  components?: any[];
  buttons?: { id: string; title: string }[];
  buttonText?: string;
  sections?: { title: string; rows: { id: string; title: string; description?: string }[] }[];
  cards?: {
    headerImage?: string;
    title: string;
    description: string;
    buttons: { id: string; title: string; url?: string }[];
  }[];
  mediaUrl?: string;
  mediaId?: string;
  caption?: string;
  filename?: string;
  catalogId?: string;
  productRetailerId?: string;
  productSections?: any[];
  flowId?: string;
  flowToken?: string;
  flowCta?: string;
  flowScreen?: string;
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  contact?: { formattedName: string; phoneNumber: string; organization?: string };
}

export interface WhatsAppPreviewModel {
  kind: OutboundMessageKind;
  title: string;
  body: string;
  footer?: string;
  mediaUrl?: string;
  buttons: { id: string; title: string }[];
  sections: { title: string; rows: { id: string; title: string; description?: string }[] }[];
  cards: CanonicalOutboundMessage['cards'];
  limitation?: string;
}

const clean = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const asArray = <T>(value: unknown): T[] => Array.isArray(value) ? value : [];

export function canonicalizeOutboundMessage(input: Partial<CanonicalOutboundMessage> & { kind: OutboundMessageKind }): CanonicalOutboundMessage {
  return {
    ...input,
    kind: input.kind,
    text: clean(input.text) || undefined,
    headerText: clean(input.headerText) || undefined,
    bodyText: clean(input.bodyText) || clean(input.text) || undefined,
    footerText: clean(input.footerText) || undefined,
    templateName: clean(input.templateName) || undefined,
    languageCode: clean(input.languageCode) || 'en_US',
    buttons: asArray<any>(input.buttons).map((button) => ({
      id: clean(button?.id),
      title: clean(button?.title),
    })),
    sections: asArray<any>(input.sections).map((section) => ({
      title: clean(section?.title),
      rows: asArray<any>(section?.rows).map((row) => ({
        id: clean(row?.id),
        title: clean(row?.title),
        description: clean(row?.description) || undefined,
      })),
    })),
    cards: asArray<any>(input.cards).map((card) => ({
      headerImage: clean(card?.headerImage) || undefined,
      title: clean(card?.title),
      description: clean(card?.description),
      buttons: asArray<any>(card?.buttons).map((button) => ({
        id: clean(button?.id),
        title: clean(button?.title),
        url: clean(button?.url) || undefined,
      })),
    })),
    mediaUrl: clean(input.mediaUrl) || undefined,
    mediaId: clean(input.mediaId) || undefined,
    caption: clean(input.caption) || undefined,
    filename: clean(input.filename) || undefined,
    catalogId: clean(input.catalogId) || undefined,
    productRetailerId: clean(input.productRetailerId) || undefined,
    flowId: clean(input.flowId) || undefined,
    flowToken: clean(input.flowToken) || undefined,
    flowCta: clean(input.flowCta) || undefined,
    flowScreen: clean(input.flowScreen) || undefined,
    contact: input.contact ? {
      formattedName: clean(input.contact.formattedName),
      phoneNumber: clean(input.contact.phoneNumber),
      organization: clean(input.contact.organization) || undefined,
    } : undefined,
  };
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

export function validateOutboundMessage(message: CanonicalOutboundMessage): string[] {
  const errors: string[] = [];
  const body = message.bodyText || message.text || '';

  if (['text', 'button', 'list', 'flow'].includes(message.kind) && !body) {
    errors.push('Message text is required.');
  }
  if (body.length > 4096) errors.push('Message text must be 4,096 characters or fewer.');

  if (message.kind === 'button' || (message.kind === 'interactive' && message.buttons?.length)) {
    const buttons = message.buttons || [];
    if (buttons.length < 1 || buttons.length > 3) errors.push('WhatsApp reply messages require 1 to 3 buttons.');
    if (buttons.some((button) => !button.id || !button.title)) errors.push('Every button needs a stable ID and visible title.');
    if (buttons.some((button) => button.id.length > 256)) errors.push('Button IDs must be 256 characters or fewer.');
    if (buttons.some((button) => button.title.length > 20)) errors.push('Button titles must be 20 characters or fewer.');
    const duplicates = duplicateValues(buttons.map((button) => button.id).filter(Boolean));
    if (duplicates.length) errors.push(`Button IDs must be unique. Duplicate: ${duplicates.join(', ')}`);
  }

  if (message.kind === 'list') {
    const sections = message.sections || [];
    const rows = sections.flatMap((section) => section.rows);
    if (!message.buttonText) errors.push('List button text is required.');
    if ((message.buttonText || '').length > 20) errors.push('List button text must be 20 characters or fewer.');
    if (!sections.length || !rows.length) errors.push('A list requires at least one section and one row.');
    if (rows.length > 10) errors.push('A WhatsApp list supports at most 10 rows.');
    if (sections.some((section) => section.title.length > 24)) errors.push('List section titles must be 24 characters or fewer.');
    if (rows.some((row) => !row.id || !row.title)) errors.push('Every list row needs a stable ID and visible title.');
    if (rows.some((row) => row.title.length > 24)) errors.push('List row titles must be 24 characters or fewer.');
    if (rows.some((row) => (row.description || '').length > 72)) errors.push('List row descriptions must be 72 characters or fewer.');
    const duplicates = duplicateValues(rows.map((row) => row.id).filter(Boolean));
    if (duplicates.length) errors.push(`List row IDs must be unique. Duplicate: ${duplicates.join(', ')}`);
  }

  if (['image', 'video', 'audio', 'document'].includes(message.kind)) {
    if (!message.mediaId && !message.mediaUrl) errors.push('Upload a file or provide a media URL.');
    if (message.mediaUrl && !/^https:\/\//i.test(message.mediaUrl)) errors.push('Media URLs must use HTTPS.');
  }

  if (message.kind === 'template') {
    if (!message.templateName) errors.push('Select an approved Meta template.');
    if (message.templateName && !/^[a-z0-9_]+$/.test(message.templateName)) errors.push('Template names may contain lowercase letters, numbers and underscores only.');
  }

  if (message.kind === 'carousel') {
    const cards = message.cards || [];
    if (!message.templateName) errors.push('Select an approved carousel template before sending.');
    if (cards.length < 2 || cards.length > 10) errors.push('A WhatsApp carousel requires 2 to 10 cards.');
    if (cards.some((card) => !card.title || !card.description)) errors.push('Every carousel card needs a title and description.');
    const buttonIds = cards.flatMap((card) => card.buttons.map((button) => button.id)).filter(Boolean);
    const duplicates = duplicateValues(buttonIds);
    if (duplicates.length) errors.push(`Carousel interaction IDs must be unique. Duplicate: ${duplicates.join(', ')}`);
  }

  if (message.kind === 'catalog' && !message.catalogId) errors.push('Connect a Meta catalog before sending products.');
  if (message.kind === 'flow' && !message.flowId) errors.push('A published WhatsApp Flow ID is required.');
  if (message.kind === 'location') {
    if (!message.location || !Number.isFinite(message.location.latitude) || !Number.isFinite(message.location.longitude)) {
      errors.push('A valid latitude and longitude are required.');
    }
  }
  if (message.kind === 'contact_card') {
    if (!message.contact?.formattedName || !message.contact?.phoneNumber) errors.push('Contact name and phone number are required.');
  }

  return errors;
}

export function toWhatsAppPreview(message: CanonicalOutboundMessage): WhatsAppPreviewModel {
  const limitation = message.kind === 'carousel'
    ? 'The live card layout must exactly match the selected approved Meta carousel template.'
    : message.kind === 'template'
      ? 'The final content and buttons come from the approved Meta template.'
      : undefined;
  return {
    kind: message.kind,
    title: message.headerText || (message.kind === 'template' ? message.templateName || 'Template' : ''),
    body: message.bodyText || message.text || message.caption || `[${message.kind}]`,
    footer: message.footerText,
    mediaUrl: message.mediaUrl,
    buttons: message.buttons || [],
    sections: message.sections || [],
    cards: message.cards || [],
    limitation,
  };
}

export function messageFromWorkflowNode(node: WorkflowNode): CanonicalOutboundMessage | null {
  const config = node.config || {};
  const aliases: Record<string, OutboundMessageKind> = {
    message: (node.messageType === 'image' || node.messageType === 'video' || node.messageType === 'audio' || node.messageType === 'document' || node.messageType === 'template') ? node.messageType : 'text',
    whatsapp_message: (node.messageType === 'image' || node.messageType === 'video' || node.messageType === 'audio' || node.messageType === 'document' || node.messageType === 'template') ? node.messageType : 'text',
    message_media: (node.messageType === 'video' || node.messageType === 'audio' || node.messageType === 'document') ? node.messageType : 'image',
    message_template: 'template',
    button: 'button',
    whatsapp_button: 'button',
    list: 'list',
    whatsapp_list: 'list',
    carousel: 'carousel',
    whatsapp_carousel: 'carousel',
    whatsapp_catalog: 'catalog',
    whatsapp_flow: 'flow',
    flow: 'flow',
  };
  const kind = aliases[node.type];
  if (!kind) return null;
  return canonicalizeOutboundMessage({
    kind,
    text: config.text,
    headerText: config.headerText,
    bodyText: config.bodyText || config.text,
    footerText: config.footerText,
    templateName: config.templateName,
    languageCode: config.languageCode,
    buttons: config.buttons,
    buttonText: config.buttonText,
    sections: config.sections,
    cards: config.cards,
    mediaUrl: config.mediaUrl,
    mediaId: config.mediaId,
    caption: config.caption,
    filename: config.fileName,
    catalogId: config.catalogId,
    productRetailerId: config.retailerId,
    productSections: config.productSections,
    flowId: config.flowId,
    flowToken: config.flowToken,
    flowCta: config.flowCta,
    flowScreen: config.flowScreen,
  });
}

export function dbMessageType(kind: OutboundMessageKind): MessageType {
  return ['flow', 'location', 'contact_card'].includes(kind) ? 'interactive' : kind as MessageType;
}
