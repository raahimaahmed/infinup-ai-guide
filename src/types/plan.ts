export interface Resource {
  id: number;
  type: "video" | "reading" | "interactive" | "project";
  title: string;
  source: string;
  url: string;
  duration: string;
  description: string;
  completed: boolean;
}

export interface Week {
  weekNumber: number;
  theme: string;
  resources: Resource[];
}

export interface GeneratedPlan {
  topic: string;
  weeks: Week[];
}

export interface StoredPlan {
  topic: string;
  level: string;
  weeks: number;
  hoursPerWeek: number;
  weekData: Week[];
}
