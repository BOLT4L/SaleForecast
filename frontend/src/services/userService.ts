import api from "./api";
import type { User, UserInput } from "../types/user";

export const userService = {
  getUsers: async (params?: { role?: string }): Promise<User[]> => {
    try {
      const response = await api.get<any>("/users", { params });
      const users = response.data;
      const invalidUsers = users.filter(
        (u: any) => !u.id || typeof u.id !== "string"
      );
      if (invalidUsers.length) {
        console.warn(`Found ${invalidUsers.length} users with invalid IDs`, {
          users: invalidUsers.map((u: any) => ({
            username: u.username,
            id: u.id,
          })),
        });
      }
      return users;
    } catch (error: any) {
      console.error(
        "Error fetching users:",
        error.message,
        error.response?.data
      );
      throw new Error(error.response?.data?.error || "Failed to fetch users");
    }
  },

  createUser: async (data: UserInput): Promise<User> => {
    try {
      const response = await api.post<any>("/users", data);
      return response.data.user;
    } catch (error: any) {
      console.error(
        "Error creating user:",
        error.message,
        error.response?.data
      );
      throw new Error(error.response?.data?.error || "Failed to create user");
    }
  },

  updateUser: async (id: string, data: Partial<UserInput>): Promise<User> => {
    try {
      const response = await api.put<any>(`/users/${id}`, data);
      return response.data.user;
    } catch (error: any) {
      console.error(
        "Error updating user:",
        error.message,
        error.response?.data
      );
      throw new Error(error.response?.data?.error || "Failed to update user");
    }
  },

  deleteUser: async (id: string): Promise<void> => {
    try {
      await api.delete(`/users/${id}`);
    } catch (error: any) {
      console.error(
        "Error deleting user:",
        error.message,
        error.response?.data
      );
      throw new Error(error.response?.data?.error || "Failed to delete user");
    }
  },
};
