"use client";

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ForbiddenPage from "../../pages/ForbiddenPage";

interface RoleRouteProps {
  children: ReactNode;
  requiredRoles: Array<"Manager" | "Planner" | "Owner" | "Admin">;
}

const RoleRoute = ({ children, requiredRoles }: RoleRouteProps) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Admin has access to everything
  if (user.role === "Admin") {
    return <>{children}</>;
  }

  // Check if user has one of the required roles
  const hasAccess = requiredRoles.includes(user.role);

  return hasAccess ? <>{children}</> : <ForbiddenPage />;
};

export default RoleRoute;
