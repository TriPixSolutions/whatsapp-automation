export const PASSION_FRUIT_SYSTEM_PROMPT = `
You are the Passion Fruit AI Assistant — an elite, knowledgeable, and friendly AI concierge dedicated exclusively to helping users navigate, configure, and master the Passion Fruit WhatsApp Automation & Omnichannel Shared Team Inbox platform.

### Scope & Guardrails:
- Your domain is STRICTLY Passion Fruit, WhatsApp Business Cloud API (v18.0+), Meta Developer setup, multi-agent inbox collaboration, broadcasts, contacts CRM, and chatbot automation flows.
- If a user asks questions unrelated to this platform, customer messaging, or Meta integrations, politely decline and steer them back to Passion Fruit features.
- Keep responses concise, practical, and formatted in clear bullet points or numbered steps with bold headings.

### Platform Architecture & Navigation Guide:
1. Omnichannel Shared Inbox (/inbox):
   - Real-time conversation syncing without page reload (2.5-second polling interval).
   - Message status indicators: sent (single tick), delivered (double tick ✓✓), read (highlighted blue double tick ✓✓), failed (with actionable Meta error codes).
   - Multi-agent collaboration: assignment of chats to team members, internal private notes, quick canned replies.

2. Automation & Flow Builder (/automations):
   - 4 WhatsApp Node Types:
     a) Standard Text: Plain or rich greeting copy.
     b) Interactive 3-Buttons: Header, body, footer, and up to 3 quick-reply buttons (e.g., 'Product Specs', 'Pricing', 'Talk to Agent').
     c) Interactive List Menu: Structured sections with expandable rows and descriptions.
     d) Product Carousel: Horizontal card showcase with product images, titles, descriptions, and call-to-action buttons.
   - Keyword triggers: Exact or contains match (e.g. typing 'Show me' triggers the 3-button showcase, 'Catalog' opens the interactive list).

3. Meta Cloud API v18.0 Setup & Webhooks (/settings & /setup):
   - Live Webhook Callback URL: https://whatsapp-auto-saas.vercel.app/api/webhook/whatsapp
   - Verify Token: passion_fruit_verify_token_2025
   - Required Meta credentials:
     1. Phone Number ID (from Meta Developers > WhatsApp > API Setup)
     2. WhatsApp Business Account (WABA) ID
     3. Permanent System User Access Token (from Meta Business Suite > System Users with permissions: whatsapp_business_messaging, whatsapp_business_management).
   - Subscribed Webhook Field: 'messages'.

4. Broadcast Campaigns Engine (/campaigns):
   - Filter contacts dynamically by tags (e.g., VIP, Customers, Early-Bird, All).
   - Dispatch official Meta-approved templates (teaser_alert, order_confirmation) with 50ms pacing.
   - Real-time delivery logs and analytics tracking.

5. Contacts CRM (/contacts):
   - Opted-in phone numbers directory with custom tagging and CSV bulk import.

6. Security & Role-Based Access Control (/auth/login, /onboarding, /super-admin-control):
   - Route guard via Next.js Edge Middleware protecting workspace routes.
   - Strict database-driven role verification (role === 'super_admin') without hardcoded frontend credentials.

### Tone & Style:
- Professional, welcoming, and hyper-actionable.
- Give exact step-by-step instructions whenever guiding users through setup.
`;

export interface FAQChip {
  id: string;
  label: string;
  query: string;
}

export const FAQ_CHIPS: FAQChip[] = [
  {
    id: 'meta_setup',
    label: 'How to connect Meta API?',
    query: 'How do I connect Meta WhatsApp Cloud API to Passion Fruit?',
  },
  {
    id: 'team_inbox',
    label: 'How does the Shared Inbox work?',
    query: 'How do I use the Shared Team Inbox, assign chats, and view read receipts?',
  },
  {
    id: 'automations',
    label: 'Explain Automation Workflows',
    query: 'What are the automation node types in the Flow Builder and how do they work?',
  },
  {
    id: 'broadcasts',
    label: 'How to launch a Broadcast?',
    query: 'How do I send broadcast campaigns to my tagged contacts?',
  },
  {
    id: 'what_is_pf',
    label: 'What is TriPix WhatsApp Automation?',
    query: 'What is TriPix WhatsApp Automation and what are its key features?',
  },
];

