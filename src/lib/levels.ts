export const RANKS: [number, string][] = [
  [1, 'Iniciante'],
  [5, 'Aventureiro'],
  [10, 'Veterano'],
  [20, 'Herói'],
  [30, 'Lenda'],
  [50, 'Mito'],
]

export function levelForXp(total: number) {
  let level = 1, need = 100, acc = 0
  while (acc + need <= total) {
    acc += need
    level++
    need = Math.round(need * 1.2)
  }
  return { level, current: total - acc, need }
}

export function rankFor(level: number) {
  let r = RANKS[0][1]
  for (const [n, name] of RANKS) if (level >= n) r = name
  return r
}
