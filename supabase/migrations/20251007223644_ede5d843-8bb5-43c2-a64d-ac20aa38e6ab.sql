-- Fix security warnings from linter

-- 1. Fix the feedback_analytics view to not use SECURITY DEFINER
DROP VIEW IF EXISTS public.feedback_analytics;

CREATE OR REPLACE VIEW public.feedback_analytics 
WITH (security_invoker = true)
AS
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

-- 2. Fix the get_feedback_insights function to have a stable search_path
DROP FUNCTION IF EXISTS public.get_feedback_insights(TEXT, INTEGER, INTEGER);

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.get_feedback_insights TO anon, authenticated;