import React, { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService";
import type { User, AuthState } from "../types/user";
import toast from "react-hot-toast";

interface AuthContextType extends AuthState {
  userRole: string | null; // Add userRole to the context
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, role: string) => Promise<void>;

  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check for existing auth on mount
    const token = authService.getToken();
    const user = authService.getCurrentUser();

    console.log("AuthProvider init - token:", token, "user:", user);

    if (token && user) {
      const role = user.role ? user.role.toLowerCase() : null; // Normalize role to lowercase
      if (role === "viewer") {
        console.warn("Viewer role detected; limited access");
        // Optionally redirect or show limited UI
      }
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
      if (!user) {
        console.warn("No user found in localStorage or invalid user data");
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const response = await authService.login(username, password);

      console.log("Login response:", response);

      authService.setAuth(response.token, response.user);

      const role = response.user.role ? response.user.role.toLowerCase() : null; // Normalize role
      if (role === "viewer") {
        // toast.warn("Viewer role has limited access");
      }

      setState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success("Login successful!");
    } catch (error: any) {
      setState((prev) => ({ ...prev, isLoading: false }));
      const message = error.response?.data?.message || "Login failed";
      console.error("Login error:", error.message, error.response?.data);
      toast.error(message);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string, role: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      await authService.register(username, email, password, role); // Normalize role on registration

      // Auto-login after registration
      await login(username, password);
    } catch (error: any) {
      setState((prev) => ({ ...prev, isLoading: false }));
      const message = error.response?.data?.message || error.response?.data?.error || "Registration failed";
      console.error("Register error:", error.message, error.response?.data);
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    toast.success("Logged out successfully");
  };

  const value: AuthContextType = {
    ...state,
    userRole: state.user?.role ? state.user.role.toLowerCase() : null, // Provide normalized userRole
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
