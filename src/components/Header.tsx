import logo from "@/assets/logo.webp";
interface HeaderProps {
  progress?: {
    completed: number;
    total: number;
  };
}
export const Header = ({
  progress
}: HeaderProps) => {
  const percentage = progress ? Math.round(progress.completed / progress.total * 100) : 0;
  return <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Infinup.ai" className="h-8 w-auto" />
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">InfinUp.ai</span>
        </div>
        
        {progress && <div className="flex items-center gap-4">
            <div className="hidden sm:block text-sm text-muted-foreground">
              Progress: {progress.completed}/{progress.total} ({percentage}%)
            </div>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary transition-all duration-500 ease-smooth" style={{
            width: `${percentage}%`
          }} />
            </div>
          </div>}
      </div>
    </header>;
};