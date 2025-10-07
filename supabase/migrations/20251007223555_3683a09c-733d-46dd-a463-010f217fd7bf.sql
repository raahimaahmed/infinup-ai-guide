-- Create feedback table to collect user ratings and improve AI prompts
CREATE TABLE IF NOT EXISTS public.plan_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Plan metadata
  topic TEXT NOT NULL,
  level TEXT NOT NULL,
  weeks INTEGER NOT NULL,
  hours_per_week INTEGER NOT NULL,

  -- User feedback
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  resource_quality_rating INTEGER CHECK (resource_quality_rating >= 1 AND resource_quality_rating <= 5),
  progression_rating INTEGER CHECK (progression_rating >= 1 AND progression_rating <= 5),
  relevance_rating INTEGER CHECK (relevance_rating >= 1 AND relevance_rating <= 5),

  -- Qualitative feedback
  feedback_text TEXT,
  what_worked_well TEXT,
  what_needs_improvement TEXT,

  -- Resource validation metrics
  total_resources INTEGER,
  valid_resources INTEGER,
  invalid_resources INTEGER,

  -- Plan completion tracking
  resources_completed INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2),

  -- User identification (optional, for tracking patterns)
  user_session_id TEXT,

  -- Metadata
  plan_generation_time_ms INTEGER,
  model_version TEXT DEFAULT 'gemini-2.5-flash',
  temperature DECIMAL(3,2) DEFAULT 0.5
);

-- Create index for querying feedback by topic
CREATE INDEX IF NOT EXISTS idx_plan_feedback_topic ON public.plan_feedback(topic);

-- Create index for querying by rating
CREATE INDEX IF NOT EXISTS idx_plan_feedback_rating ON public.plan_feedback(overall_rating);

-- Create index for querying by date
CREATE INDEX IF NOT EXISTS idx_plan_feedback_created_at ON public.plan_feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.plan_feedback ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert feedback
CREATE POLICY "Allow public insert feedback" ON public.plan_feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Create policy to allow reading aggregated feedback (for analytics)
CREATE POLICY "Allow read feedback" ON public.plan_feedback
  FOR SELECT TO anon, authenticated
  USING (true);

-- Create a view for aggregated feedback analytics
CREATE OR REPLACE VIEW public.feedback_analytics AS
SELECT
  topic,
  level,
  COUNT(*) as total_feedback,
  AVG(overall_rating) as avg_overall_rating,
  AVG(resource_quality_rating) as avg_resource_quality,
  AVG(progression_rating) as avg_progression,
  AVG(relevance_rating) as avg_relevance,
  AVG(completion_percentage) as avg_completion,
  AVG(valid_resources::DECIMAL / NULLIF(total_resources, 0) * 100) as avg_url_success_rate,
  MIN(created_at) as first_feedback,
  MAX(created_at) as last_feedback
FROM public.plan_feedback
WHERE overall_rating IS NOT NULL
GROUP BY topic, level
ORDER BY total_feedback DESC, avg_overall_rating DESC;

-- Grant access to the view
GRANT SELECT ON public.feedback_analytics TO anon, authenticated;

-- Create function to get improvement suggestions based on feedback
CREATE OR REPLACE FUNCTION public.get_feedback_insights(
  p_topic TEXT DEFAULT NULL,
  p_min_rating INTEGER DEFAULT 1,
  p_max_rating INTEGER DEFAULT 5
)
RETURNS TABLE (
  topic TEXT,
  avg_rating DECIMAL,
  common_improvements TEXT,
  sample_size BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pf.topic,
    AVG(pf.overall_rating) as avg_rating,
    STRING_AGG(DISTINCT pf.what_needs_improvement, '; ') as common_improvements,
    COUNT(*) as sample_size
  FROM public.plan_feedback pf
  WHERE
    (p_topic IS NULL OR pf.topic ILIKE '%' || p_topic || '%')
    AND pf.overall_rating BETWEEN p_min_rating AND p_max_rating
    AND pf.what_needs_improvement IS NOT NULL
  GROUP BY pf.topic
  HAVING COUNT(*) >= 2  -- At least 2 feedback entries
  ORDER BY avg_rating ASC, sample_size DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.get_feedback_insights TO anon, authenticated;