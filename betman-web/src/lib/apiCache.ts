import fs from 'fs';
import path from 'path';

const CACHE_DIR = process.env.NODE_ENV === 'development'
  ? path.join(process.cwd(), '.api-cache')
  : '/tmp/.api-cache';

function ensureDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function safeKey(key: string) {
  return key.replace(/[^a-z0-9_-]/gi, '_');
}

export function readCache(key: string): { data: any; ts: number; ttl: number } | null {
  try {
    ensureDir();
    const file = path.join(CACHE_DIR, safeKey(key) + '.json');
    if (!fs.existsSync(file)) return null;
    const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (Date.now() - parsed.ts > parsed.ttl) {
      try { fs.unlinkSync(file); } catch {}
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeCache(key: string, data: any, ttl: number) {
  try {
    ensureDir();
    const file = path.join(CACHE_DIR, safeKey(key) + '.json');
    fs.writeFileSync(file, JSON.stringify({ data, ts: Date.now(), ttl }), 'utf-8');
  } catch {}
}
