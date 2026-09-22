// Magic UI–style NumberTicker (leve, sem dependência extra)
import { useEffect, useRef, useState } from 'react'

export function NumberTicker({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    const from = prev.current
    const to = value
    if (from === to) return
    const start = performance.now()
    const dur = 600
    let raf: number
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else prev.current = to
    }
    raf = requestAnimationFrame(tick)
    prev.current = to
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <span className={className}>{display.toLocaleString('pt-BR')}</span>
}
