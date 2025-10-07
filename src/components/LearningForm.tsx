import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

interface LearningFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

export interface FormData {
  topic: string;
  level: "beginner" | "intermediate" | "advanced";
  weeks: number;
  hoursPerWeek: number;
}

export const LearningForm = ({ onSubmit, isLoading }: LearningFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    topic: "",
    level: "intermediate",
    weeks: 3,
    hoursPerWeek: 8,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.topic.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-subtle">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Learn Anything.{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Infinitely Upward.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            AI-powered study plans tailored to your time and level
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-2xl shadow-lg border">
          <div className="space-y-2 text-left">
            <Label htmlFor="topic" className="text-base font-medium">
              What do you want to learn?
            </Label>
            <Input
              id="topic"
              type="text"
              placeholder="What do you want to learn?"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="h-14 text-lg"
              required
            />
            <p className="text-sm text-muted-foreground">
              e.g., Python Programming, Italian Cooking, Digital Marketing
            </p>
          </div>

          <div className="space-y-3 text-left">
            <Label className="text-base font-medium">Your Level</Label>
            <RadioGroup
              value={formData.level}
              onValueChange={(value) => setFormData({ ...formData, level: value as FormData["level"] })}
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                <RadioGroupItem value="beginner" id="beginner" />
                <Label htmlFor="beginner" className="flex-1 cursor-pointer">
                  <div className="font-medium">Beginner</div>
                  <div className="text-sm text-muted-foreground">Starting from scratch</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                <RadioGroupItem value="intermediate" id="intermediate" />
                <Label htmlFor="intermediate" className="flex-1 cursor-pointer">
                  <div className="font-medium">Intermediate</div>
                  <div className="text-sm text-muted-foreground">I know the basics</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                <RadioGroupItem value="advanced" id="advanced" />
                <Label htmlFor="advanced" className="flex-1 cursor-pointer">
                  <div className="font-medium">Advanced</div>
                  <div className="text-sm text-muted-foreground">Deep expertise</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="space-y-2">
              <Label htmlFor="weeks" className="text-base font-medium">
                Duration (Weeks)
              </Label>
              <Input
                id="weeks"
                type="number"
                min="1"
                max="52"
                value={formData.weeks}
                onChange={(e) => setFormData({ ...formData, weeks: parseInt(e.target.value) || 1 })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours" className="text-base font-medium">
                Hours per Week
              </Label>
              <Input
                id="hours"
                type="number"
                min="1"
                max="40"
                value={formData.hoursPerWeek}
                onChange={(e) => setFormData({ ...formData, hoursPerWeek: parseInt(e.target.value) || 1 })}
                className="h-12"
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity"
            disabled={isLoading || !formData.topic.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate My Learning Plan"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
