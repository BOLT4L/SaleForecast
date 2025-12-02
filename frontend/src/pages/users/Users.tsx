import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { userService } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import UserList from "./UserList";
import UserForm from "./UserForm";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/Dialog";
import type { User } from "../../types/user";

const Users = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin" || user?.role === "Owner";
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const {
    data: users,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["users", roleFilter],
    queryFn: () => userService.getUsers({ role: roleFilter }),
    enabled: isAdmin,
  });

  const handleCreate = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Access denied. Admin role required.</p>
      </div>
    );
  }

  const filteredUsers =
    users?.filter(
      (u) =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by username or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select
              value={roleFilter || "all"}
              onValueChange={(value) =>
                setRoleFilter(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Planner">Planner</SelectItem>
                <SelectItem value="Owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <UserList
            users={filteredUsers}
            isLoading={isLoading}
            onEdit={handleEdit}
            onRefresh={refetch}
          />
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={handleFormClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Create User"}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            user={editingUser}
            onClose={handleFormClose}
            onSuccess={refetch}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
