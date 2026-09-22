// Rotas da API (paths SEM prefixo /api).
// Montadas em /api no dev local e em /api + / na Vercel (vercel.json + api/index.js).
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { get, all, run } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'questlog-dev-secret-change-me'
if (!process.env.JWT_SECRET && process.env.VERCEL) {
  console.warn('⚠️  JWT_SECRET não definido na Vercel — defina nas Environment Variables!')
}

function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

/** Wrap p/ async handlers (Express 4 não captura rejection sozinho) */
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

function auth(req, res, next) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Não autenticado' })
  try {
    req.userId = jwt.verify(token, JWT_SECRET).sub
    next()
  } catch {
    return res.status(401).json({ error: 'Sessão expirada' })
  }
}

async function ensureDefaults(userId) {
  await run('INSERT OR IGNORE INTO progress (user_id) VALUES (?)', userId)
  await run('INSERT OR IGNORE INTO settings (user_id) VALUES (?)', userId)
}

async function getState(userId) {
  await ensureDefaults(userId)
  const user = await get('SELECT id, name, email, created_at FROM users WHERE id = ?', userId)
  const p = (await get('SELECT * FROM progress WHERE user_id = ?', userId)) ?? {}
  const s = (await get('SELECT * FROM settings WHERE user_id = ?', userId)) ?? {}
  const tasks = (
    await all(
      'SELECT id, title, difficulty, done, created_at, done_at FROM tasks WHERE user_id = ? ORDER BY done ASC, created_at DESC LIMIT 500',
      userId
    )
  ).map((t) => ({ ...t, done: !!t.done }))

  const startOfToday = new Date(todayStr() + 'T00:00:00.000Z').getTime()
  const todays = await all(
    'SELECT done FROM tasks WHERE user_id = ? AND created_at >= ?',
    userId,
    startOfToday
  )
  return {
    user,
    progress: {
      totalXp: p.total_xp ?? 0,
      doneCount: p.done_count ?? 0,
      streak: p.streak ?? 0,
      lastDoneDate: p.last_done_date ?? null,
    },
    settings: {
      xp: {
        easy: s.xp_easy ?? 10,
        medium: s.xp_medium ?? 25,
        hard: s.xp_hard ?? 50,
        epic: s.xp_epic ?? 100,
      },
      dailyGoal: s.daily_goal ?? 3,
      theme: s.theme ?? 'ink',
      sound: !!(s.sound ?? 1),
    },
    tasks,
    today: { total: todays.length, done: todays.filter((t) => t.done).length },
  }
}

function levelFor(total) {
  let lvl = 1, need = 100, acc = 0
  while (acc + need <= total) {
    acc += need
    lvl++
    need = Math.round(need * 1.2)
  }
  return lvl
}

