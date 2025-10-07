import { Card } from "@/components/ui/card";

export const FeedbackSection = () => {
  return (
    <div className="mt-16 pt-16 border-t border-border">
      <div className="container max-w-4xl px-4">
        <Card className="bg-muted/30 p-8 md:p-12 rounded-2xl">
          <div className="text-center mb-8 space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold">
              💬 Help Us Improve
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Share your thoughts and help us build features that matter most to you. Takes 90 seconds.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-[640px]">
              <iframe 
                src="https://docs.google.com/forms/d/e/1FAIpQLScSKf4WLrY-mgGLJeTo0g4qjKRIYftjSsFk1UeRQBzecefuIA/viewform?embedded=true" 
                width="100%" 
                height="1983" 
                frameBorder="0" 
                marginHeight={0} 
                marginWidth={0}
                className="rounded-lg animate-fade-in"
                title="Infinup Feedback Form"
              >
                Loading…
              </iframe>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
