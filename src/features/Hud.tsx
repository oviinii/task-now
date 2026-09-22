import { motion } from 'framer-motion'
import { Flame, Trophy, Star, Swords } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { XpProgress } from '@/components/ui/progress'
import { NumberTicker } from '@/components/NumberTicker'
import { levelForXp, rankFor } from '@/lib/levels'
import type { AppState } from '@/lib/api'

export function Hud({ state }: { state: AppState }) {
  const { level, current, need } = levelForXp(state.progress.totalXp)
  const rank = rankFor(level)
  const goal = state.settings.dailyGoal
  const goalHit = state.today.done >= goal

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Card className="relative overflow-hidden p-5">
        <div className="hero-beam pointer-events-none absolute inset-x-0 top-0 h-px" />
        <p className="eyebrow">Herói — {rank}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-4xl font-semibold text-[var(--text)]">
            Nv {level}
          </span>
          <span className="text-xs text-[var(--muted)]">
            <NumberTicker value={state.progress.totalXp} /> XP total
          </span>
        </div>
        <XpProgress value={(current / need) * 100} className="mt-4" />
        <p className="mt-2 text-xs tabular-nums text-[var(--muted)]">
          {current} / {need} XP para o próximo nível
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {state.progress.streak >= 3 && <Badge icon={<Flame />} label="3 dias" />}
          {state.progress.streak >= 7 && <Badge icon={<Trophy />} label="7 dias" />}
          {state.progress.doneCount >= 10 && <Badge icon={<Star />} label="10 quests" />}
          {level >= 5 && <Badge icon={<Swords />} label="Nv 5+" />}
        </div>
      </Card>

      <Card className="p-5">
        <p className="eyebrow">Hoje</p>
        <p className="mt-1 font-display text-4xl font-semibold text-[var(--text)]">
          {state.today.done}
          <span className="text-lg text-[var(--muted)]">/{state.today.total}</span>
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          <Flame className="mr-1 inline h-3.5 w-3.5 text-[var(--accent-strong)]" />
          sequência de {state.progress.streak} {state.progress.streak === 1 ? 'dia' : 'dias'}
        </p>
        <p className="mt-2 text-xs font-medium text-[var(--muted)]">
          Meta {goal}/dia —{' '}
          {goalHit ? (
            <span className="text-[var(--ok)]">batida. Bom trabalho.</span>
          ) : (
            <span>faltam {goal - state.today.done}.</span>
          )}
        </p>
      </Card>

      <Card className="p-5">
        <p className="eyebrow">Jornada</p>
        <p className="mt-1 font-display text-4xl font-semibold text-[var(--text)]">
          {state.progress.doneCount}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">quests concluídas no total</p>
        <motion.p
          key={state.progress.totalXp}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          className="chip-accent mt-3 inline-block rounded-md px-2 py-1 text-xs font-bold"
        >
          Rank: {rank}
        </motion.p>
      </Card>
    </div>
  )
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--hover)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text)] [&_svg]:h-3 [&_svg]:w-3 [&_svg]:text-[var(--accent-strong)]">
      {icon}
      {label}
    </span>
  )
}
