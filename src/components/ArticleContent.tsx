import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ArticleContentProps {
  url: string;
  initialSummary?: string;
}

interface ExtractedArticle {
  title: string;
  byline?: string;
  content: string;
  textContent: string;
  length: number;
  excerpt?: string;
  siteName?: string;
  url: string;
}

export function ArticleContent({ url, initialSummary }: ArticleContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [article, setArticle] = useState<ExtractedArticle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchArticleContent = async () => {
    if (article) {
      // Already fetched, just toggle
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            url,
            extractContent: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch article content');
      }

      const data = await response.json();

      if (!data.success || !data.content) {
        throw new Error(data.error || 'Could not extract readable content');
      }

      setArticle(data);
      setIsExpanded(true);
    } catch (err) {
      console.error('Error fetching article:', err);
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setIsLoading(false);
    }
  };

  const getPreviewText = () => {
    if (article?.textContent) {
      // Show first 500 characters
      const preview = article.textContent.slice(0, 500);
      return preview + (article.textContent.length > 500 ? '...' : '');
    }
    if (initialSummary) {
      return initialSummary;
    }
    return 'Click to load article preview...';
  };

  const getReadingTime = () => {
    if (!article?.length) return null;
    const minutes = Math.ceil(article.length / 1000); // ~1000 chars per minute
    return `${minutes} min read`;
  };

  return (
    <div className="space-y-3">
      {/* Preview Section */}
      {!isExpanded && (
        <div className="p-4 bg-muted/50 rounded-lg border">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {getPreviewText()}
          </p>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && article && (
        <div className="space-y-4">
          {/* Article Metadata */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {article.byline && <span>By {article.byline}</span>}
            {article.byline && getReadingTime() && <span>•</span>}
            {getReadingTime() && <span>{getReadingTime()}</span>}
            {article.siteName && <span>• {article.siteName}</span>}
          </div>

          {/* Article Content */}
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 underline inline-flex items-center gap-1"
            >
              Read on original site <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* Expand/Collapse Button */}
      <div className="flex gap-2">
        <Button
          onClick={fetchArticleContent}
          disabled={isLoading}
          variant={isExpanded ? "ghost" : "outline"}
          size="sm"
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading article...
            </>
          ) : isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Read Full Article Inline
            </>
          )}
        </Button>

        {/* External Link (always available) */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Open Original
          </a>
        </Button>
      </div>

      {/* Helper Text */}
      {!isExpanded && !error && (
        <p className="text-xs text-muted-foreground italic">
          💡 Read the full article without leaving InfinUp
        </p>
      )}
    </div>
  );
}
