import { format, parseISO, isValid } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Separator } from "../../components/ui/Separator";
import type { User } from "../../types/user";

interface UserDetailsProps {
  user: User;
}

const UserDetails = ({ user }: UserDetailsProps) => {
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-muted-foreground">Username</h4>
          <p className="text-lg font-semibold">{user.username}</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Email</h4>
          <p className="text-lg font-semibold">{user.email}</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Role</h4>
          <p className="text-lg font-semibold">{user.role}</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Created</h4>
          <p>{formatDate(user.createdAt)}</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Last Updated</h4>
          <p>{formatDate(user.updatedAt)}</p>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No additional user information available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDetails;
