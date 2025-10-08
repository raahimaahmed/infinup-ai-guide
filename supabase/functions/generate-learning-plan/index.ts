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

// YouTube URL utilities for server-side processing
function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    if (urlObj.hostname.includes('youtube.com')) {
      const vParam = urlObj.searchParams.get('v');
      if (vParam) return vParam;

      const pathMatch = urlObj.pathname.match(/\/(embed|v)\/([^/?]+)/);
      if (pathMatch) return pathMatch[2];
    }

    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1).split('/')[0];
      if (videoId) return videoId;
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeYouTubeUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    // Return the standard watch URL (better for client-side detection)
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url;
}

async function checkUrlStatus(url: string, retries = 2): Promise<{ isValid: boolean; status?: number; error?: string }> {
  // Whitelist of known reliable domains - skip validation for performance
  const trustedDomains = [
    'youtube.com', 'youtu.be',
    'developer.mozilla.org', 'docs.python.org', 'reactjs.org', 'react.dev',
    'freecodecamp.org', 'khanacademy.org', 'coursera.org', 'edx.org',
    'github.com', 'gitlab.com',
    'css-tricks.com', 'smashingmagazine.com', 'dev.to', 'realpython.com',
    'w3schools.com', 'stackoverflow.com'
  ];

  // Check if URL is from trusted domain
  const urlObj = new URL(url);
  const isTrusted = trustedDomains.some(domain => urlObj.hostname.includes(domain));

  if (isTrusted) {
    console.log(`✅ Trusted domain (skipped validation): ${url}`);
    return { isValid: true, status: 200 };
  }

  // Retry logic for non-trusted URLs
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ResourceValidator/1.0)',
          'Accept': '*/*',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`✅ Valid URL (status ${response.status}): ${url}`);
        return { isValid: true, status: response.status };
      }

      // Handle specific HTTP errors
      if (response.status === 403 || response.status === 405) {
        // Some sites block HEAD requests, try GET on last attempt
        if (attempt === retries) {
          console.log(`⚠️ HEAD blocked, trying GET for: ${url}`);
          const getController = new AbortController();
          const getTimeoutId = setTimeout(() => getController.abort(), 10000);

          const getResponse = await fetch(url, {
            method: 'GET',
            signal: getController.signal,
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; ResourceValidator/1.0)',
            },
          });

          clearTimeout(getTimeoutId);

          if (getResponse.ok) {
            console.log(`✅ Valid URL via GET (status ${getResponse.status}): ${url}`);
            return { isValid: true, status: getResponse.status };
          }
        }
      }

      console.log(`❌ Invalid URL (status ${response.status}, attempt ${attempt + 1}/${retries + 1}): ${url}`);

      if (attempt < retries) {
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }

      return { isValid: false, status: response.status };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`⚠️ URL validation error (attempt ${attempt + 1}/${retries + 1}): ${url} - ${errorMessage}`);

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }

      // On final failure, be lenient for timeout/network errors
      const isNetworkError = errorMessage.includes('abort') ||
                            errorMessage.includes('timeout') ||
                            errorMessage.includes('network');

      return {
        isValid: isNetworkError, // Include if it's a network issue, not a bad URL
        error: errorMessage
      };
    }
  }

  return { isValid: false, error: 'Max retries exceeded' };
}

