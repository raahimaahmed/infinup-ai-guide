import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FeedbackRequest {
  // Plan metadata
  topic: string;
  level: string;
  weeks: number;
  hoursPerWeek: number;

  // User ratings
  overallRating?: number;
  resourceQualityRating?: number;
  progressionRating?: number;
  relevanceRating?: number;

  // Qualitative feedback
  feedbackText?: string;
  whatWorkedWell?: string;
  whatNeedsImprovement?: string;

  // Resource metrics
  totalResources?: number;
  validResources?: number;
  invalidResources?: number;
  resourcesCompleted?: number;
  completionPercentage?: number;

  // Optional session tracking
  userSessionId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const feedbackData: FeedbackRequest = await req.json();

    console.log('Submitting feedback for:', feedbackData.topic);

    // Insert feedback into database
    const { data, error } = await supabase
      .from('plan_feedback')
      .insert({
        topic: feedbackData.topic,
        level: feedbackData.level,
        weeks: feedbackData.weeks,
        hours_per_week: feedbackData.hoursPerWeek,
        overall_rating: feedbackData.overallRating,
        resource_quality_rating: feedbackData.resourceQualityRating,
        progression_rating: feedbackData.progressionRating,
        relevance_rating: feedbackData.relevanceRating,
        feedback_text: feedbackData.feedbackText,
        what_worked_well: feedbackData.whatWorkedWell,
        what_needs_improvement: feedbackData.whatNeedsImprovement,
        total_resources: feedbackData.totalResources,
        valid_resources: feedbackData.validResources,
        invalid_resources: feedbackData.invalidResources,
        resources_completed: feedbackData.resourcesCompleted,
        completion_percentage: feedbackData.completionPercentage,
        user_session_id: feedbackData.userSessionId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting feedback:', error);
      throw error;
    }

    console.log('Feedback submitted successfully:', data.id);

    // Get aggregated insights for this topic to return to user
    const { data: insights, error: insightsError } = await supabase
      .rpc('get_feedback_insights', { p_topic: feedbackData.topic });

    if (insightsError) {
      console.warn('Could not fetch insights:', insightsError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        feedbackId: data.id,
        message: 'Thank you for your feedback! It will help improve future learning plans.',
        insights: insights || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-feedback:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
