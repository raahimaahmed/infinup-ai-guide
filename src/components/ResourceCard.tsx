import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
<<<<<<< HEAD
import { ExternalLink, Video, BookOpen, Code, FolderKanban } from "lucide-react";
=======
import { Button } from "@/components/ui/button";
import { ExternalLink, Video, BookOpen, Code, Wrench, Play, X } from "lucide-react";
>>>>>>> f537945 (feat: Add YouTube iframe embedding to fix bot detection errors)
import confetti from "canvas-confetti";
import { getYouTubeVideoInfo, isYouTubeUrl, getYouTubeEmbedProps } from "@/lib/youtube";

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
  project: FolderKanban,
};

export const ResourceCard = ({ resource, onToggle }: ResourceCardProps) => {
  const [showPlusOne, setShowPlusOne] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const Icon = iconMap[resource.type];

  // Check if this is a YouTube video
  const isYouTube = isYouTubeUrl(resource.url);
  const youtubeInfo = isYouTube ? getYouTubeVideoInfo(resource.url) : null;

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
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {resource.description}
          </p>

          {/* YouTube Embed Section */}
          {isYouTube && youtubeInfo && (
            <div className="mt-3 space-y-2">
              {!showEmbed ? (
                <Button
                  onClick={() => setShowEmbed(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Play Video Here
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      🎥 Video Player
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
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-black">
                    <iframe
                      {...getYouTubeEmbedProps(youtubeInfo.videoId)}
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
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
            {isYouTube ? "Open in YouTube" : resource.type === "interactive" ? "Start Now" : "View Resource"}
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
