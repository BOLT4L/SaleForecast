"use client";

import { Link, useLocation } from "react-router-dom";
import {
  Home,
  ShoppingCart,
  TrendingUp,
  Package,
  FileText,
  Network,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

interface SidebarProps {
  onClose: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();

  // Normalize role to handle case mismatches
  const normalizedRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
    : null;

  // Debug log to inspect user and normalized role
  console.log("Sidebar user:", user, "Normalized role:", normalizedRole);

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: Home,
      roles: ["Manager", "Owner", "Admin"],
    },
    {
      name: "Sales",
      path: "/sales",
      icon: ShoppingCart,
      roles: ["Manager", "Owner", "Admin"],
    },
    {
      name: "Forecasts",
      path: "/forecasts",
      icon: TrendingUp,
      roles: ["Manager", "Owner", "Admin"],
    },
    {
      name: "Products",
      path: "/products",
      icon: Package,
      roles: ["Planner", "Owner", "Admin", "Manager"],
    },
    {
      name: "Reports",
      path: "/reports",
      icon: FileText,
      roles: ["Manager", "Planner", "Owner"],
    },
    {
      name: "Market Basket",
      path: "/marketbasket",
      icon: Network,
      roles: ["Manager", "Owner", "Admin"],
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      roles: ["Owner", "Admin"],
    },
    {
      name: "User Management",
      path: "/users",
      icon: Users,
      roles: ["Admin", "Owner"],
    },
  ];

  const allowedNavItems = navItems.filter(
    (item) => normalizedRole && item.roles.includes(normalizedRole)
  );

  // Debug log to inspect filtered nav items
  console.log("Allowed nav items:", allowedNavItems);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <Link to="/" className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold">SalesPredictor</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="md:hidden"
        >
          <X className="w-5 h-5" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-auto">
        {!user || !normalizedRole ? (
          <div className="text-center text-muted-foreground">
            <p>Please log in to view navigation.</p>
            <Link to="/login" className="text-primary hover:underline">
              Go to Login
            </Link>
          </div>
        ) : normalizedRole.toLowerCase() === "viewer" ? (
          <div className="text-center text-muted-foreground">
            <p>Viewer role has no access to routes.</p>
            <p>Contact an Admin to update your role.</p>
          </div>
        ) : allowedNavItems.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p>No routes available for your role: {normalizedRole}</p>
          </div>
        ) : (
          allowedNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          ))
        )}
      </nav>

      <div className="p-4 border-t">
        {user ? (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{user.username}</p>
              <p className="text-xs text-muted-foreground">{normalizedRole}</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>Not logged in</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
