import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ScrollText, Settings2, LogOut, Swords, Loader2 } from 'lucide-react'
import { Auth } from '@/features/Auth'
import { Hud } from '@/features/Hud'
import { Tasks } from '@/features/Tasks'
import { Settings } from '@/features/Settings'
import { LevelUp } from '@/features/LevelUp'
import { Toast } from '@/components/Toast'
import { api, tokenStore, type AppState } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function App() {
  const [state, setState] = useState<AppState | null>(null)
  const [booting, setBooting] = useState(true)
  const [view, setView] = useState<'quests' | 'settings'>('quests')
  const [toast, setToast] = useState<string | null>(null)
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const notify = useCallback((m: string) => {
    setToast(m)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state?.settings.theme ?? 'ink')
  }, [state?.settings.theme])

  useEffect(() => {
    if (!tokenStore.get()) {
      setBooting(false)
      return
    }
    api
      .me()
      .then((r) => setState(r.state))
      .catch(() => tokenStore.clear())
      .finally(() => setBooting(false))
  }, [])

  function logout() {
    tokenStore.clear()
    setState(null)
    setView('quests')
  }

  async function deleteAccount() {
    if (!confirm('Excluir conta e todos os dados? Irreversível.')) return
    try {
      await api.deleteAccount()
    } catch { /* mesmo assim sai */ }
    logout()
  }

  if (booting) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-strong)]" />
      </div>
    )
  }

  if (!state) return <Auth onAuth={setState} />

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-card lg:sticky lg:top-5">
          <div className="flex items-center gap-2.5">
            <div className="mark h-9 w-9 rounded-xl">
              <Swords className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-lg leading-none text-[var(--text)]">QuestLog</p>
              <p className="mt-1 max-w-36 truncate text-xs text-[var(--muted)]">{state.user.name}</p>
            </div>
          </div>

          <nav className="mt-4 grid gap-1">
            <NavBtn
              active={view === 'quests'}
              onClick={() => setView('quests')}
              icon={<ScrollText />}
              label="Quests"
            />
            <NavBtn
              active={view === 'settings'}
              onClick={() => setView('settings')}
              icon={<Settings2 />}
              label="Configurações"
            />
          </nav>

          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--deep)] p-3">
            <p className="truncate text-[13px] font-semibold text-[var(--text)]">{state.user.name}</p>
            <p className="truncate text-xs text-[var(--muted)]">{state.user.email}</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={logout}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)]"
              >
                <LogOut className="h-3.5 w-3.5" /> Sair
              </button>
              <button
                onClick={deleteAccount}
                className="rounded-lg border border-red-500/20 px-2 py-1.5 text-xs font-semibold text-red-400/80 hover:text-red-300"
                title="Excluir conta"
              >
                Excluir
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main>
          <AnimatePresence mode="wait">
            {view === 'quests' ? (
              <motion.div
                key="quests"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <Hud state={state} />
                <Tasks state={state} setState={setState} notify={notify} onLevelUp={setLevelUp} />
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <Settings state={state} setState={setState} notify={notify} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <Toast msg={toast} />
      <LevelUp level={levelUp} onClose={() => setLevelUp(null)} />
    </div>
  )
}

function NavBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition [&_svg]:h-4 [&_svg]:w-4',
        active
          ? 'bg-[var(--accent)] text-[var(--on-accent)]'
          : 'text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]'
      )}
    >
      {icon}
      {label}
    </button>
  )
}
