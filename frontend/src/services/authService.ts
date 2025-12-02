import api from "./api";
import type { User } from "../types/user";
// import jwtDecode from "jwt-decode" // Uncomment if using client-side JWT decoding

interface LoginRequest {
  username: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  password: string;
  role: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", {
      username,
      password,
    });
    return response.data;

    // Fallback: Decode JWT client-side if backend only returns { token }
    /*
    const { token } = response.data
    const decoded: { userId: string; role: string } = jwtDecode(token)
    return {
      token,
      user: {
        id: decoded.userId,
        username,
        role: decoded.role,
      },
    }
    */
  },

  register: async (
    username: string,
    email: string,
    password: string,
    role: string
  ): Promise<void> => {
    await api.post("/auth/register", {
      username,
      email,
      password,
      role,
    });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem("user");
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (err) {
      console.error("Failed to parse user from localStorage:", userStr);
      return null;
    }
  },

  getToken: (): string | null => {
    return localStorage.getItem("token");
  },

  setAuth: (token: string, user: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },
};
