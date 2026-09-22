import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

export function Toast({ msg }: { msg: string | null }) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {msg && (
          <motion.div
            key={msg}
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0 }}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text)] shadow-card"
          >
            <CheckCircle2 className="h-4 w-4 text-[var(--accent-strong)]" />
            <span>{msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
