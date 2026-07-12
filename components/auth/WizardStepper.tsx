import React from 'react';

export interface WizardStep {
  id: string;
  title: string;
  hint: string;
}

interface WizardStepperProps {
  steps: WizardStep[];
  currentIndex: number;
}

const WizardStepper: React.FC<WizardStepperProps> = ({ steps, currentIndex }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between relative">
      <div
        className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-slate-600 -z-0 mx-8"
        aria-hidden
      />
      <div
        className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 -z-0 mx-8 transition-all duration-500"
        style={{ width: steps.length > 1 ? `${(currentIndex / (steps.length - 1)) * 100}%` : '0%' }}
        aria-hidden
      />
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <div key={step.id} className="flex flex-col items-center flex-1 z-10 min-w-0 px-1">
            <div
              className={[
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                done
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-300/40'
                  : active
                    ? 'bg-white dark:bg-slate-800 text-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/50 shadow-md scale-110'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-400',
              ].join(' ')}
            >
              {done ? '✓' : index + 1}
            </div>
            <p
              className={`mt-2 text-[10px] font-bold uppercase tracking-tight text-center truncate w-full ${
                active ? 'text-blue-600 dark:text-blue-400' : done ? 'text-gray-600' : 'text-gray-400'
              }`}
            >
              {step.title}
            </p>
          </div>
        );
      })}
    </div>
    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
      {steps[currentIndex]?.hint}
    </p>
  </div>
);

export default WizardStepper;
