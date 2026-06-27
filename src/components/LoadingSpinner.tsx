interface Props {
  label?: string
  className?: string
}

export default function LoadingSpinner({ label = 'Loading...', className = '' }: Props) {
  return (
    <div className={`flex min-h-[220px] w-full flex-col items-center justify-center gap-4 px-6 text-center ${className}`}>
      <div className="flex gap-2">
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#f97316]" style={{ animationDelay: '0ms' }} />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#f97316]" style={{ animationDelay: '150ms' }} />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#f97316]" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="text-sm font-medium text-slate-400">{label}</p>
    </div>
  )
}
