import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { 
  Calendar, 
  Users, 
  Home,
  LogOut
} from "lucide-react";

export function SidebarNav() {
  const [location] = useLocation();
  const { logoutMutation, user } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Patients", href: "/patients", icon: Users },
  ];

  return (
    <div className="flex h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 py-2">
        <h2 className="text-lg font-semibold">Medical Manager</h2>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={location === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="flex items-center gap-4 mb-4">
          <div>
            <p className="text-sm font-medium">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
