import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { LearningForm, FormData } from "@/components/LearningForm";
import { LoadingScreen } from "@/components/LoadingScreen";
import { LearningPlan, Plan } from "@/components/LearningPlan";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import type { GeneratedPlan, StoredPlan } from "@/types/plan";

const STORAGE_KEY = "infinup_plan";
const SESSION_ID_KEY = "infinup_session_id";

const Index = () => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance, deductCredit } = useCredits();
  const navigate = useNavigate();
  const { saveToggle, loadProgress, isLoggedIn } = useProgress(plan?.topic);

  // Initialize session ID for feedback tracking
  useEffect(() => {
    if (!localStorage.getItem(SESSION_ID_KEY)) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
  }, []);

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

  // Load progress from database when user logs in or plan changes
  useEffect(() => {
    if (!isLoggedIn || !plan) return;

    loadProgress().then((completedIds) => {
      if (completedIds.size === 0) return;

      setPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          weekData: prev.weekData.map((week) => ({
            ...week,
            resources: week.resources.map((r) => ({
              ...r,
              completed: completedIds.has(r.id) || r.completed,
            })),
          })),
        };
      });
    });
  }, [isLoggedIn, plan?.topic, loadProgress]);

  // Save plan to localStorage whenever it changes
  useEffect(() => {
    if (plan) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    }
  }, [plan]);

  const handleFormSubmit = async (formData: FormData) => {
    // Credit check for logged-in users
    if (user && (balance === null || balance <= 0)) {
      toast({
        title: "No Credits Remaining",
        description: "Purchase more credits to generate a learning plan.",
        variant: "destructive",
      });
      navigate("/credits");
      return;
    }

    setIsLoading(true);

    try {
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

      if (!response.ok) throw new Error("Failed to generate plan");

      const data = await response.json();
      const generatedPlan = data.plan as GeneratedPlan;

      const newPlan: Plan = {
        topic: generatedPlan.topic,
        level: formData.level,
        weeks: formData.weeks,
        hoursPerWeek: formData.hoursPerWeek,
        weekData: generatedPlan.weeks,
      };

      setPlan(newPlan);

      // Deduct credit for logged-in users
      if (user) {
        await deductCredit();

        await supabase.from("user_plans").insert([{
          user_id: user.id,
          topic: newPlan.topic,
          level: newPlan.level,
          weeks: newPlan.weeks,
          hours_per_week: newPlan.hoursPerWeek,
          plan_data: { weeks: newPlan.weekData } as any,
        }]);
      }

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

      const updatedPlan = {
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

      // Find the toggled resource to get its new state
      const toggledWeek = updatedPlan.weekData.find((w) => w.weekNumber === weekNumber);
      const toggledResource = toggledWeek?.resources.find((r) => r.id === resourceId);
      if (toggledResource) {
        saveToggle(resourceId, weekNumber, toggledResource.completed);
      }

      return updatedPlan;
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

  if (isLoading) return <LoadingScreen />;

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
