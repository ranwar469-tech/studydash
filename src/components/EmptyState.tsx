import type { ReactNode } from 'react'

interface Props {
  icon?: ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void; disabled?: boolean }
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      {icon || (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 ring-1 ring-slate-700">
          <svg className="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-200">{title}</h3>
        <p className="text-sm text-slate-500 max-w-xs">{description}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          disabled={action.disabled}
          className="rounded-2xl bg-[#f97316] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:bg-[#fb923c] disabled:opacity-50"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
