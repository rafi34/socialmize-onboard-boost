import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { XPDisplay } from "@/components/onboarding/XPDisplay";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { ShootingPreference } from "@/types/onboarding";
import { ONBOARDING_STEPS } from "@/types/onboarding";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

export const ShootingModeStep = () => {
  const { onboardingAnswers, updateAnswer, nextStep, previousStep, currentStep } = useOnboarding();
  const [selected, setSelected] = useState<ShootingPreference | null>(onboardingAnswers.shooting_preference);
  const [date, setDate] = useState<Date | undefined>(onboardingAnswers.shooting_schedule || undefined);
  const [reminder, setReminder] = useState<boolean>(onboardingAnswers.shooting_reminder || false);
  
  const currentStepData = ONBOARDING_STEPS[currentStep];

  const handleSelect = (value: ShootingPreference) => {
    setSelected(value);
    updateAnswer("shooting_preference", value);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate || undefined);
    updateAnswer("shooting_schedule", selectedDate || null);
  };

  const handleReminderToggle = (checked: boolean) => {
    setReminder(checked);
    updateAnswer("shooting_reminder", checked);
  };

  const handleNext = () => {
    if (selected) {
      nextStep();
    }
  };

  return (
    
    <div className="onboarding-card">
      <div className="flex justify-between items-center">
        <div className="text-xl font-semibold">{currentStepData.title}</div>
        <XPDisplay />
      </div>

      <h2 className="text-2xl font-bold mt-4 mb-6">How do you film your content?</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div
          className={`option-card flex flex-col items-center justify-center py-8 transition-all duration-200 hover:shadow-md ${selected === "bulk_shooting" ? "selected bg-socialmize-light-purple border-socialmize-purple" : "bg-white"}`}
          onClick={() => handleSelect("bulk_shooting")}
        >
          <div className="text-4xl mb-2">📦</div>
          <div className="font-medium text-lg">Bulk Shooting</div>
          <div className="text-sm text-muted-foreground">Film multiple videos at once</div>
        </div>
        
        <div
          className={`option-card flex flex-col items-center justify-center py-8 transition-all duration-200 hover:shadow-md ${selected === "single_video" ? "selected bg-socialmize-light-purple border-socialmize-purple" : "bg-white"}`}
          onClick={() => handleSelect("single_video")}
        >
          <div className="text-4xl mb-2">🎥</div>
          <div className="font-medium text-lg">Single Video</div>
          <div className="text-sm text-muted-foreground">One video at a time</div>
        </div>
      </div>
      
      {selected === "bulk_shooting" && (
        <div className="bg-socialmize-light-purple rounded-xl p-5 mb-6 shadow-sm">
          <div className="font-medium mb-2 text-lg">When is your next shooting day?</div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal mb-4 bg-white hover:bg-white/90"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          <div className="flex items-center justify-between bg-white p-3 rounded-lg">
            <span className="font-medium">Remind me</span>
            <Switch checked={reminder} onCheckedChange={handleReminderToggle} />
          </div>
        </div>
      )}
      
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={previousStep}
        >
          Back
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!selected}
          className="bg-socialmize-purple hover:bg-socialmize-dark-purple text-white"
        >
          Next
        </Button>
      </div>
      
      <ProgressBar />
    </div>
  );
};