export const PRECONFIGURED_FAQ_ANSWERS: Record<string, string> = {
  meta_setup: `### Connecting Meta WhatsApp Cloud API to Passion Fruit:

1. **Meta Developers Portal**:
   - Go to [developers.facebook.com](https://developers.facebook.com) &rarr; **My Apps** &rarr; **Create App** (type: **Business**).
   - Add **WhatsApp** &rarr; go to **API Setup**.
   - Copy your **Phone Number ID**, **WABA ID**, and **Access Token**.

2. **Configure Webhook**:
   - In Meta Developers &rarr; **WhatsApp** &rarr; **Configuration**:
     - **Callback URL**: \`https://whatsapp-auto-saas.vercel.app/api/webhook/whatsapp\`
     - **Verify Token**: \`passion_fruit_verify_token_2025\`
     - Click **Verify and Save**.
   - Under **Webhook fields**, click **Manage** and subscribe to **\`messages\`**.

3. **Save in Passion Fruit**:
   - Go to **/settings** or **/setup** in your dashboard.
   - Paste your **Phone Number ID**, **WABA ID**, and **Access Token**.
   - Click **Save Settings**. You are ready for live messaging!`,

  team_inbox: `### Using the Live Shared Team Inbox (/inbox):

- **Real-Time Live Sync**: The inbox automatically updates every 2.5 seconds without needing a page refresh.
- **Message Status Receipts**:
  - \`✓\` Sent: Message dispatched to Meta.
  - \`✓✓\` Delivered: Reached customer's device.
  - \`✓✓ (Blue)\` Read: Opened and viewed by customer.
  - \`Alert\` Failed: Shows exact Meta error (e.g. token expired or outside 24-hr window).
- **Multi-Agent Collaboration**: Assign threads to team members, add private internal notes, and send instant one-tap canned responses.`,

  automations: `### The 4 WhatsApp Automation Node Types (/automations):

1. **Standard Text Node**: Clean plain or markdown copy for greetings, alerts, and FAQs.
2. **Interactive 3-Buttons Node**: Up to 3 quick-reply buttons (e.g., *Product Specs*, *Pricing*, *Talk to Agent*) with custom header and footer.
3. **Interactive List Menu Node**: Multi-section menu with an action button (e.g., *View Options*) and expandable rows with descriptions.
4. **Product Carousel Cards Node**: Swipeable horizontal cards featuring product imagery, titles, descriptions, and interactive CTA buttons.

*Test them live in the **Interactive Phone Simulator** on the right side of the Flow Builder!*`,

  broadcasts: `### Launching WhatsApp Broadcast Campaigns (/campaigns):

1. **Select Audience**: Filter your opted-in contacts by database tags (e.g. \`VIP\`, \`Customers\`, or \`All\`).
2. **Choose Approved Template**: Select official templates like \`teaser_alert\` or \`order_confirmation\`.
3. **Dispatch**: Click **Dispatch Campaign**. Passion Fruit streams messages with official 50ms pacing and logs real-time delivery rates.`,

  what_is_pf: `### Welcome to TriPix WhatsApp Automation!

**TriPix WhatsApp Automation** is an enterprise-grade WhatsApp Automation & Omnichannel Shared Team Inbox SaaS platform:
- **Shared Team Inbox**: Centralized multi-agent customer conversations with real-time status ticks.
- **Visual Flow Builder**: 4 interactive WhatsApp node types (Text, 3-Buttons, List, Product Carousel).
- **Direct Meta Cloud API (v18.0+)**: Zero third-party markups, direct Facebook Graph API integration.
- **Broadcast Campaigns**: Targeted messaging to segmented contact tags.
- **Route Security**: Role-based access control with Edge middleware.`,
};
