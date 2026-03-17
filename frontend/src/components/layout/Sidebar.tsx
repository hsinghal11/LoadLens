import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, List, History, BarChart2, Settings, LogOut, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: List, label: "Test Plans", href: "/plans" },
  { icon: History, label: "History", href: "/history" },
  { icon: BarChart2, label: "Compare", href: "/compare" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="hidden border-r bg-muted/20 md:flex md:w-64 md:flex-col justify-between h-full shrink-0">
      <div className="flex flex-col gap-2 p-4">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-4 mb-4">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">LoadLens</span>
        </Link>
        
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                location.pathname.startsWith(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground" 
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </div>
    </div>
  );
}
