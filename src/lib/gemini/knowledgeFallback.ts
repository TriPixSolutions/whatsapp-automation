import { PRECONFIGURED_FAQ_ANSWERS } from './systemPrompt';

export function getKnowledgeFallback(query: string): string {
  const lower = query.toLowerCase();

  if (
    lower.includes('meta') ||
    lower.includes('connect') ||
    lower.includes('waba') ||
    lower.includes('webhook') ||
    lower.includes('token')
  ) {
    return PRECONFIGURED_FAQ_ANSWERS.meta_setup;
  }
  if (
    lower.includes('inbox') ||
    lower.includes('chat') ||
    lower.includes('team') ||
    lower.includes('read') ||
    lower.includes('assign')
  ) {
    return PRECONFIGURED_FAQ_ANSWERS.team_inbox;
  }
  if (
    lower.includes('automation') ||
    lower.includes('flow') ||
    lower.includes('node') ||
    lower.includes('bot') ||
    lower.includes('button') ||
    lower.includes('carousel')
  ) {
    return PRECONFIGURED_FAQ_ANSWERS.automations;
  }
  if (
    lower.includes('broadcast') ||
    lower.includes('campaign') ||
    lower.includes('template')
  ) {
    return PRECONFIGURED_FAQ_ANSWERS.broadcasts;
  }
  if (
    lower.includes('passion fruit') ||
    lower.includes('what') ||
    lower.includes('feature')
  ) {
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
