import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-4',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--accent)] text-[var(--on-accent)] hover:brightness-110 glow font-bold',
        secondary:
          'border border-[var(--border)] text-[var(--text)] hover:bg-[var(--hover)]',
        ghost: 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--hover)]',
        danger: 'bg-red-500/90 text-white hover:bg-red-500',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3 text-[13px]',
        lg: 'h-11 px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
)
Button.displayName = 'Button'
