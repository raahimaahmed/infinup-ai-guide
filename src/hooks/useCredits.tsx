import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useCredits() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching credits:", error);
    }
    
    setBalance(data?.balance ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const deductCredit = async (): Promise<boolean> => {
    if (!user || balance === null || balance <= 0) return false;

    const { error: updateError } = await supabase
      .from("user_credits")
      .update({ balance: balance - 1 })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error deducting credit:", updateError);
      return false;
    }

    // Log the usage transaction
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -1,
      type: "usage",
      description: "Generated a learning plan",
    });

    setBalance((prev) => (prev !== null ? prev - 1 : null));
    return true;
  };

  const checkout = async (packId: string) => {
    if (!user) return;

    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { packId },
    });

    if (error) throw error;
    if (data?.url) {
      window.open(data.url, "_blank");
    }
  };

  return { balance, loading, deductCredit, checkout, refetch: fetchBalance };
}
