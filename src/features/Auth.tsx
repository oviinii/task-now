import { useState } from 'react'
import { motion } from 'framer-motion'
import * as Tabs from '@radix-ui/react-tabs'
import { Swords, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { api, tokenStore, type AppState } from '@/lib/api'

export function Auth({ onAuth }: { onAuth: (s: AppState) => void }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setErr('')
    setLoading(true)
    try {
      const res =
        mode === 'login'
          ? await api.login(email.trim(), pass)
          : await api.register(name.trim(), email.trim(), pass)
      tokenStore.set(res.token)
      onAuth(res.state)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[440px]"
      >
        <div className="mb-6 text-center">
          <div className="mark mx-auto mb-4 h-12 w-12 rounded-2xl">
            <Swords className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)]">
            QuestLog
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Um RPG de hábitos. Complete quests,
            <br />
            ganhe XP e suba de nível.
          </p>
        </div>

        <Card className="p-6">
          <Tabs.Root value={mode} onValueChange={setMode}>
            <Tabs.List className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-[var(--deep)] p-1">
              <Tabs.Trigger
                value="login"
                className="rounded-md px-3 py-2 text-sm font-semibold text-[var(--muted)] data-[state=active]:bg-[var(--hover)] data-[state=active]:text-[var(--text)]"
              >
                Entrar
              </Tabs.Trigger>
              <Tabs.Trigger
                value="register"
                className="rounded-md px-3 py-2 text-sm font-semibold text-[var(--muted)] data-[state=active]:bg-[var(--hover)] data-[state=active]:text-[var(--text)]"
              >
                Criar conta
              </Tabs.Trigger>
            </Tabs.List>

            {mode === 'register' && (
              <label className="mb-3 block">
                <span className="eyebrow">Nome</span>
                <input
                  className="field mt-1.5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como devemos te chamar?"
                />
              </label>
            )}
            <label className="mb-3 block">
              <span className="eyebrow">Email</span>
              <input
                className="field mt-1.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="eyebrow">Senha</span>
              <input
                className="field mt-1.5"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder={mode === 'login' ? '••••••••' : 'Mínimo 6 caracteres'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>

            {err && <p className="mt-3 text-[13px] font-medium text-red-400">{err}</p>}

            <Button className="mt-5 w-full" onClick={submit} disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              {mode === 'login' ? 'Entrar no QuestLog' : 'Criar minha conta'}
            </Button>
            <p className="mt-4 text-center text-xs leading-relaxed text-[var(--faint)]">
              Cada conta tem suas próprias tasks, XP e ajustes.
              <br />
              Seus dados ficam no SQLite deste servidor.
            </p>
          </Tabs.Root>
        </Card>
      </motion.div>
    </div>
  )
}
