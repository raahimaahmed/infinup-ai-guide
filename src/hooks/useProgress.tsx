import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useProgress = (topic: string | undefined) => {
  const { user } = useAuth();

  const saveToggle = useCallback(
    async (resourceId: number, weekNumber: number, completed: boolean) => {
      if (!user || !topic) return;

      if (completed) {
        await supabase.from("user_progress").upsert(
          {
            user_id: user.id,
            topic,
            resource_id: resourceId,
            week_number: weekNumber,
            completed: true,
          },
          { onConflict: "user_id,topic,resource_id" }
        );
      } else {
        await supabase
          .from("user_progress")
          .delete()
          .eq("user_id", user.id)
          .eq("topic", topic)
          .eq("resource_id", resourceId);
      }
    },
    [user, topic]
  );

  const loadProgress = useCallback(async (): Promise<Set<number>> => {
    if (!user || !topic) return new Set();

    const { data } = await supabase
      .from("user_progress")
      .select("resource_id")
      .eq("user_id", user.id)
      .eq("topic", topic);

    return new Set((data || []).map((r) => r.resource_id));
  }, [user, topic]);

  return { saveToggle, loadProgress, isLoggedIn: !!user };
};
