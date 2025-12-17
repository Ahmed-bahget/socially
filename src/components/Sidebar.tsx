import { currentUser } from "@clerk/nextjs/server"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { getUserByClerkId } from "@/actions/user.actions";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { LinkIcon, MapIcon, MapPin } from "lucide-react";

async function Sidebar() {
    const authUser = await currentUser();
    if (!authUser) return <UnAuthenticatedSidebar />;
    
    const user = await getUserByClerkId(authUser.id);
    if(!user) return null;
    
    return (
        <div>
            <Card className="w-full max-w-sm">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                        <Link className="flex flex-col items-center text-center"
                                href={`/profile/${user.username}`}>
                            <Avatar className="w-20 h-20 border-2">
                                <AvatarImage src={user.image || "/avatar.png"} />
                            </Avatar>
                        <div className="mt-4 space-y-1">
                            <h3 className="font-semibold">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">{user.username}</p>
                        </div>
                        </Link>

                        {user.bio && <p className="mt-3 text-sm text-muted-foreground" >{user.bio}</p>}
                        <div className="w-full">
                            <Separator className="my-4"/>
                            <div className="flex justify-between gap-5">
                                <div>
                                    <p className="font-medium">{user._count.following}</p>
                                    <p className="text-xs text-muted-foreground">Following</p>
                                </div>
                                <Separator orientation="vertical"/>
                                <div>
                                    <div>
                                        <p className="font-medium">{user._count.followers}</p>
                                        <p className="text-xs text-muted-foreground">Followers</p>
                                    </div>
                                </div>
                            </div>
                            <Separator className="my-4"/>

                            <div className="flex flex-col gap-4 space-y-2 text-sm w-full">
                                <div className="flex items-center text-center text-muted-foreground gap-2">
                                    <MapPin/>
                                    {user.location || "No location"}
                                </div>
                                <div className="flex items-center text-center text-muted-foreground gap-2">
                                    <LinkIcon/>
                                    {user.website ? (
                                        <a href={`${user.website}`} className="hover:underline truncate" target="_blank">
                                            {user.website}
                                        </a>
                                    ):
                                    (<p>no website</p>)
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-2">

                </CardFooter>
            </Card>
        </div>
    )
}

export default Sidebar

function UnAuthenticatedSidebar() {
  return (
    <div>
      <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Welcome !</CardTitle>
        <CardDescription>
          Log in to access your profile or Sign up
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignInButton mode="modal">
            <Button variant="default" className="w-full ">Sign In</Button>
        </SignInButton>
        <SignUpButton mode="modal">
            <Button className="w-full mt-2" variant="default">
                Sign Up
            </Button>
        </SignUpButton>
      </CardContent>
      <CardFooter className="flex-col gap-2">

      </CardFooter>
    </Card>
    </div>
  )
}