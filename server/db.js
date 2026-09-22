// Camada de banco via libsql (dialeto SQLite).
// - Local (npm run dev): arquivo ./data/questlog.db
// - Vercel (produção): Turso via HTTP (filesystem serverless é efêmero,
//   então SQLite em arquivo NÃO persistiria — exige TURSO_DATABASE_URL).
import { createClient } from '@libsql/client'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

function makeClient() {
  const remote = process.env.TURSO_DATABASE_URL
  if (remote) {
    console.log('📦 Banco: Turso (remoto)')
    return createClient({
      url: remote,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }
  if (process.env.VERCEL) {
    // Nunca quebrar o import no serverless: o erro claro aparece no log da função.
    console.error('❌ TURSO_DATABASE_URL não configurado na Vercel')
    return {
      execute: async () => {
        throw new Error('TURSO_DATABASE_URL não configurado (Environment Variables)')
      },
      batch: async () => {
        throw new Error('TURSO_DATABASE_URL não configurado (Environment Variables)')
      },
    }
  }
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const dataDir = path.join(__dirname, '..', 'data')
  fs.mkdirSync(dataDir, { recursive: true })
  console.log('📦 Banco: arquivo local')
  return createClient({ url: `file:${path.join(dataDir, 'questlog.db')}` })
}

const client = makeClient()

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  done INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  done_at INTEGER
);
CREATE TABLE IF NOT EXISTS progress (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  done_count INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_done_date TEXT
);
CREATE TABLE IF NOT EXISTS settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp_easy INTEGER NOT NULL DEFAULT 10,
  xp_medium INTEGER NOT NULL DEFAULT 25,
  xp_hard INTEGER NOT NULL DEFAULT 50,
  xp_epic INTEGER NOT NULL DEFAULT 100,
  daily_goal INTEGER NOT NULL DEFAULT 3,
  theme TEXT NOT NULL DEFAULT 'ink',
  sound INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id, created_at DESC);
`

let schemaPromise = null
export function ensureSchema() {
  if (!schemaPromise) schemaPromise = client.batch(SCHEMA.split(';').map((s) => s.trim()).filter(Boolean))
  return schemaPromise
}

/** Uma linha ou undefined */
export async function get(sql, ...params) {
  await ensureSchema()
  const r = await client.execute({ sql, args: params })
  return r.rows[0]
}

/** Todas as linhas (array) */
export async function all(sql, ...params) {
  await ensureSchema()
  const r = await client.execute({ sql, args: params })
  return r.rows
}

/** INSERT/UPDATE/DELETE */
export async function run(sql, ...params) {
  await ensureSchema()
  await client.execute({ sql, args: params })
}
