import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const loadingMessages = [
  "Searching for resources...",
  "Building your learning path...",
  "Almost ready...",
];

export const LoadingScreen = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-subtle">
      <div className="text-center space-y-8">
        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Creating Your Learning Path</h2>
          <p className="text-lg text-muted-foreground animate-pulse">
            {loadingMessages[messageIndex]}
          </p>
        </div>
      </div>
    </div>
  );
};
