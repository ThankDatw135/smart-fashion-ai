import { MapPin, CreditCard, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { title: "Thông tin", icon: MapPin },
    { title: "Thanh toán", icon: CreditCard },
    { title: "Hoàn tất", icon: CheckCircle2 },
  ];

  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-10 relative">
      {/* Roadmap Line */}
      <div className="absolute left-0 top-6 w-full h-[2px] bg-muted -z-10" />
      <div 
        className="absolute left-0 top-6 h-[2px] bg-primary -z-10 transition-all duration-500" 
        style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
      />

      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        const Icon = step.icon;

        return (
          <div key={step.title} className="flex flex-col items-center gap-2">
            <div 
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center border-2 bg-background transition-colors duration-300",
                isActive ? "border-primary text-primary shadow-sm" : 
                isCompleted ? "border-primary bg-primary text-primary-foreground" : "border-muted text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className={cn(
              "text-sm font-medium",
              isActive ? "text-primary" : 
              isCompleted ? "text-foreground" : "text-muted-foreground"
            )}>
              {step.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}