async function validatePlanUrls(plan: any): Promise<any> {
  console.log(`🔍 Validating URLs for ${plan.weeks.length} weeks...`);

  const validatedWeeks = await Promise.all(
    plan.weeks.map(async (week: any) => {
      console.log(`  Week ${week.weekNumber}: Validating ${week.resources.length} resources...`);

      const validatedResources = await Promise.all(
        week.resources.map(async (resource: any) => {
          // Normalize YouTube URLs first
          const normalizedUrl = normalizeYouTubeUrl(resource.url);
          const result = await checkUrlStatus(normalizedUrl);

          if (!result.isValid) {
            console.log(`  ❌ Removing invalid resource: ${resource.title} - ${normalizedUrl}`);
            console.log(`     Reason: ${result.error || `HTTP ${result.status}`}`);
          }

          return {
            ...resource,
            url: normalizedUrl, // Use normalized URL
            urlVerified: result.isValid,
            validationStatus: result.status,
          };
        })
      );

      // Filter out resources with invalid URLs
      const validResources = validatedResources.filter(r => r.urlVerified);
      const removedCount = validatedResources.length - validResources.length;

      if (removedCount > 0) {
        console.log(`  ⚠️ Week ${week.weekNumber}: Removed ${removedCount} invalid resources`);
      }

      return {
        ...week,
        resources: validResources.map(r => {
          // Remove validation metadata from final output
          const { urlVerified, validationStatus, ...rest } = r;
          return rest;
        }),
      };
    })
  );

  const totalOriginal = plan.weeks.reduce((sum: number, w: any) => sum + w.resources.length, 0);
  const totalValid = validatedWeeks.reduce((sum: number, w: any) => sum + w.resources.length, 0);
  console.log(`✅ Validation complete: ${totalValid}/${totalOriginal} resources validated successfully`);

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

    const systemPrompt = `You are an expert learning path designer with expertise in creating comprehensive, realistic study plans using REAL resources that actually exist online.

LEARNING DESIGN PRINCIPLES:
- Progressive complexity: Start with fundamentals, build to advanced concepts
- Spaced repetition: Revisit key concepts across multiple weeks
- Multi-modal learning: Mix videos, reading, interactive exercises, and projects
- Practical application: Include hands-on projects to reinforce learning
- Resource diversity: Use different teaching styles and perspectives

EXAMPLE 1 - Python for Beginners (2 weeks, 5 hours/week):
{
  "topic": "Python Programming",
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "Python Fundamentals & Syntax",
      "resources": [
        {
          "id": 1,
          "type": "video",
          "title": "Python Tutorial for Beginners - Full Course in 12 Hours",
          "source": "YouTube - freeCodeCamp.org",
          "url": "https://www.youtube.com/watch?v=rfscVS0vtbw",
          "duration": "3 hours (watch sections 1-3)",
          "description": "Comprehensive introduction to Python basics, variables, and data types",
          "completed": false
        },
        {
          "id": 2,
          "type": "reading",
          "title": "Python Official Tutorial",
          "source": "Python.org Documentation",
          "url": "https://docs.python.org/3/tutorial/",
          "duration": "1.5 hours",
          "description": "Official Python documentation covering basic syntax and data structures",
          "completed": false
        },
        {
          "id": 3,
          "type": "interactive",
          "title": "Learn Python Basics",
          "source": "freeCodeCamp",
          "url": "https://www.freecodecamp.org/learn/scientific-computing-with-python/",
          "duration": "2 hours",
          "description": "Interactive exercises for Python fundamentals",
          "completed": false
        }
      ]
    },
    {
      "weekNumber": 2,
      "theme": "Control Flow & Functions",
      "resources": [
        {
          "id": 4,
          "type": "video",
          "title": "Python Functions Tutorial",
          "source": "YouTube - Corey Schafer",
          "url": "https://www.youtube.com/watch?v=9Os0o3wzS_I",
          "duration": "30 minutes",
          "description": "Deep dive into Python functions and scope",
          "completed": false
        },
        {
          "id": 5,
          "type": "reading",
          "title": "Python Control Flow",
          "source": "Real Python",
          "url": "https://realpython.com/python-conditional-statements/",
          "duration": "1 hour",
          "description": "Understanding if statements, loops, and logic",
          "completed": false
        },
        {
          "id": 6,
          "type": "project",
          "title": "Build a Simple Calculator",
          "source": "GitHub - Practice Project",
          "url": "https://github.com/topics/python-calculator",
          "duration": "3 hours",
          "description": "Apply functions and control flow to build a working calculator",
          "completed": false
        }
      ]
    }
  ]
}

EXAMPLE 2 - JavaScript for Web Development (3 weeks, 8 hours/week):
{
  "topic": "JavaScript Web Development",
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "JavaScript Fundamentals",
      "resources": [
        {
          "id": 1,
          "type": "video",
          "title": "JavaScript Tutorial Full Course - Beginner to Pro",
          "source": "YouTube - Programming with Mosh",
          "url": "https://www.youtube.com/watch?v=W6NZfCO5SIk",
          "duration": "4 hours",
          "description": "Complete introduction to JavaScript syntax, variables, and operators",
          "completed": false
        },
        {
          "id": 2,
          "type": "reading",
          "title": "JavaScript Guide",
          "source": "MDN Web Docs",
          "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
          "duration": "3 hours",
          "description": "Official JavaScript documentation and best practices",
          "completed": false
        },
        {
          "id": 3,
          "type": "interactive",
          "title": "JavaScript Algorithms and Data Structures",
          "source": "freeCodeCamp",
          "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
          "duration": "2 hours",
          "description": "Interactive challenges for JavaScript fundamentals",
          "completed": false
        }
      ]
    },
    {
      "weekNumber": 2,
      "theme": "DOM Manipulation & Events",
      "resources": [
        {
          "id": 4,
          "type": "video",
          "title": "JavaScript DOM Manipulation",
          "source": "YouTube - Traversy Media",
          "url": "https://www.youtube.com/watch?v=0ik6X4DJKCc",
          "duration": "2 hours",
          "description": "Learn to interact with HTML elements using JavaScript",
          "completed": false
        },
        {
          "id": 5,
          "type": "reading",
          "title": "Introduction to Events",
          "source": "MDN Web Docs",
          "url": "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events",
          "duration": "2 hours",
          "description": "Understanding event handlers and event-driven programming",
          "completed": false
        },
        {
          "id": 6,
          "type": "project",
          "title": "Build an Interactive To-Do List",
          "source": "Project Tutorial",
          "url": "https://www.freecodecamp.org/news/how-to-build-a-todo-list-with-javascript/",
          "duration": "4 hours",
          "description": "Create a functional to-do app with DOM manipulation",
          "completed": false
        }
      ]
    },
    {
      "weekNumber": 3,
      "theme": "Async JavaScript & APIs",
      "resources": [
        {
          "id": 7,
          "type": "video",
          "title": "Async JavaScript Crash Course",
          "source": "YouTube - Traversy Media",
          "url": "https://www.youtube.com/watch?v=PoRJizFvM7s",
          "duration": "3 hours",
          "description": "Master callbacks, promises, and async/await",
          "completed": false
        },
        {
          "id": 8,
          "type": "reading",
          "title": "Working with APIs",
          "source": "MDN Web Docs",
          "url": "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Fetching_data",
          "duration": "2 hours",
          "description": "Learn to fetch and display data from web APIs",
          "completed": false
        },
        {
          "id": 9,
          "type": "project",
          "title": "Weather App with API",
          "source": "Project Guide",
          "url": "https://www.freecodecamp.org/news/build-a-weather-app-with-javascript/",
          "duration": "4 hours",
          "description": "Build a weather application using a real API",
          "completed": false
        }
      ]
    }
  ]
}`;

    const userPrompt = `Create a ${weeks}-week study plan for learning "${topic}" at ${level} level, with ${hoursPerWeek} hours per week.

Requirements:
- Include ${resourceCount} REAL, CURRENTLY ACTIVE resources that are verified to exist
- CRITICAL URL REQUIREMENTS:
  * YouTube: ONLY use videos from major educational channels (freeCodeCamp.org, Traversy Media, Programming with Mosh, Corey Schafer, etc.)
  * Documentation: Only official documentation sites (docs.python.org, developer.mozilla.org, reactjs.org, etc.)
  * Courses: Only official course platform pages (coursera.org, edx.org, khanacademy.org, freecodecamp.org)
  * Articles: Only major tech publications (dev.to, css-tricks.com, smashingmagazine.com, realpython.com)
  * Interactive: Prefer embeddable platforms (CodePen, CodeSandbox, StackBlitz, Replit, freeCodeCamp)
  * PDFs: Use official documentation PDFs or Google Drive links when appropriate
- ABSOLUTELY AVOID:
  * Udemy links (often removed or made private)
  * Old blog posts or personal websites
  * Any URL you are not 100% certain is currently active
  * Paywalled or premium content
  * Sites that block iframe embedding (Facebook, Twitter, LinkedIn)
- EMBEDDABLE CONTENT PRIORITY:
  * Prioritize resources that can be embedded directly in the learning interface
  * YouTube videos, freeCodeCamp interactive exercises, CodePen demos, PDF documents
  * This creates a seamless learning experience without leaving the platform
- Organize by week with clear, progressive themes
- Each resource needs: title, source, URL, estimated time, description
- Mix content types: videos, reading, interactive, projects
- Only include resources that are FREE and permanently accessible
- Follow the examples above for structure and quality
- Ensure logical skill progression across weeks

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "topic": "${topic}",
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "Week theme here",
      "resources": [
        {
          "id": 1,
          "type": "video",
          "title": "Exact title of real resource",
          "source": "Platform - Creator/Channel",
          "url": "https://actual-working-url.com",
          "duration": "X hours",
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
        temperature: 0.5, // Lowered for more consistent, reliable outputs
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
