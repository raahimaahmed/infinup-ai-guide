import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useToast } from "@/hooks/use-toast";
import { Coins, Zap, Crown, Loader2 } from "lucide-react";

const PACKS = [
  { id: "starter", name: "Starter", credits: 5, price: "$4.99", perCredit: "$1.00", icon: Coins },
  { id: "popular", name: "Popular", credits: 15, price: "$9.99", perCredit: "$0.67", icon: Zap, featured: true },
  { id: "power", name: "Power", credits: 50, price: "$24.99", perCredit: "$0.50", icon: Crown },
];

const Credits = () => {
  const { user, loading: authLoading } = useAuth();
  const { balance, loading: creditsLoading, checkout, refetch } = useCredits();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({ title: "Payment Successful! 🎉", description: "Your credits have been added." });
      refetch();
    } else if (searchParams.get("canceled") === "true") {
      toast({ title: "Payment Canceled", description: "No charges were made.", variant: "destructive" });
    }
  }, [searchParams, toast, refetch]);

  const handleBuy = async (packId: string) => {
    try {
      await checkout(packId);
    } catch {
      toast({ title: "Error", description: "Could not start checkout. Please try again.", variant: "destructive" });
    }
  };

  if (authLoading || creditsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container max-w-4xl px-4 py-12 space-y-10">
        {/* Balance */}
        <div className="text-center space-y-2">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Your Credit Balance</p>
          <p className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {balance ?? 0}
          </p>
          <p className="text-muted-foreground">credits remaining</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKS.map((pack) => {
            const Icon = pack.icon;
            return (
              <div
                key={pack.id}
                className={`relative rounded-2xl border p-6 space-y-4 text-center transition-shadow hover:shadow-lg ${
                  pack.featured
                    ? "border-primary shadow-md ring-2 ring-primary/20"
                    : "border-border"
                }`}
              >
                {pack.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Best Value
                  </span>
                )}
                <Icon className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-xl font-bold">{pack.name}</h3>
                <p className="text-3xl font-bold">{pack.price}</p>
                <p className="text-sm text-muted-foreground">
                  {pack.credits} credits • {pack.perCredit} each
                </p>
                <Button
                  onClick={() => handleBuy(pack.id)}
                  className={`w-full ${pack.featured ? "bg-gradient-primary hover:opacity-90" : ""}`}
                  variant={pack.featured ? "default" : "outline"}
                >
                  Buy {pack.credits} Credits
                </Button>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>Each learning plan generation costs 1 credit.</p>
          <p>New accounts start with 3 free credits.</p>
        </div>
      </div>
    </div>
  );
};

export default Credits;
