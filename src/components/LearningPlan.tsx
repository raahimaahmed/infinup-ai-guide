import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WeekSection } from "./WeekSection";
import { EmailDialog } from "./EmailDialog";
import { FeedbackSection } from "./FeedbackSection";
import { FeedbackDialog } from "./FeedbackDialog";
import { Mail, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";

interface Resource {
  id: number;
  type: "video" | "reading" | "interactive" | "project";
  title: string;
  source: string;
  url: string;
  duration: string;
  description: string;
  completed: boolean;
}

interface Week {
  weekNumber: number;
  theme: string;
  resources: Resource[];
}

export interface Plan {
  topic: string;
  level: string;
  weeks: number;
  hoursPerWeek: number;
  weekData: Week[];
}

interface LearningPlanProps {
  plan: Plan;
  onToggleResource: (weekNumber: number, resourceId: number) => void;
  onReset: () => void;
}

export const LearningPlan = ({ plan, onToggleResource, onReset }: LearningPlanProps) => {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const { toast } = useToast();

  const totalResources = plan.weekData.reduce((acc, week) => acc + week.resources.length, 0);
  const completedResources = plan.weekData.reduce(
    (acc, week) => acc + week.resources.filter((r) => r.completed).length,
    0
  );

  const celebrateCompletion = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0066FF', '#00D084'],
    });
  };

  const handleToggleResource = (weekNumber: number, resourceId: number) => {
    onToggleResource(weekNumber, resourceId);

    // Check if this completes a week
    const week = plan.weekData.find((w) => w.weekNumber === weekNumber);
    if (week) {
      const willBeCompleted = week.resources.filter(
        (r) => r.completed || r.id === resourceId
      ).length === week.resources.length;

      if (willBeCompleted) {
        setTimeout(() => {
          celebrateCompletion();
          toast({
            title: "🎉 Week Complete!",
            description: `Congratulations on completing Week ${weekNumber}!`,
          });
        }, 300);
      }
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <EmailDialog 
        plan={plan} 
        open={emailDialogOpen} 
        onOpenChange={setEmailDialogOpen} 
      />
      
      <div className="container max-w-4xl px-4 py-8 space-y-8">
        {/* Plan Details */}
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Your learning plan for</p>
            <h2 className="text-3xl font-bold text-foreground capitalize">{plan.topic}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {plan.level.charAt(0).toUpperCase() + plan.level.slice(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                {plan.hoursPerWeek} hrs/week • {plan.weeks} weeks
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setEmailDialogOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Email This Plan
            </Button>
            <FeedbackDialog plan={plan} />
            <Button
              onClick={onReset}
              variant="default"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Start New Plan
            </Button>
          </div>
        </div>

        {/* Week Sections */}
        <div className="space-y-4">
          {plan.weekData.map((week) => (
            <WeekSection
              key={week.weekNumber}
              week={week}
              onToggleResource={handleToggleResource}
            />
          ))}
        </div>

        {/* Completion Message */}
        {completedResources === totalResources && totalResources > 0 && (
          <div className="text-center p-8 bg-gradient-primary rounded-2xl text-white">
            <h2 className="text-3xl font-bold mb-2">🎉 Congratulations!</h2>
            <p className="text-lg opacity-90">
              You've completed your learning journey! Keep growing infinitely upward.
            </p>
          </div>
        )}
      </div>

    
    </div>
  );
};
