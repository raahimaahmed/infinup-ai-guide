import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { LearningForm, FormData } from "@/components/LearningForm";
import { LoadingScreen } from "@/components/LoadingScreen";
import { LearningPlan, Plan } from "@/components/LearningPlan";
import { useToast } from "@/hooks/use-toast";
import type { GeneratedPlan, StoredPlan } from "@/types/plan";

const STORAGE_KEY = "infinup_plan";

const Index = () => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load plan from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredPlan;
        setPlan(parsed);
      } catch (error) {
        console.error("Failed to parse stored plan:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save plan to localStorage whenever it changes
  useEffect(() => {
    if (plan) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    }
  }, [plan]);

  const handleFormSubmit = async (formData: FormData) => {
    setIsLoading(true);

    try {
      // Call AI API to generate plan
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-learning-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            topic: formData.topic,
            level: formData.level,
            weeks: formData.weeks,
            hoursPerWeek: formData.hoursPerWeek,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate plan");
      }

      const data = await response.json();
      const generatedPlan = data.plan as GeneratedPlan;

      // Convert to Plan format with metadata
      const newPlan: Plan = {
        topic: generatedPlan.topic,
        level: formData.level,
        weeks: formData.weeks,
        hoursPerWeek: formData.hoursPerWeek,
        weekData: generatedPlan.weeks,
      };

      setPlan(newPlan);
      toast({
        title: "Learning Plan Created!",
        description: "Your personalized learning path is ready.",
      });
    } catch (error) {
      console.error("Error generating plan:", error);
      toast({
        title: "Error",
        description: "Failed to generate learning plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleResource = (weekNumber: number, resourceId: number) => {
    if (!plan) return;

    setPlan((prevPlan) => {
      if (!prevPlan) return prevPlan;

      return {
        ...prevPlan,
        weekData: prevPlan.weekData.map((week) =>
          week.weekNumber === weekNumber
            ? {
                ...week,
                resources: week.resources.map((resource) =>
                  resource.id === resourceId
                    ? { ...resource, completed: !resource.completed }
                    : resource
                ),
              }
            : week
        ),
      };
    });
  };

  const handleReset = () => {
    setPlan(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const getProgress = () => {
    if (!plan) return undefined;

    const total = plan.weekData.reduce((acc, week) => acc + week.resources.length, 0);
    const completed = plan.weekData.reduce(
      (acc, week) => acc + week.resources.filter((r) => r.completed).length,
      0
    );

    return { completed, total };
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen">
      <Header progress={getProgress()} />
      {plan ? (
        <LearningPlan plan={plan} onToggleResource={handleToggleResource} onReset={handleReset} />
      ) : (
        <LearningForm onSubmit={handleFormSubmit} isLoading={isLoading} />
      )}
    </div>
  );
};

export default Index;
