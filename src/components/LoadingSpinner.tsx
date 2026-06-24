interface Props {
  label?: string
}

export default function LoadingSpinner({ label }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="flex gap-1.5">
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#f97316]" style={{ animationDelay: '0ms' }} />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#f97316]" style={{ animationDelay: '150ms' }} />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#f97316]" style={{ animationDelay: '300ms' }} />
      </div>
      {label && <p className="text-sm font-medium text-slate-400">{label}</p>}
    </div>
  )
}
