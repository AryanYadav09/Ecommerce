import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseKey.includes('placeholder')
);

/**
 * Local Resilient In-Memory/JSON Storage Engine for fallback & local testing
 * mirrors Supabase PostgREST query chaining (.from().select().eq().order().limit())
 */
class LocalSupabaseAdapter {
  constructor() {
    this.storageFile = path.join(__dirname, '../database/local_db_snapshot.json');
    this.tables = {
      categories: [],
      products: [],
      users: [],
      pending_users: [],
      cart_items: [],
      wishlist_items: [],
      orders: [],
      order_items: [],
      reviews: [],
      user_events: [],
      support_cases: []
    };
    this.loadSnapshot();
  }

  loadSnapshot() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        const parsed = JSON.parse(raw);
        this.tables = { ...this.tables, ...parsed };
      }
    } catch (e) {
      console.warn('Notice: initialized fresh local database store:', e.message);
    }
  }

  saveSnapshot() {
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.storageFile, JSON.stringify(this.tables, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving local snapshot:', e.message);
    }
  }

  from(tableName) {
    if (!this.tables[tableName]) {
      this.tables[tableName] = [];
    }
    const tableData = this.tables[tableName];
    const self = this;

    return new QueryBuilder(tableData, (updatedData) => {
      self.tables[tableName] = updatedData;
      self.saveSnapshot();
    });
  }
}

class QueryBuilder {
  constructor(data, onMutate) {
    this.data = data;
    this.onMutate = onMutate;
    this.filters = [];
    this.selectedFields = '*';
    this.sortField = null;
    this.sortAscending = true;
    this.limitCount = null;
    this.isSingle = false;
  }

  select(fields = '*') {
    this.selectedFields = fields;
    return this;
  }

  eq(column, value) {
    this.filters.push((row) => String(row[column]) === String(value));
    return this;
  }

  neq(column, value) {
    this.filters.push((row) => String(row[column]) !== String(value));
    return this;
  }

  ilike(column, pattern) {
    const cleanPattern = pattern.replace(/%/g, '').toLowerCase();
    this.filters.push((row) => String(row[column] || '').toLowerCase().includes(cleanPattern));
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.sortField = column;
    this.sortAscending = ascending;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  _applyFilters() {
    let result = [...this.data];
    for (const filter of this.filters) {
      result = result.filter(filter);
    }
    if (this.sortField) {
      result.sort((a, b) => {
        const valA = a[this.sortField];
        const valB = b[this.sortField];
        if (valA < valB) return this.sortAscending ? -1 : 1;
        if (valA > valB) return this.sortAscending ? 1 : -1;
        return 0;
      });
    }
    if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }
    return result;
  }

  async then(resolve, reject) {
    try {
      const rows = this._applyFilters();
      if (this.isSingle) {
        resolve({ data: rows[0] || null, error: null });
      } else {
        resolve({ data: rows, error: null });
      }
    } catch (err) {
      resolve({ data: null, error: err });
    }
  }

  async insert(records) {
    const list = Array.isArray(records) ? records : [records];
    const inserted = [];

    const current = [...this.data];
    for (const item of list) {
      const record = {
        ...item,
        id: item.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      current.push(record);
      inserted.push(record);
    }

    this.onMutate(current);
    return { data: inserted, error: null };
  }

  async upsert(records, { onConflict } = {}) {
    const list = Array.isArray(records) ? records : [records];
    const current = [...this.data];
    const upserted = [];

    for (const item of list) {
      let matchIndex = -1;
      if (onConflict) {
        const conflictKeys = onConflict.split(',').map(s => s.trim());
        matchIndex = current.findIndex(existing =>
          conflictKeys.every(k => String(existing[k]) === String(item[k]))
        );
      } else if (item.id) {
        matchIndex = current.findIndex(existing => String(existing.id) === String(item.id));
      }

      if (matchIndex >= 0) {
        const updated = {
          ...current[matchIndex],
          ...item,
          updated_at: new Date().toISOString()
        };
        current[matchIndex] = updated;
        upserted.push(updated);
      } else {
        const record = {
          ...item,
          id: item.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        current.push(record);
        upserted.push(record);
      }
    }

    this.onMutate(current);
    return { data: upserted, error: null };
  }

  async update(updates) {
    const current = [...this.data];
    let matched = 0;
    const updatedRows = [];

    for (let i = 0; i < current.length; i++) {
      const matches = this.filters.every(filter => filter(current[i]));
      if (matches) {
        current[i] = {
          ...current[i],
          ...updates,
          updated_at: new Date().toISOString()
        };
        updatedRows.push(current[i]);
        matched++;
      }
    }

    this.onMutate(current);
    return { data: updatedRows, error: null, count: matched };
  }

  async delete() {
    const current = [...this.data];
    const remaining = [];
    const deleted = [];

    for (let i = 0; i < current.length; i++) {
      const matches = this.filters.every(filter => filter(current[i]));
      if (matches) {
        deleted.push(current[i]);
      } else {
        remaining.push(current[i]);
      }
    }

    this.onMutate(remaining);
    return { data: deleted, error: null, count: deleted.length };
  }
}

let supabaseInstance;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    console.log('[Database] Connected to Cloud Supabase Client.');
  } catch (err) {
    console.warn('[Database] Cloud Supabase init failed, falling back to local adapter:', err.message);
    supabaseInstance = new LocalSupabaseAdapter();
  }
} else {
  console.log('[Database] Initializing Local Relational Supabase Storage Adapter.');
  supabaseInstance = new LocalSupabaseAdapter();
}

export const getSupabase = () => supabaseInstance;
export default supabaseInstance;