export function createApiRouter() {
  const r = Router()

  r.post('/register', ah(async (req, res) => {
    const { name, email, password } = req.body ?? {}
    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ error: 'Preencha nome, email e senha' })
    if (password.length < 6)
      return res.status(400).json({ error: 'Senha deve ter 6+ caracteres' })
    const cleanEmail = String(email).trim().toLowerCase()
    if (!cleanEmail.includes('@'))
      return res.status(400).json({ error: 'Email inválido' })
    if (await get('SELECT id FROM users WHERE email = ?', cleanEmail))
      return res.status(409).json({ error: 'Email já cadastrado' })

    const id = crypto.randomUUID()
    await run(
      'INSERT INTO users (id, name, email, pass_hash, created_at) VALUES (?,?,?,?,?)',
      id,
      String(name).trim(),
      cleanEmail,
      bcrypt.hashSync(password, 10),
      Date.now()
    )
    const token = jwt.sign({ sub: id }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ token, state: await getState(id) })
  }))

  r.post('/login', ah(async (req, res) => {
    const { email, password } = req.body ?? {}
    if (!email || !password)
      return res.status(400).json({ error: 'Preencha email e senha' })
    const user = await get(
      'SELECT * FROM users WHERE email = ?',
      String(email).trim().toLowerCase()
    )
    if (!user || !bcrypt.compareSync(password, user.pass_hash))
      return res.status(401).json({ error: 'Email ou senha inválidos' })
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ token, state: await getState(user.id) })
  }))

  r.get('/me', auth, ah(async (req, res) => {
    res.json({ state: await getState(req.userId) })
  }))

  // ---------- tasks (isoladas por login) ----------
  r.post('/tasks', auth, ah(async (req, res) => {
    const { title, difficulty = 'medium' } = req.body ?? {}
    if (!title?.trim()) return res.status(400).json({ error: 'Digite a tarefa' })
    if (!['easy', 'medium', 'hard', 'epic'].includes(difficulty))
      return res.status(400).json({ error: 'Dificuldade inválida' })
    await run(
      'INSERT INTO tasks (id, user_id, title, difficulty, done, created_at) VALUES (?,?,?,?,0,?)',
      crypto.randomUUID(),
      req.userId,
      String(title).trim().slice(0, 200),
      difficulty,
      Date.now()
    )
    res.json({ state: await getState(req.userId) })
  }))

  r.patch('/tasks/:id/toggle', auth, ah(async (req, res) => {
    const task = await get(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      req.params.id,
      req.userId
    )
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' })

    const settings = await get('SELECT * FROM settings WHERE user_id = ?', req.userId)
    const gain =
      { easy: settings.xp_easy, medium: settings.xp_medium, hard: settings.xp_hard, epic: settings.xp_epic }[task.difficulty] ?? 25
    const progress = await get('SELECT * FROM progress WHERE user_id = ?', req.userId)

    if (!task.done) {
      const before = levelFor(progress.total_xp)
      await run('UPDATE tasks SET done = 1, done_at = ? WHERE id = ?', Date.now(), task.id)
      const t = todayStr()
      if (progress.last_done_date !== t) {
        const y = new Date()
        y.setDate(y.getDate() - 1)
        const ys = y.toISOString().slice(0, 10)
        let streak = 1
        if (progress.last_done_date === ys) streak = progress.streak + 1
        else if (progress.last_done_date) {
          const diffDays = Math.round((new Date(t) - new Date(progress.last_done_date)) / 86400000)
          streak = diffDays === 1 ? progress.streak + 1 : 1
        }
        await run('UPDATE progress SET streak = ?, last_done_date = ? WHERE user_id = ?', streak, t, req.userId)
      }
      const newTotal = progress.total_xp + gain
      await run('UPDATE progress SET total_xp = ?, done_count = done_count + 1 WHERE user_id = ?', newTotal, req.userId)
      res.json({ state: await getState(req.userId), gained: gain, leveledUp: levelFor(newTotal) > before })
    } else {
      await run('UPDATE tasks SET done = 0, done_at = NULL WHERE id = ?', task.id)
      await run(
        'UPDATE progress SET total_xp = MAX(0, total_xp - ?), done_count = MAX(0, done_count - 1) WHERE user_id = ?',
        gain,
        req.userId
      )
      res.json({ state: await getState(req.userId), gained: -gain, leveledUp: false })
    }
  }))

  r.delete('/tasks/:id', auth, ah(async (req, res) => {
    await run('DELETE FROM tasks WHERE id = ? AND user_id = ?', req.params.id, req.userId)
    res.json({ state: await getState(req.userId) })
  }))

  r.delete('/tasks', auth, ah(async (req, res) => {
    await run('DELETE FROM tasks WHERE user_id = ? AND done = 1', req.userId)
    res.json({ state: await getState(req.userId) })
  }))

  // ---------- settings / profile ----------
  r.patch('/settings', auth, ah(async (req, res) => {
    const { xp, dailyGoal, theme, sound } = req.body ?? {}
    await ensureDefaults(req.userId)
    const cur = await get('SELECT * FROM settings WHERE user_id = ?', req.userId)
    const next = {
      xp_easy: Math.max(1, parseInt(xp?.easy ?? cur.xp_easy) || 10),
      xp_medium: Math.max(1, parseInt(xp?.medium ?? cur.xp_medium) || 25),
      xp_hard: Math.max(1, parseInt(xp?.hard ?? cur.xp_hard) || 50),
      xp_epic: Math.max(1, parseInt(xp?.epic ?? cur.xp_epic) || 100),
      daily_goal: Math.min(50, Math.max(1, parseInt(dailyGoal ?? cur.daily_goal) || 3)),
      theme: ['ink', 'forest', 'ember', 'mist'].includes(theme) ? theme : cur.theme,
      sound: typeof sound === 'boolean' ? (sound ? 1 : 0) : cur.sound,
    }
    await run(
      'UPDATE settings SET xp_easy=?, xp_medium=?, xp_hard=?, xp_epic=?, daily_goal=?, theme=?, sound=? WHERE user_id=?',
      next.xp_easy, next.xp_medium, next.xp_hard, next.xp_epic,
      next.daily_goal, next.theme, next.sound, req.userId
    )
    res.json({ state: await getState(req.userId) })
  }))

  r.patch('/profile', auth, ah(async (req, res) => {
    const { name, email } = req.body ?? {}
    if (!name?.trim() || !email?.trim())
      return res.status(400).json({ error: 'Preencha nome e email' })
    const cleanEmail = String(email).trim().toLowerCase()
    if (await get('SELECT id FROM users WHERE email = ? AND id != ?', cleanEmail, req.userId))
      return res.status(409).json({ error: 'Email já em uso' })
    await run('UPDATE users SET name = ?, email = ? WHERE id = ?', String(name).trim(), cleanEmail, req.userId)
    res.json({ state: await getState(req.userId) })
  }))

  r.patch('/password', auth, ah(async (req, res) => {
    const { current, next } = req.body ?? {}
    const user = await get('SELECT * FROM users WHERE id = ?', req.userId)
    if (!bcrypt.compareSync(current ?? '', user.pass_hash))
      return res.status(400).json({ error: 'Senha atual incorreta' })
    if (!next || next.length < 6)
      return res.status(400).json({ error: 'Nova senha precisa de 6+ caracteres' })
    await run('UPDATE users SET pass_hash = ? WHERE id = ?', bcrypt.hashSync(next, 10), req.userId)
    res.json({ ok: true })
  }))

  r.post('/reset-progress', auth, ah(async (req, res) => {
    await run('DELETE FROM tasks WHERE user_id = ?', req.userId)
    await run('UPDATE progress SET total_xp=0, done_count=0, streak=0, last_done_date=NULL WHERE user_id=?', req.userId)
    res.json({ state: await getState(req.userId) })
  }))

  r.delete('/account', auth, ah(async (req, res) => {
    await run('DELETE FROM users WHERE id = ?', req.userId)
    res.json({ ok: true })
  }))

  r.get('/health', (_req, res) => res.json({ ok: true }))

  return r
}
