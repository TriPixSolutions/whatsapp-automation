import Link from 'next/link';

const steps = [
  ['1. Prepare your workspace', 'Create your account and sign in. Open Settings → Meta Connection. Your administrator must configure the deployed Supabase URL, server-only service key, application URL and a stable encryption key. Do not paste these server keys into WhatsApp fields.'],
  ['2. Create or select your Meta app', 'In Meta for Developers, select the app connected to your business and add the WhatsApp use case. Copy the App ID. In the app’s basic settings, reveal the App Secret. The App Secret is different from the WhatsApp access token. Keep both private.'],
  ['3. Select the correct business assets', 'In WhatsApp API Setup, copy the WhatsApp Business Account ID (WABA ID) and Phone Number ID. These are numeric asset IDs; the Phone Number ID is not your telephone number. Use assets from the same business and app.'],
  ['4. Prepare an access token', 'For initial testing, generate the token provided by Meta API Setup and add and verify your recipient in Meta’s test recipient list. Temporary tokens expire. For production, create a system user in Business Settings, assign the app and WhatsApp business assets, and generate a token with whatsapp_business_messaging and whatsapp_business_management permissions. Additional business management actions can require business_management. Grant only the permissions you need.'],
  ['5. Save the connection', 'Enter the App ID, App Secret, WABA ID, Phone Number ID and access token in this SaaS. Choose your own random webhook verify token. This token is a matching password you create, not a Meta access token. Click Save/Connect. A phone API probe verifies outbound access; it does not prove inbound automation works. If old credentials cannot be decrypted, replace both the access token and App Secret, or have your administrator restore the original encryption key.'],
  ['6. Register the inbound webhook', 'In your Meta app’s WhatsApp webhook configuration, set the callback URL to your deployed HTTPS domain followed by /api/webhook/whatsapp. Enter exactly the same verify token saved in the SaaS. Verify and save, then subscribe to the messages field. The app must also be subscribed to the WABA using its subscribed_apps endpoint. Saving the SaaS connection attempts both registrations and reports failures; complete any failed registration in Meta.'],
  ['7. Prove inbound delivery', 'Send a real WhatsApp message from your verified recipient to the connected business/test number. Check Inbox for the received message and Settings diagnostics for a new event in your workspace. Sending successfully from the SaaS proves only outbound delivery. If nothing arrives, check the callback, messages subscription, WABA app subscription, App Secret signature verification and deployed runtime logs.'],
  ['8. Create your first automation', 'Open Automations and create a workflow. Add a Keyword trigger with hello, connect it to a Text Message node, then to End. Save it and activate it. Send hello from WhatsApp. Inspect the execution trace and your phone. Custom workflows need valid connected nodes, one trigger, configured actions and an active status. A draft workflow does not run.'],
  ['9. Test buttons, lists and carousel replies', 'Connect a Buttons node to branches using the exact button IDs. First send the trigger so the workflow reaches a waiting session, then click its button. A click alone does not create a session. For a carousel, use an approved Meta carousel template and its exact language, components and media; a list fallback is a list, not a carousel. Template quick replies must route using the payload Meta actually returns. URL and phone buttons do not send a reply click webhook.'],
  ['10. Test safely in Automation Lab', 'Sandbox tests use the same automation dispatcher and engine, with simulated delivery clearly identified. Sandbox success is not proof of a delivered WhatsApp message. Test the keyword first, then its waiting button/carousel reply. Live tests require a real configured token, verified recipient and an applicable messaging window or approved template.'],
  ['11. Configure delayed work and AI', 'Delays, scheduled follow-ups and broadcasts need the documented worker and its required secrets/infrastructure. Deploy the worker separately if your host cannot keep background processes running. Verify a delay survives application restart before enabling customer follow-ups. AI nodes require a configured provider key and supported model; review the agent instructions and test responses. Unconfigured integrations must fail visibly rather than report success.'],
  ['12. Complete production checks', 'Use your production phone, approved templates, consented recipients, correct business verification and permissions. Verify text, image, template, trigger, reply branches, conditions, delay restart, duplicate webhook protection, tenant isolation and failed-action traces. Review the production report for pending external checks before opening the service to customers.'],
];

export default function MetaSetupGuide() {
  return <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900">
    <article className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 md:p-10">
      <Link href="/settings" className="text-violet-700">← Open workspace settings</Link>
      <h1 className="mt-6 text-3xl font-bold">Connect Meta WhatsApp and run your automation</h1>
      <p className="mt-4 text-slate-600">Follow these steps in order. Keep access tokens and App Secrets private. Meta’s screen labels may change; the asset IDs and verification checks below still need to match.</p>
      <ol className="mt-8 list-none space-y-8">{steps.map(([title, text]) => <li key={title}><h2 className="text-xl font-semibold">{title}</h2><p className="mt-2 leading-7 text-slate-700">{text}</p></li>)}</ol>
      <h2 className="mt-10 text-xl font-semibold">Common errors</h2>
      <ul className="mt-3 list-disc space-y-3 pl-5 text-slate-700">
        <li>Database not configured: add Supabase settings to the hosting environment and rebuild/restart. Your local .env.local is not automatically uploaded.</li>
        <li>Meta error 190: token expired or invalid; generate a replacement with the correct asset access.</li>
        <li>Permission or asset access error: assign the WABA and app to the system user and verify the token permissions.</li>
        <li>Outside the customer care window: use an approved template; a sandbox test must never open a real messaging window.</li>
        <li>No active session: start the trigger first, then click the reply button while its waiting session is active.</li>
        <li>Stored credential error: restore the original encryption key or reconnect with both replacement credentials. Do not change the key without rotating stored credentials.</li>
      </ul>
      <p className="mt-8">Official references: <a className="text-violet-700 underline" href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started">Meta Cloud API setup</a> · <a className="text-violet-700 underline" href="https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks">Meta webhooks</a></p>
    </article>
  </main>;
}
