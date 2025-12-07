"use client"

interface StepperProps {
  currentStep: number
  steps: string[]
}

export function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  ${index < currentStep ? 'bg-primary text-primary-foreground' : ''}
                  ${index === currentStep ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : ''}
                  ${index > currentStep ? 'bg-muted text-muted-foreground' : ''}
                `}
              >
                {index + 1}
              </div>
              <span className={`text-xs mt-2 font-medium ${index === currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-4 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
