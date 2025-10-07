import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare } from "lucide-react";

export const FeedbackSection = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  useEffect(() => {
    // Auto-open after 15 seconds if not already opened
    const timer = setTimeout(() => {
      if (!hasAutoOpened) {
        setIsOpen(true);
        setHasAutoOpened(true);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [hasAutoOpened]);

  return (
    <>
      {/* Floating Feedback Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full h-14 px-6 shadow-lg hover:shadow-xl transition-all gap-2 z-50"
        size="lg"
      >
        <MessageSquare className="h-5 w-5" />
        <span className="hidden sm:inline">Feedback</span>
      </Button>

      {/* Feedback Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[90vw] md:max-w-[700px] max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl">💬 Help Us Improve</DialogTitle>
            <DialogDescription>
              Share your thoughts and help us build features that matter most to you. Takes 90 seconds.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-6 pb-6">
            <iframe 
              src="https://docs.google.com/forms/d/e/1FAIpQLScSKf4WLrY-mgGLJeTo0g4qjKRIYftjSsFk1UeRQBzecefuIA/viewform?embedded=true" 
              width="100%" 
              height="1900" 
              frameBorder="0" 
              marginHeight={0} 
              marginWidth={0}
              className="rounded-lg"
              title="Infinup Feedback Form"
            >
              Loading…
            </iframe>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
