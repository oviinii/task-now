import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Search, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { api, type AppState, type Difficulty } from '@/lib/api'

const DIFF_LABEL: Record<Difficulty, string> = {
  easy: 'Fácil',
  medium: 'Média',
  hard: 'Difícil',
  epic: 'Épica',
}

export function Tasks({
  state,
  setState,
  notify,
  onLevelUp,
}: {
  state: AppState
  setState: (s: AppState) => void
  notify: (m: string) => void
  onLevelUp: (lvl: number) => void
}) {
  const [title, setTitle] = useState('')
  const [diff, setDiff] = useState<Difficulty>('medium')
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all')
  const [q, setQ] = useState('')

  const items = useMemo(() => {
    let list = [...state.tasks]
    if (filter === 'open') list = list.filter((t) => !t.done)
    if (filter === 'done') list = list.filter((t) => t.done)
    if (q.trim()) list = list.filter((t) => t.title.toLowerCase().includes(q.toLowerCase()))
    return list
  }, [state.tasks, filter, q])

  async function add() {
    if (!title.trim()) return notify('Digite a tarefa primeiro')
    try {
      const res = await api.addTask(title.trim(), diff)
      setState(res.state)
      setTitle('')
      notify('Quest adicionada')
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Erro ao adicionar')
    }
  }

  async function toggle(id: string) {
    try {
      const res = await api.toggleTask(id)
      setState(res.state)
      if (res.gained > 0) {
        notify(`+${res.gained} XP`)
        if (res.leveledUp) {
          const total = res.state.progress.totalXp
          let lvl = 1, need = 100, acc = 0
          while (acc + need <= total) { acc += need; lvl++; need = Math.round(need * 1.2) }
          onLevelUp(lvl)
        }
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Erro')
    }
  }

  async function remove(id: string) {
    const res = await api.deleteTask(id)
    setState(res.state)
  }

  async function clearDone() {
    const res = await api.clearDone()
    setState(res.state)
    notify('Concluídas removidas')
  }

  return (
    <Card className="mt-3 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="field flex-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Nova quest — ex.: estudar 30 min, treinar, ler 10 páginas"
          maxLength={200}
        />
        <div className="flex gap-2">
          <select className="field sm:w-40" value={diff} onChange={(e) => setDiff(e.target.value as Difficulty)}>
            {(Object.keys(DIFF_LABEL) as Difficulty[]).map((d) => (
              <option key={d} value={d}>
                {DIFF_LABEL[d]} · +{state.settings.xp[d]} XP
              </option>
            ))}
          </select>
          <Button onClick={add}>
            <Plus /> Adicionar
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-[var(--deep)] p-1 text-[13px] font-semibold">
          {(['all', 'open', 'done'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 transition ${
                filter === f ? 'bg-[var(--hover)] text-[var(--text)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {f === 'all' ? 'Todas' : f === 'open' ? 'Abertas' : 'Concluídas'}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--faint)]" />
          <input
            className="field w-44 pl-8"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
          />
        </div>
        <span className="text-xs text-[var(--faint)]">{items.length} quest(s)</span>
        <button onClick={clearDone} className="ml-auto text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)]">
          Limpar concluídas
        </button>
      </div>

      <div className="mt-3 grid gap-2">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={`flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--deep)] px-3 py-2.5 ${
                t.done ? 'opacity-55' : ''
              }`}
            >
              <button
                onClick={() => toggle(t.id)}
                aria-label="Concluir tarefa"
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition ${
                  t.done
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]'
                    : 'border-[var(--faint)] hover:border-[var(--accent)]'
                }`}
              >
                {t.done && <Check className="h-4 w-4" strokeWidth={3} />}
              </button>
              <span className={`flex-1 text-sm ${t.done ? 'text-[var(--muted)] line-through' : 'text-[var(--text)]'}`}>
                {t.title}
              </span>
              <span className="chip-accent rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums">
                +{state.settings.xp[t.difficulty]}
              </span>
              <span className="hidden text-[11px] uppercase tracking-wider text-[var(--faint)] sm:inline">
                {DIFF_LABEL[t.difficulty]}
              </span>
              <button
                onClick={() => remove(t.id)}
                aria-label="Excluir"
                className="text-[var(--faint)] transition hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            Nenhuma quest por aqui. Adicione a primeira acima e ganhe XP.
          </p>
        )}
      </div>
    </Card>
  )
}
