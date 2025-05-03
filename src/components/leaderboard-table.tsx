import { Avatar } from "./ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

type LeaderboardUser = {
  id: string;
  name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  level: number | null;
  xp: number | null;
};

interface LeaderboardTableProps {
  users: LeaderboardUser[];
  isLoading?: boolean;
}

export function LeaderboardTable({
  users,
  isLoading = false,
}: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-synthwave-neonPurple"></div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return <div className="text-center py-8 text-gray-500">No users found</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">Rank</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Level</TableHead>
            <TableHead className="text-right">XP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => {
            const displayName =
              user.display_name || user.name || "Anonymous User";

            return (
              <TableRow key={user.id}>
                <TableCell className="text-center font-medium">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <div className="h-full w-full rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-medium">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    </Avatar>
                    <span className="font-medium">{displayName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{user.level || 0}</TableCell>
                <TableCell className="text-right">{user.xp || 0}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
