import { Link } from "react-router-dom";
import { Plus, Menu } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const user = useAuthStore((state) => state.user);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6 bg-background">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <h2 className="text-base md:text-lg font-semibold tracking-tight">
            {greeting}, {user?.name?.split(" ")[0] || "User"}
          </h2>
        </div>
      </div>
      <div>
        <Button asChild size="sm">
          <Link to="/plans?new=true">
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </Link>
        </Button>
      </div>
    </header>
  );
}
