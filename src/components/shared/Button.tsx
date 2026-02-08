import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const baseStyles =
  'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-500 text-ink-900 shadow-glow hover:bg-accent-400 focus-visible:outline-accent-400',
  ghost:
    'border border-ink-600 text-ink-100 hover:border-accent-500 hover:text-accent-400 focus-visible:outline-accent-400',
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    />
  )
}
