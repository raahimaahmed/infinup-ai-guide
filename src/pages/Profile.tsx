import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, ArrowRight, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SavedPlan {
  id: string;
  topic: string;
  level: string;
  weeks: number;
  hours_per_week: number;
  plan_data: any;
  created_at: string;
  progress?: { completed: number; total: number };
}

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchPlans = async () => {
      setLoading(true);

      // Fetch all saved plans
      const { data: plansData, error: plansError } = await supabase
        .from("user_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (plansError) {
        console.error("Error fetching plans:", plansError);
        setLoading(false);
        return;
      }

      // Fetch progress for all plans
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("topic, resource_id")
        .eq("user_id", user.id);

      // Build progress map by topic
      const progressMap = new Map<string, Set<number>>();
      (progressData || []).forEach((p) => {
        if (!progressMap.has(p.topic)) progressMap.set(p.topic, new Set());
        progressMap.get(p.topic)!.add(p.resource_id);
      });

      // Combine plans with progress
      const plansWithProgress = (plansData || []).map((plan) => {
        const weekData = (plan.plan_data as any)?.weeks || (plan.plan_data as any) || [];
        const totalResources = weekData.reduce(
          (acc: number, w: any) => acc + (w.resources?.length || 0),
          0
        );
        const completedIds = progressMap.get(plan.topic) || new Set();
        let completed = 0;
        weekData.forEach((w: any) => {
          (w.resources || []).forEach((r: any) => {
            if (completedIds.has(r.id)) completed++;
          });
        });

        return {
          ...plan,
          progress: { completed, total: totalResources },
        };
      });

      setPlans(plansWithProgress);
      setLoading(false);
    };

    fetchPlans();
  }, [user]);

  const handleDeletePlan = async (planId: string, topic: string) => {
    const { error } = await supabase
      .from("user_plans")
      .delete()
      .eq("id", planId);

    if (error) {
      toast.error("Failed to delete plan");
      return;
    }

    // Also delete progress for this topic
    await supabase
      .from("user_progress")
      .delete()
      .eq("user_id", user!.id)
      .eq("topic", topic);

    setPlans((prev) => prev.filter((p) => p.id !== planId));
    toast.success("Plan deleted");
  };

  const handleOpenPlan = (plan: SavedPlan) => {
    // Save plan to localStorage so Index page can load it
    const storedPlan = {
      topic: plan.topic,
      level: plan.level,
      weeks: plan.weeks,
      hoursPerWeek: plan.hours_per_week,
      weekData: (plan.plan_data as any)?.weeks || plan.plan_data,
    };
    localStorage.setItem("infinup_plan", JSON.stringify(storedPlan));
    navigate("/");
  };

  const getLevelEmoji = (level: string) => {
    switch (level) {
      case "beginner": return "🌱";
      case "intermediate": return "📊";
      case "advanced": return "🚀";
      default: return "📚";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container max-w-4xl px-4 py-8 space-y-8">
        {/* Profile Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">My Learning Dashboard</h1>
          <p className="text-muted-foreground">
            Track your progress across all your learning plans
          </p>
        </div>

        {/* Stats Overview */}
        {plans.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-primary">{plans.length}</p>
                <p className="text-sm text-muted-foreground">Learning Plans</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-secondary">
                  {plans.reduce((acc, p) => acc + (p.progress?.completed || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Resources Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">
                  {plans.reduce((acc, p) => acc + (p.progress?.total || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Resources</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Plans List */}
        {plans.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold">No learning plans yet</h2>
              <p className="text-muted-foreground">
                Generate your first plan and it will appear here!
              </p>
              <Button onClick={() => navigate("/")} className="gap-2">
                Create a Plan <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => {
              const pct = plan.progress?.total
                ? Math.round((plan.progress.completed / plan.progress.total) * 100)
                : 0;

              return (
                <Card
                  key={plan.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleOpenPlan(plan)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold">{plan.topic}</h3>
                          <span className="text-sm px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {getLevelEmoji(plan.level)} {plan.level}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {plan.weeks} weeks • {plan.hours_per_week} hrs/wk
                          </span>
                          <span>{formatDate(plan.created_at)}</span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {plan.progress?.completed}/{plan.progress?.total} resources
                            </span>
                            <span className="font-medium">{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <ArrowRight className="h-4 w-4" />
                          Open
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlan(plan.id, plan.topic);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
