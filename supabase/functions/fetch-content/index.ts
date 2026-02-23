import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface FetchContentRequest {
  url: string;
  extractContent?: boolean;
}

/**
 * Content Fetching & Extraction API using Firecrawl
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, extractContent = true } = await req.json() as FetchContentRequest;

    if (!url || !url.startsWith('http')) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL. Must start with http:// or https://' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const blockedDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
    const urlObj = new URL(url);
    if (blockedDomains.some(domain => urlObj.hostname.includes(domain))) {
      return new Response(
        JSON.stringify({ error: 'URL is blocked for security reasons' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Firecrawl API key not configured', success: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching content from: ${url} using Firecrawl`);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Firecrawl error:', data);
      return new Response(
        JSON.stringify({
          error: data.error || `Failed to fetch content: HTTP ${response.status}`,
          success: false,
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const content = data.data;
    const metadata = content?.metadata || {};
    const markdown = content?.markdown || '';
    const html = content?.html || '';

    console.log(`Successfully extracted: ${metadata.title || 'Untitled'}`);

    return new Response(
      JSON.stringify({
        title: metadata.title || '',
        byline: metadata.author || metadata.ogAuthor || '',
        content: html,
        textContent: markdown,
        length: markdown.length,
        excerpt: metadata.description || markdown.slice(0, 200),
        siteName: metadata.ogSiteName || metadata.sourceURL || '',
        url,
        success: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-content:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
