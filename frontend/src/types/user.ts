export interface User {
  _id: string;
  username: string;
  email: string;
  role: "Manager" | "Admin" | "Planner" | "Owner";
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface UserInput {
  username: string;
  email: string;
  password?: string;
  role: "Manager" | "Planner" | "Owner" | "Admin";
}
