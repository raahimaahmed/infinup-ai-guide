import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import type { Plan } from "./LearningPlan";

interface FeedbackDialogProps {
  plan: Plan;
  trigger?: React.ReactNode;
}

export function FeedbackDialog({ plan, trigger }: FeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Rating states
  const [overallRating, setOverallRating] = useState<number>(0);
  const [resourceQualityRating, setResourceQualityRating] = useState<number>(0);
  const [progressionRating, setProgressionRating] = useState<number>(0);
  const [relevanceRating, setRelevanceRating] = useState<number>(0);

  // Text feedback
  const [feedbackText, setFeedbackText] = useState("");
  const [whatWorkedWell, setWhatWorkedWell] = useState("");
  const [whatNeedsImprovement, setWhatNeedsImprovement] = useState("");

  const StarRating = ({
    rating,
    onRatingChange,
    label,
  }: {
    rating: number;
    onRatingChange: (rating: number) => void;
    label: string;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="transition-colors"
          >
            <Star
              className={`h-6 w-6 ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const calculateMetrics = () => {
    const totalResources = plan.weekData.reduce(
      (sum, week) => sum + week.resources.length,
      0
    );
    const completedResources = plan.weekData.reduce(
      (sum, week) => sum + week.resources.filter((r) => r.completed).length,
      0
    );
    const completionPercentage = totalResources > 0
      ? (completedResources / totalResources) * 100
      : 0;

    return {
      totalResources,
      completedResources,
      completionPercentage: parseFloat(completionPercentage.toFixed(2)),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (overallRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide an overall rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const metrics = calculateMetrics();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            topic: plan.topic,
            level: plan.level,
            weeks: plan.weeks,
            hoursPerWeek: plan.hoursPerWeek,
            overallRating,
            resourceQualityRating: resourceQualityRating || null,
            progressionRating: progressionRating || null,
            relevanceRating: relevanceRating || null,
            feedbackText: feedbackText || null,
            whatWorkedWell: whatWorkedWell || null,
            whatNeedsImprovement: whatNeedsImprovement || null,
            totalResources: metrics.totalResources,
            resourcesCompleted: metrics.completedResources,
            completionPercentage: metrics.completionPercentage,
            userSessionId: localStorage.getItem("infinup_session_id") || undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      const data = await response.json();

      toast({
        title: "Feedback Submitted!",
        description: data.message || "Thank you for helping us improve!",
      });

      // Reset form and close dialog
      setOverallRating(0);
      setResourceQualityRating(0);
      setProgressionRating(0);
      setRelevanceRating(0);
      setFeedbackText("");
      setWhatWorkedWell("");
      setWhatNeedsImprovement("");
      setOpen(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Submission Failed",
        description: "Unable to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Give Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How was your learning plan?</DialogTitle>
          <DialogDescription>
            Your feedback helps us improve AI-generated learning plans for everyone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <div className="space-y-4">
            <StarRating
              rating={overallRating}
              onRatingChange={setOverallRating}
              label="Overall Plan Quality *"
            />

            {/* Detailed Ratings */}
            <StarRating
              rating={resourceQualityRating}
              onRatingChange={setResourceQualityRating}
              label="Resource Quality (optional)"
            />

            <StarRating
              rating={progressionRating}
              onRatingChange={setProgressionRating}
              label="Learning Progression (optional)"
            />

            <StarRating
              rating={relevanceRating}
              onRatingChange={setRelevanceRating}
              label="Topic Relevance (optional)"
            />
          </div>

          {/* Text Feedback */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="worked-well">What worked well?</Label>
              <Textarea
                id="worked-well"
                placeholder="Tell us what you liked about this learning plan..."
                value={whatWorkedWell}
                onChange={(e) => setWhatWorkedWell(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="needs-improvement">What could be improved?</Label>
              <Textarea
                id="needs-improvement"
                placeholder="Share suggestions for making this plan better..."
                value={whatNeedsImprovement}
                onChange={(e) => setWhatNeedsImprovement(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="general-feedback">Additional Comments</Label>
              <Textarea
                id="general-feedback"
                placeholder="Any other feedback you'd like to share..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || overallRating === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
