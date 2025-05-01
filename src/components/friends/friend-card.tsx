import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserCircle } from "lucide-react";

type FriendCardProps = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  level?: number | null;
  onRemove?: (id: string) => void;
};

export default function FriendCard({
  id,
  name,
  full_name,
  email,
  avatar_url,
  level = 1,
  onRemove,
}: FriendCardProps) {
  const displayName = full_name || name || email?.split("@")[0] || "User";

  return (
    <Card className="overflow-hidden hover:border-purple-200 transition-all">
      <CardHeader className="pb-2 flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12 border border-purple-200">
          {avatar_url ? (
            <AvatarImage src={avatar_url} alt={displayName} />
          ) : (
            <AvatarFallback className="bg-purple-100">
              <UserCircle className="h-6 w-6 text-purple-600" />
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-base">{displayName}</h3>
          <p className="text-sm text-gray-500">{email}</p>
        </div>
        <div className="text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5 border border-yellow-300">
          Lv{level}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex justify-end">
          {onRemove && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemove(id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              Remove Friend
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
