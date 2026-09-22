import { useState } from 'react'
import * as Switch from '@radix-ui/react-switch'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { api, type AppState, type Difficulty } from '@/lib/api'

const THEMES = [
  { v: 'ink', label: 'Tinta', desc: 'Carvão quente + latão', sw: '#171310', sw2: '#d99a2b' },
  { v: 'forest', label: 'Floresta', desc: 'Verde profundo + esmeralda', sw: '#0b1d13', sw2: '#34d399' },
  { v: 'ember', label: 'Brasa', desc: 'Brasa escura + laranja', sw: '#23100b', sw2: '#f97316' },
  { v: 'mist', label: 'Névoa', desc: 'Claro, papel + teal', sw: '#efe9db', sw2: '#0d9488' },
]

export function Settings({
  state,
  setState,
  notify,
}: {
  state: AppState
  setState: (s: AppState) => void
  notify: (m: string) => void
}) {
  const [name, setName] = useState(state.user.name)
  const [email, setEmail] = useState(state.user.email)
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [passErr, setPassErr] = useState('')
  const [xp, setXp] = useState(state.settings.xp)
  const [goal, setGoal] = useState(state.settings.dailyGoal)

  async function saveProfile() {
    try {
      const res = await api.saveProfile(name.trim(), email.trim())
      setState(res.state)
      notify('Perfil atualizado')
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Erro')
    }
  }

  async function changePass() {
    setPassErr('')
    try {
      await api.changePassword(cur, next)
      setCur(''); setNext('')
      notify('Senha alterada')
    } catch (e) {
      setPassErr(e instanceof Error ? e.message : 'Erro')
    }
  }

  async function saveRewards() {
    try {
      const res = await api.saveSettings({ xp, dailyGoal: goal })
      setState(res.state)
      notify('Recompensas salvas')
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Erro')
    }
  }

  async function setTheme(theme: string) {
    try {
      const res = await api.saveSettings({ theme })
      setState(res.state)
      notify(`Tema ${THEMES.find((t) => t.v === theme)?.label} aplicado`)
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Erro ao trocar tema')
    }
  }

  async function setSound(sound: boolean) {
    try {
      const res = await api.saveSettings({ sound })
      setState(res.state)
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Erro')
    }
  }

  async function reset() {
    if (!confirm('Resetar XP e tarefas desta conta?')) return
    const res = await api.resetProgress()
    setState(res.state)
    notify('Progresso resetado')
  }

  return (
    <div className="mt-3 grid gap-3">
      <Card className="p-5">
        <h3 className="font-display text-lg text-[var(--text)]">Perfil</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="eyebrow">Nome</span>
            <input className="field mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="eyebrow">Email</span>
            <input className="field mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>
        <Button variant="secondary" size="sm" className="mt-3" onClick={saveProfile}>
          Salvar perfil
        </Button>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg text-[var(--text)]">Senha</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="eyebrow">Atual</span>
            <input className="field mt-1.5" type="password" value={cur} onChange={(e) => setCur(e.target.value)} />
          </label>
          <label className="block">
            <span className="eyebrow">Nova (6+ caracteres)</span>
            <input className="field mt-1.5" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
          </label>
        </div>
        {passErr && <p className="mt-2 text-[13px] text-red-400">{passErr}</p>}
        <Button variant="secondary" size="sm" className="mt-3" onClick={changePass}>
          Alterar senha
        </Button>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg text-[var(--text)]">Recompensas & meta</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(xp) as Difficulty[]).map((d) => (
            <label key={d} className="block">
              <span className="eyebrow">XP {d}</span>
              <input
                className="field mt-1.5"
                type="number"
                min={1}
                value={xp[d]}
                onChange={(e) => setXp({ ...xp, [d]: Math.max(1, parseInt(e.target.value) || 1) })}
              />
            </label>
          ))}
        </div>
        <label className="mt-3 block max-w-48">
          <span className="eyebrow">Meta diária</span>
          <input
            className="field mt-1.5"
            type="number"
            min={1}
            max={50}
            value={goal}
            onChange={(e) => setGoal(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </label>
        <Button variant="secondary" size="sm" className="mt-3" onClick={saveRewards}>
          Salvar recompensas
        </Button>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg text-[var(--text)]">Aparência</h3>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Cada tema troca fundo, superfícies, acentos e clima do sistema inteiro.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {THEMES.map((t) => {
            const active = state.settings.theme === t.v
            return (
              <button
                key={t.v}
                onClick={() => setTheme(t.v)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                  active
                    ? 'chip-accent'
                    : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent-ring)] hover:text-[var(--text)]'
                }`}
              >
                <span
                  className="h-9 w-9 shrink-0 rounded-lg ring-1 ring-black/20"
                  style={{ background: `linear-gradient(135deg, ${t.sw} 0%, ${t.sw2} 100%)` }}
                />
                <span>
                  <span className={`block text-sm font-bold ${active ? '' : 'text-[var(--text)]'}`}>
                    {t.label} {active && '✓'}
                  </span>
                  <span className="block text-xs opacity-80">{t.desc}</span>
                </span>
              </button>
            )
          })}
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-[var(--muted)]">
          Sons
          <Switch.Root
            checked={state.settings.sound}
            onCheckedChange={setSound}
            className="relative h-6 w-11 rounded-full border border-[var(--border)] bg-[var(--deep)] data-[state=checked]:border-transparent data-[state=checked]:bg-[var(--accent)]"
          >
            <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition data-[state=checked]:translate-x-[22px]" />
          </Switch.Root>
        </label>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg text-[var(--text)]">Zona de risco</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={reset}>
            Resetar progresso
          </Button>
        </div>
      </Card>
    </div>
  )
}
