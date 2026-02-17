import { useEffect, useRef, useState } from 'react'

type DropdownOption = {
  value: string
  label: string
  description?: string
}

type DropdownProps = {
  value: string
  options: DropdownOption[]
  placeholder?: string
  disabled?: boolean
  onChange: (value: string) => void
  className?: string
}

export function Dropdown({
  value,
  options,
  placeholder = 'Selecciona...',
  disabled = false,
  onChange,
  className = '',
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const selected = options.find((option) => option.value === value) ?? null

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        className="select-field flex items-center justify-between text-left disabled:cursor-not-allowed disabled:opacity-60"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={selected ? 'text-ink-50' : 'text-ink-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="ml-3 text-xs text-ink-400">{open ? 'Cerrar' : 'Abrir'}</span>
      </button>
      {open && (
        <div
          role="listbox"
          className="dropdown-menu absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-auto rounded-2xl border shadow-xl backdrop-blur"
        >
          {options.map((option) => {
            const isActive = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`dropdown-item flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                  isActive ? 'is-active' : ''
                }`}
              >
                <span className="font-medium">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-ink-300">{option.description}</span>
                )}
              </button>
            )
          })}
          {options.length === 0 && (
            <div className="px-4 py-3 text-sm text-ink-300">No hay opciones.</div>
          )}
        </div>
      )}
    </div>
  )
}
