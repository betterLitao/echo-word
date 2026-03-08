interface StepperProps {
  steps: string[]
  currentStep: number
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {steps.map((step, index) => {
        const active = index === currentStep
        const completed = index < currentStep
        return (
          <div key={step} className={active ? 'rounded-full bg-emerald-400/20 px-4 py-2 text-sm text-emerald-200' : completed ? 'rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-200' : 'rounded-full border border-white/10 px-4 py-2 text-sm text-slate-400'}>
            {index + 1}. {step}
          </div>
        )
      })}
    </div>
  )
}
