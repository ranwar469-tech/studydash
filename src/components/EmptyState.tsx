import type { ReactNode } from 'react'

interface Props {
  icon?: ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon || (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 ring-1 ring-slate-700">
          <svg className="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-300 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-2xl bg-[#f97316] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:bg-[#fb923c]"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
