import { randomUUID } from 'crypto';
import { database, checked } from './client';
import type { Company, MetaTemplateItem } from './types';
const company = (r: any): Company => ({ id: r.id, workspaceId: r.workspace_id, name: r.name,
  domain: r.domain, industry: r.industry, phone: r.phone, contactCount: r.contact_count,
  dealValue: r.deal_value, createdAt: r.created_at, updatedAt: r.updated_at });
export const CompaniesDB = {
  async list(workspaceId: string): Promise<Company[]> {
    return (checked(await database().from('companies').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(500)) || []).map(company);
  },
  async getById(id: string, workspaceId: string): Promise<Company | null> {
    const r = checked(await database().from('companies').select('*').eq('id', id).eq('workspace_id', workspaceId).maybeSingle());
    return r ? company(r) : null;
  },
  async upsert(data: Partial<Company> & { name: string }, workspaceId: string): Promise<Company> {
    const existing = data.id ? await this.getById(data.id, workspaceId) : null;
    if (data.id && !existing) throw new Error('Company not found');
    const value = { id: existing?.id || randomUUID(), workspace_id: workspaceId, name: data.name,
      domain: data.domain ?? existing?.domain, industry: data.industry ?? existing?.industry,
      phone: data.phone ?? existing?.phone, contact_count: data.contactCount ?? existing?.contactCount ?? 0,
      deal_value: data.dealValue ?? existing?.dealValue ?? 0, updated_at: new Date().toISOString() };
    const q = existing ? database().from('companies').update(value).eq('id', value.id).eq('workspace_id', workspaceId) : database().from('companies').insert(value);
    return company(checked(await q.select('*').single()));
  },
};
const template = (r: any): MetaTemplateItem => ({ id: r.id, name: r.name, language: r.language,
  category: r.category, status: r.status, body: r.body, header: typeof r.header === 'string' ? r.header : r.header?.text,
  footer: r.footer, buttons: r.buttons, updatedAt: r.updated_at });
export const TemplatesDB = {
  async list(workspaceId: string): Promise<MetaTemplateItem[]> {
    return (checked(await database().from('templates').select('*').eq('workspace_id', workspaceId).order('name').limit(500)) || []).map(template);
  },
  async upsert(data: MetaTemplateItem, workspaceId: string): Promise<MetaTemplateItem> {
    // Provider IDs are not database UUIDs. The database generates its own ID.
    const r = checked(await database().from('templates').upsert({ workspace_id: workspaceId,
      name: data.name, language: data.language, category: data.category, status: data.status,
      body: data.body, header: data.header ? { text: data.header } : null, footer: data.footer,
      buttons: data.buttons || [], meta_template_id: data.id, updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,name,language' }).select('*').single());
    return template(r);
  },
};
