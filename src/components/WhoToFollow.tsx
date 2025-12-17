import { getRandomUsers } from "@/actions/user.actions";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link";
import { Avatar } from "@radix-ui/react-avatar";
import { AvatarImage } from "./ui/avatar";
import FollowButton from "./FollowButton";

// Define the user type
type User = {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  _count: {
    followers: number;
  };
};

async function WhoToFollow() {
  const users = await getRandomUsers();
  if(users.length === 0 ) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Who to Follow</CardTitle>
      </CardHeader>
      <CardContent>
        {users?.map((user: User)=>(
          <div key={user.id} className="flex gap-4 items-center">
            <div className="flex gap-2 items-center">
              <Link href={`/profile/${user.username}`}>
                <Avatar>
                  <AvatarImage className="w-10 h-10" src={user.image ?? "/avatar.png"}/>
                </Avatar>
              </Link>
              <div className="text-xs">
                <Link href={`/profile/${user.username}`} className="font-medium cursor-pointer">
                  {user.name}
                </Link>
                <p className="text-muted-foreground">@{user.username}</p>
                <p className="text-muted-foreground">{user._count.followers}</p>
              </div>
            </div>
            <FollowButton userId={user.id} />
          </div>
        )
        )}
      </CardContent>
    </Card>
  )
}

export default WhoToFollow