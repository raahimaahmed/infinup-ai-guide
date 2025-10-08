import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Readability } from "npm:@mozilla/readability@0.5.0";
import { JSDOM } from "npm:jsdom@24.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FetchContentRequest {
  url: string;
  extractContent?: boolean; // If true, extract readable content with Readability
}

/**
 * Content Fetching & Extraction API
 *
 * Safely fetches external content and optionally extracts readable text
 * using Mozilla's Readability.js to bypass CORS and get clean content
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, extractContent = true } = await req.json() as FetchContentRequest;

    // Validate URL
    if (!url || !url.startsWith('http')) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL. Must start with http:// or https://' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Security: Block potentially dangerous URLs
    const blockedDomains = ['localhost', '127.0.0.1', '0.0.0.0', 'file://', 'data:'];
    const urlObj = new URL(url);

    if (blockedDomains.some(domain => urlObj.hostname.includes(domain))) {
      return new Response(
        JSON.stringify({ error: 'URL is blocked for security reasons' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching content from: ${url}`);

    // Fetch the content
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InfinUp/1.0; +https://infinup.ai)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `Failed to fetch content: HTTP ${response.status}`,
          status: response.status
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

    // If content extraction requested, use Readability
    if (extractContent) {
      try {
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article) {
          return new Response(
            JSON.stringify({
              error: 'Could not extract readable content',
              rawHtml: html.slice(0, 5000) // Return first 5KB as fallback
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Successfully extracted article: ${article.title}`);

        return new Response(
          JSON.stringify({
            title: article.title,
            byline: article.byline,
            content: article.content,
            textContent: article.textContent,
            length: article.length,
            excerpt: article.excerpt,
            siteName: article.siteName,
            url: url,
            success: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (readabilityError) {
        console.error('Readability extraction failed:', readabilityError);

        return new Response(
          JSON.stringify({
            error: 'Failed to parse content',
            rawHtml: html.slice(0, 5000),
            success: false
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Return raw HTML if extraction not requested
    return new Response(
      JSON.stringify({
        rawHtml: html,
        url: url,
        success: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-content:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
