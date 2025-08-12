import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, Home, BookOpen } from "lucide-react";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleProfileClick = async () => {
    // Navigate to profile page
    navigate("/dashboard/profile");
    
    // Get and log the user's token
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        console.log("User Access Token:", session.access_token);
        console.log("Token will expire at:", new Date(session.expires_at * 1000));
      } else {
        console.log("No active session or token found");
      }
    } catch (error) {
      console.error("Error getting session:", error);
    }
  };

  return (
    <header className="w-full border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40 dark:bg-background/70 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-400 via-pink-400 to-red-500" />
          <span className="font-bold text-xl tracking-tight text-foreground">Twigg</span>
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => navigate("/dashboard/explore")}>
                <BookOpen className="h-4 w-4 mr-2" />
                Explore
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt="Profile" />
                      <AvatarFallback>
                        {user.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleProfileClick}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard/explore")}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse Courses
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : location.pathname === "/login" ? (
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Back to site
            </Link>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/login")}>
                Sign in
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white" 
                onClick={() => navigate("/login?mode=register")}
              >
                Sign up
              </Button>
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}