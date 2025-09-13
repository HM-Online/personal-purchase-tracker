'use client';

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  processing?: boolean;
};

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  processing = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={() => !processing && onCancel()} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-xl text-white">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-neutral-300">{message}</p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={processing}
            className="inline-flex items-center rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/5 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={processing}
            className="inline-flex items-center rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition-shadow hover:shadow-[0_0_8px] hover:shadow-red-500/70"
          >
            {processing ? 'Working…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
