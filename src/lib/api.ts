export type Difficulty = 'easy' | 'medium' | 'hard' | 'epic'

export interface Task {
  id: string
  title: string
  difficulty: Difficulty
  done: boolean
  created_at: number
  done_at: number | null
}

export interface AppState {
  user: { id: string; name: string; email: string; created_at: number }
  progress: { totalXp: number; doneCount: number; streak: number; lastDoneDate: string | null }
  settings: {
    xp: Record<Difficulty, number>
    dailyGoal: number
    theme: string
    sound: boolean
  }
  tasks: Task[]
  today: { total: number; done: number }
}

const KEY = 'questlog:token'

export const tokenStore = {
  get: () => localStorage.getItem(KEY),
  set: (t: string) => localStorage.setItem(KEY, t),
  clear: () => localStorage.removeItem(KEY),
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {}),
      ...(opts.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Erro inesperado')
  return data as T
}

export const api = {
  register: (name: string, email: string, password: string) =>
    req<{ token: string; state: AppState }>('/api/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  login: (email: string, password: string) =>
    req<{ token: string; state: AppState }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => req<{ state: AppState }>('/api/me'),
  addTask: (title: string, difficulty: Difficulty) =>
    req<{ state: AppState }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, difficulty }),
    }),
  toggleTask: (id: string) =>
    req<{ state: AppState; gained: number; leveledUp: boolean }>(
      `/api/tasks/${id}/toggle`,
      { method: 'PATCH' }
    ),
  deleteTask: (id: string) =>
    req<{ state: AppState }>(`/api/tasks/${id}`, { method: 'DELETE' }),
  clearDone: () => req<{ state: AppState }>('/api/tasks', { method: 'DELETE' }),
  saveSettings: (patch: Partial<{ xp: Record<Difficulty, number>; dailyGoal: number; theme: string; sound: boolean }>) =>
    req<{ state: AppState }>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  saveProfile: (name: string, email: string) =>
    req<{ state: AppState }>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name, email }),
    }),
  changePassword: (current: string, next: string) =>
    req<{ ok: boolean }>('/api/password', {
      method: 'PATCH',
      body: JSON.stringify({ current, next }),
    }),
  resetProgress: () =>
    req<{ state: AppState }>('/api/reset-progress', { method: 'POST' }),
  deleteAccount: () =>
    req<{ ok: boolean }>('/api/account', { method: 'DELETE' }),
}
