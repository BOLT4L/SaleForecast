import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { userService } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/DropdownMenu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/Dialog";
import UserDetails from "./UserDetails";
import type { User } from "../../types/user";

interface UserListProps {
  users: User[];
  isLoading: boolean;
  onEdit?: (user: User) => void;
  onRefresh: () => void;
}

const UserList = ({ users, isLoading, onEdit, onRefresh }: UserListProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin" || user?.role === "Owner";
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onRefresh();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };
  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetails(true);
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) {
      console.warn("Missing date string");
      return "N/A";
    }
    try {
      const parsedDate = parseISO(dateStr);
      if (!isValid(parsedDate)) {
        console.warn(`Invalid date: ${dateStr}`);
        return "Invalid Date";
      }
      return format(parsedDate, "MMM dd, yyyy");
    } catch (error) {
      console.warn(`Error parsing date: ${dateStr}`, error);
      return "Invalid Date";
    }
  };

  // Log duplicate or missing IDs
  const userIds = users.map((u) => u._id);
  const uniqueIds = new Set(userIds);
  if (uniqueIds.size !== userIds.length) {
    console.warn("Duplicate user IDs detected", {
      duplicates: userIds.filter((id, index) => userIds.indexOf(id) !== index),
    });
  }
  const invalidUsers = users.filter((u) => !u._id);
  if (invalidUsers.length) {
    console.warn(`Found ${invalidUsers.length} users with missing IDs`, {
      users: invalidUsers.map((u) => u.username),
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="h-12 bg-muted animate-pulse rounded"
          />
        ))}
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={user._id || `fallback-${index}`}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {isAdmin && onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {isAdmin && (
                        <DropdownMenuItem
                          onClick={() => handleDelete(user._id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && <UserDetails user={selectedUser} />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserList;
