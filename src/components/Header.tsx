import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";
import logo from "@/assets/logo.webp";

interface HeaderProps {
  progress?: {
    completed: number;
    total: number;
  };
}

export const Header = ({ progress }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const percentage = progress ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 gap-2">
        <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logo} alt="Infinup.ai" className="h-8 w-auto" />
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent hidden sm:inline">
            InfinUp.ai
          </span>
        </div>

        <div className="flex items-center gap-4">
          {progress && (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-sm text-muted-foreground whitespace-nowrap">
                {progress.completed}/{progress.total} ({percentage}%)
              </div>
              <div className="w-32 sm:w-48 h-2.5 bg-muted rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full bg-gradient-primary transition-all duration-500 ease-smooth"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/profile")}
                className="gap-1.5"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">My Plans</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="gap-1.5">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
