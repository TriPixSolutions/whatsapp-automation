const crypto = require('node:crypto');
// Stateful fake database shared by otherwise fresh repository instances.
function backend() {
  const tables = { users: [], workspace_members: [], workspaces: [], meta_connections: [], phone_numbers: [], contacts: [], contact_tags: [], contact_notes: [], contact_activities: [], messages: [], conversations: [], message_statuses: [], workflow_definitions: [], workflow_sessions: [], workflow_executions: [], webhook_events: [], campaigns: [], scheduled_jobs: [] };
  const db = { from(table) {
    let operation = 'read', input, conflict, single = false, maximum = Infinity, ignoreDuplicates = false, counted = false, head = false;
    const predicates = [];
    const q = {
      select(_columns, options = {}) { counted = !!options.count; head = !!options.head; return q; }, order() { return q; }, limit(n) { maximum = n; return q; },
      in(key, values) { predicates.push(row => values.includes(row[key])); return q; },
      eq(key, value) { predicates.push(row => row[key] === value); return q; },
      maybeSingle() { single = true; return q; }, single() { single = true; return q; },
      insert(data) { operation = 'insert'; input = data; return q; },
      upsert(data, options) { operation = 'upsert'; input = data; conflict = options?.onConflict || 'id'; ignoreDuplicates = options?.ignoreDuplicates; return q; },
      update(data) { operation = 'update'; input = data; return q; },
      delete() { operation = 'delete'; return q; },
      then(resolve, reject) {
        try {
          if (!tables[table]) throw new Error(`Unexpected table ${table}`);
          let rows = tables[table].filter(row => predicates.every(p => p(row)));
          if (operation === 'insert') { rows = (Array.isArray(input) ? input : [input]).map(value => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...structuredClone(value) })); tables[table].push(...rows); }
          if (operation === 'upsert') {
            const existing = tables[table].find(row => conflict.split(',').every(key => row[key] === input[key]));
            if (existing && ignoreDuplicates) { rows = []; } else if (existing) { Object.assign(existing, structuredClone(input)); rows = [existing]; } else { const saved = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...structuredClone(input) }; tables[table].push(saved); rows = [saved]; }
          }
          if (operation === 'update') rows.forEach(row => Object.assign(row, structuredClone(input)));
          if (operation === 'delete') tables[table] = tables[table].filter(row => !rows.includes(row));
          rows = rows.slice(0, maximum);
          if (table === 'contacts') rows = rows.map(row => ({ ...row, contact_tags: tables.contact_tags.filter(tag => tag.contact_id === row.id), contact_notes: tables.contact_notes.filter(note => note.contact_id === row.id) }));
          return Promise.resolve({ data: head ? null : structuredClone(single ? rows[0] || null : rows), count: counted ? rows.length : null, error: null }).then(resolve, reject);
        } catch (error) { return Promise.reject(error).then(resolve, reject); }
      },
    };
    return q;
  }};
  const client = { database: () => db, checked(result) { if (result.error) throw new Error(result.error.message); return result.data; } };
  return { tables, client };
}
module.exports = backend;
