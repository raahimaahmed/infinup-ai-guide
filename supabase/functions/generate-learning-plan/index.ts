import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  topic: string;
  level: string;
  weeks: number;
  hoursPerWeek: number;
}

async function checkUrlStatus(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Longer timeout
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ResourceValidator/1.0)',
      },
    });
    
    clearTimeout(timeoutId);
    const isValid = response.ok;
    
    if (!isValid) {
      console.log(`❌ Invalid URL (${response.status}): ${url}`);
    } else {
      console.log(`✅ Valid URL: ${url}`);
    }
    
    return isValid;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`⚠️ URL validation failed for ${url}: ${errorMessage}`);
    // If validation fails due to network issues, include it anyway
    return true;
  }
}

async function validatePlanUrls(plan: any): Promise<any> {
  const validatedWeeks = await Promise.all(
    plan.weeks.map(async (week: any) => {
      const validatedResources = await Promise.all(
        week.resources.map(async (resource: any) => {
          const isValid = await checkUrlStatus(resource.url);
          if (!isValid) {
            console.log(`Invalid URL detected: ${resource.url}`);
          }
          return {
            ...resource,
            urlVerified: isValid,
          };
        })
      );
      
      // Filter out resources with invalid URLs
      const validResources = validatedResources.filter(r => r.urlVerified);
      
      return {
        ...week,
        resources: validResources.map(r => {
          const { urlVerified, ...rest } = r;
          return rest;
        }),
      };
    })
  );
  
  return {
    ...plan,
    weeks: validatedWeeks,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, level, weeks, hoursPerWeek } = await req.json() as RequestBody;

    console.log('Generating learning plan for:', { topic, level, weeks, hoursPerWeek });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Calculate total resources based on time available
    const totalHours = weeks * hoursPerWeek;
    const resourceCount = Math.max(10, Math.min(Math.floor(totalHours / 3), 20));

    const systemPrompt = `You are an expert learning path designer. Create comprehensive, realistic study plans using REAL resources that actually exist online.`;

    const userPrompt = `Create a ${weeks}-week study plan for learning "${topic}" at ${level} level, with ${hoursPerWeek} hours per week.

Requirements:
- Include ${resourceCount} REAL, CURRENTLY ACTIVE resources that are verified to exist
- CRITICAL URL REQUIREMENTS:
  * YouTube: ONLY use videos from major educational channels that you are 100% certain exist (freeCodeCamp.org, Traversy Media, Programming with Mosh, etc.)
  * Documentation: Only official documentation sites (docs.python.org, developer.mozilla.org, reactjs.org)
  * Courses: Only use official course platform pages (coursera.org, edx.org, khanacademy.org, freecodecamp.org)
  * Articles: Only use major tech publication sites (dev.to, css-tricks.com, smashingmagazine.com)
- ABSOLUTELY AVOID:
  * Udemy links (often removed or made private)
  * Old blog posts or personal websites
  * Any URL you are not 100% certain is currently active
  * Paywalled or premium content
- Organize by week with clear, progressive themes
- Each resource needs: title, source, URL, estimated time, description
- Mix content types: videos (🎥), reading (📖), interactive (💻), projects (🛠️)
- Only include resources that are FREE and permanently accessible
- Ensure the progression builds skills logically

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "topic": "${topic}",
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "Foundations and Basics",
      "resources": [
        {
          "id": 1,
          "type": "video",
          "title": "Exact title of real resource",
          "source": "Platform - Creator/Channel",
          "url": "https://actual-working-url.com",
          "duration": "2 hours",
          "description": "Brief description of what this teaches",
          "completed": false
        }
      ]
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('Raw AI response:', content);

    // Parse the JSON response, handling potential markdown wrapping
    let plan;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      plan = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Content was:', content);
      throw new Error('Failed to parse AI response');
    }

    console.log('Successfully generated plan with', plan.weeks.length, 'weeks');

    // Validate URLs before returning
    console.log('Validating resource URLs...');
    const validatedPlan = await validatePlanUrls(plan);
    console.log('URL validation complete');

    return new Response(
      JSON.stringify({ plan: validatedPlan }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-learning-plan:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
