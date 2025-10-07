import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ResourceCard } from "./ResourceCard";

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

interface Week {
  weekNumber: number;
  theme: string;
  resources: Resource[];
}

interface WeekSectionProps {
  week: Week;
  onToggleResource: (weekNumber: number, resourceId: number) => void;
}

export const WeekSection = ({ week, onToggleResource }: WeekSectionProps) => {
  const [isOpen, setIsOpen] = useState(week.weekNumber === 1);

  const completed = week.resources.filter((r) => r.completed).length;
  const total = week.resources.length;
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="text-left">
            <h3 className="font-semibold text-lg">
              WEEK {week.weekNumber}: {week.theme}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                {completed}/{total} ({percentage}%)
              </span>
              <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-6 py-4 space-y-4 border-t bg-muted/20">
          {week.resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onToggle={(id) => onToggleResource(week.weekNumber, id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
