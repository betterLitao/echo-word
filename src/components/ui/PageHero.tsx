import type { ReactNode } from 'react'

interface PageHeroProps {
  eyebrow: string
  title: string
  description: string
  meta?: ReactNode
}

export function PageHero({ description, eyebrow, meta, title }: PageHeroProps) {
  return (
    <div className="grid gap-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.7))] p-6 shadow-[0_32px_80px_-32px_rgba(2,6,23,0.88)] shadow-slate-950/80 backdrop-blur-2xl lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)] lg:p-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-emerald-300/88">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-5xl md:leading-[1.02]">
          {title}
        </h1>
        <p className="mt-5 max-w-[65ch] text-base leading-8 text-slate-300">{description}</p>
      </div>
      <div className="flex items-end lg:justify-end">{meta}</div>
    </div>
  )
}
