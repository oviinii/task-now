import { AnimatePresence, motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { rankFor } from '@/lib/levels'

export function LevelUp({ level, onClose }: { level: number | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {level !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="glow w-full max-w-sm rounded-3xl border border-[var(--accent-ring)] bg-[var(--surface-solid)] p-8 text-center"
          >
            <motion.div
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
              className="mark mx-auto h-14 w-14 rounded-2xl"
            >
              <Crown className="h-7 w-7" />
            </motion.div>
            <h2 className="mt-4 font-display text-3xl text-[var(--text)]">Nível {level}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Rank alcançado: {rankFor(level)}</p>
            <Button className="mt-6 w-full" onClick={onClose}>
              Continuar a jornada
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
