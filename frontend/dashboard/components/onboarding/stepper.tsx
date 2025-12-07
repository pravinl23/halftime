"use client"

interface StepperProps {
  currentStep: number
  steps: string[]
}

export function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="w-full flex justify-center mb-6">
      <div className="flex items-center justify-center max-w-2xl">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-12 h-12  flex items-center justify-center font-bold text-sm transition-all
                  ${index < currentStep ? 'bg-white text-black border border-white/50' : ''}
                  ${index === currentStep ? 'bg-neutral-700 text-white border border-white/40 ring-4 ring-white/20' : ''}
                  ${index > currentStep ? 'bg-neutral-800 text-white/60 border border-white/30' : ''}
                `}
              >
                {index + 1}
              </div>
              <span className={`text-xs mt-2 font-medium whitespace-nowrap ${index === currentStep ? 'text-white' : 'text-white/60'}`}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 mx-4  transition-all w-24 ${index < currentStep ? 'bg-white' : 'bg-white/20'}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
