import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Badge, ChevronDown, Shield } from "lucide-react";
import React, { useState, useEffect } from "react";
import { NavbarAdminLink } from "@/components/ui/navbar-admin-link";
import { supabase } from "@/integrations/supabase/client";

// Create ListItem component for the navigation dropdown
const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export function Navbar() {
  const { user, signOut } = useAuth();

  const getUserInitials = () => {
    if (!user || !user.email) return '?';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-background border-b sticky top-0 z-50 backdrop-blur-lg bg-background/80 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold text-xl bg-gradient-to-r from-socialmize-purple to-socialmize-blue bg-clip-text text-transparent">
            SocialMize
          </Link>
          
          {user && (
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/dashboard" className={navigationMenuTriggerStyle()}>
                    Dashboard
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Content</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <ListItem
                        href="/scripts-library"
                        title="Scripts Library"
                      >
                        Browse and manage your content scripts
                      </ListItem>
                      <ListItem
                        href="/generate-scripts"
                        title="Generate Scripts"
                      >
                        Create new content scripts from your ideas
                      </ListItem>
                      <ListItem
                        href="/weekly-calendar"
                        title="Content Calendar"
                      >
                        Manage your content posting schedule
                      </ListItem>
                      <ListItem
                        href="/topic-suggestions"
                        title="Topic Ideas"
                      >
                        Explore trending topic suggestions for your niche
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Strategy</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <ListItem
                        href="/strategy-chat"
                        title="Strategy Chat"
                      >
                        Chat with AI to develop your content strategy
                      </ListItem>
                      <ListItem
                        href="/review-ideas"
                        title="Content Ideas"
                      >
                        Review generated content ideas and implementation plan
                      </ListItem>
                      <ListItem
                        href="/strategy-overview"
                        title="Strategy Overview"
                      >
                        View and manage your overall content strategy
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <ListItem
                        href="/reminders"
                        title="Reminders"
                      >
                        Set and manage content creation reminders
                      </ListItem>
                      <ListItem
                        href="/inbox"
                        title="Inbox"
                      >
                        View notifications and content updates
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link to="/badges" className={navigationMenuTriggerStyle()}>
                    Badges
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link to="/settings" className={navigationMenuTriggerStyle()}>
                    Settings
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <NavbarAdminLink />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    {user.user_metadata?.avatar_url ? (
                      <AvatarImage src={user.user_metadata.avatar_url} alt={user.email || ""} />
                    ) : (
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/scripts-library">Scripts Library</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/weekly-calendar">Content Calendar</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/strategy-chat">Strategy Chat</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/review-ideas">Content Ideas</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/reminders">Reminders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/inbox">Inbox</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/badges">Badges & Achievements</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/topic-suggestions">Topic Suggestions</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                
                {/* Admin Link (conditionally displayed) */}
                <AdminMenuLink />
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}

// Admin Menu Link component (only visible for admins)
function AdminMenuLink() {
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);
  
  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .rpc('is_admin', { user_id: user?.id });
      
      if (error) throw error;
      setIsAdmin(!!data);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };
  
  if (!isAdmin) return null;
  
  return (
    <DropdownMenuItem asChild>
      <Link to="/admin" className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-amber-600" />
        Admin Dashboard
      </Link>
    </DropdownMenuItem>
  );
}
