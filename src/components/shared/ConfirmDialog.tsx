import { Button } from './Button'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="overlay-scrim fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="dialog-surface w-full max-w-md rounded-3xl border p-4 shadow-xl sm:p-6">
        <h3 className="font-display text-xl font-semibold text-ink-50">{title}</h3>
        <p className="mt-2 text-sm text-ink-300">{description}</p>
        <div className="mt-6 flex gap-3">
          <Button onClick={onConfirm} className="flex-1">
            {confirmLabel}
          </Button>
          <Button onClick={onCancel} variant="ghost" className="flex-1">
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
