// Shared schema lookup for both campaign and scheduled follow-up workers.
async function getWorkspaceConnection(supabase, workspaceId) {
  const [connection, phone] = await Promise.all([
    supabase.from('meta_connections').select('access_token_encrypted').eq('workspace_id', workspaceId).maybeSingle(),
    supabase.from('phone_numbers').select('phone_number_id').eq('workspace_id', workspaceId).eq('is_default', true).maybeSingle(),
  ]);
  if (connection.error || phone.error) throw new Error('Could not load workspace WhatsApp connection');
  const defaultId = process.env.DEFAULT_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001';
  const isDefault = workspaceId === defaultId;
  const encryptedToken = connection.data?.access_token_encrypted || (isDefault ? process.env.META_ACCESS_TOKEN : '') || '';
  const phoneNumberId = phone.data?.phone_number_id || (isDefault ? process.env.META_PHONE_NUMBER_ID : '') || '';
  if (!encryptedToken || !phoneNumberId) throw new Error('WhatsApp connection is not configured for this workspace');
  return { encryptedToken, phoneNumberId };
}
module.exports = { getWorkspaceConnection };
