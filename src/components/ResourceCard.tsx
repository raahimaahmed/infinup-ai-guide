import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ExternalLink, Video, BookOpen, Code, Hammer, Play, X, FileText, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  getEmbedInfo,
  shouldShowEmbed,
  getIframeProps,
  getEmbedHeight,
  getEmbedLabel
} from "@/lib/embeddings";
import { ArticleContent } from "./ArticleContent";

interface Resource {
  id: number;
  type: "video" | "reading" | "interactive" | "project";
  title: string;
  source: string;
  url: string;
  duration: string;
  description: string;
  completed: boolean;
}

interface ResourceCardProps {
  resource: Resource;
  onToggle: (id: number) => void;
}

const iconMap = {
  video: Video,
  reading: BookOpen,
  interactive: Code,
  project: Hammer,
};

export const ResourceCard = ({ resource, onToggle }: ResourceCardProps) => {
  const [showPlusOne, setShowPlusOne] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState(false);
  const Icon = iconMap[resource.type];

  // Get embedding information
  const embedInfo = getEmbedInfo(resource.url, resource.type);
  const canShowEmbed = shouldShowEmbed(resource.url, resource.type);
  const iframeProps = embedInfo.canEmbed ? getIframeProps(embedInfo) : null;

  const handleToggle = () => {
    if (!resource.completed) {
      setShowPlusOne(true);
      setTimeout(() => setShowPlusOne(false), 1000);

      // Small confetti burst
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#0066FF', '#00D084'],
      });
    }
    onToggle(resource.id);
  };

  return (
    <div className="relative group">
      <div
        className={`flex gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-300 ${
          resource.completed ? "opacity-60" : ""
        }`}
      >
        <div className="flex-shrink-0 pt-1">
          <Checkbox
            checked={resource.completed}
            onCheckedChange={handleToggle}
            className="h-5 w-5 data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
          />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start gap-2">
            <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <h4 className={`font-semibold ${resource.completed ? "line-through" : ""}`}>
              {resource.title}
            </h4>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{resource.source}</span>
            <span>•</span>
            <span>{resource.duration}</span>
            {embedInfo.embedType && canShowEmbed && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {embedInfo.embedType === 'youtube' && '🎥'}
                  {embedInfo.embedType === 'pdf' && '📄'}
                  {embedInfo.embedType === 'iframe' && '💻'}
                  Embeddable
                </span>
              </>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {resource.description}
          </p>

          {/* Article Content Extraction (for reading type) */}
          {resource.type === 'reading' && !canShowEmbed && (
            <ArticleContent url={resource.url} initialSummary={resource.description} />
          )}

          {/* YouTube: Show copyable link */}
          {canShowEmbed && embedInfo.embedType === 'youtube' && (
            <div className="mt-3 p-3 rounded-lg border bg-muted/50 space-y-2">
              <p className="text-sm font-medium">🎥 Copy this link and paste it in your browser to watch:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-background px-3 py-2 rounded border truncate select-all">
                  {resource.url}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(resource.url);
                    setCopied(true);
                    toast.success("Link copied! Paste it in your browser.");
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          )}

          {/* Non-YouTube embeds (PDF, interactive) */}
          {canShowEmbed && embedInfo.canEmbed && embedInfo.embedType !== 'youtube' && iframeProps && (
            <div className="mt-3 space-y-2">
              {!showEmbed ? (
                <Button
                  onClick={() => setShowEmbed(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  {embedInfo.embedType === 'pdf' && 'View PDF Here'}
                  {embedInfo.embedType === 'iframe' && 'Open Interactive Content'}
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {getEmbedLabel(embedInfo.embedType)}
                    </span>
                    <Button
                      onClick={() => setShowEmbed(false)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className={`relative w-full ${getEmbedHeight(embedInfo.embedType)} rounded-lg overflow-hidden border bg-black/5`}>
                    <iframe
                      {...iframeProps}
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    💡 Stay in your learning flow — everything embedded for you
                  </p>
                </div>
              )}
            </div>
          )}

          {/* External Link */}
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            {embedInfo.embedType === 'youtube' ? 'Open in YouTube' :
             embedInfo.embedType === 'pdf' ? 'Download PDF' :
             resource.type === "interactive" ? "Open in New Tab" :
             "View Resource"}
          </a>
        </div>
      </div>

      {showPlusOne && (
        <div className="absolute top-2 right-2 text-secondary font-bold text-lg animate-fade-in">
          +1
        </div>
      )}
    </div>
  );
};
