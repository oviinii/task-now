import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function XpProgress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-[var(--deep)] ring-1 ring-[var(--border)]', className)}>
      <motion.div
        className="xp-fill h-full rounded-full"
        initial={false}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ type: 'spring', stiffness: 90, damping: 20 }}
      />
    </div>
  )
}
