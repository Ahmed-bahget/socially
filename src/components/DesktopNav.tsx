import { ModeToggle } from "./ModeToggle";
import { Button } from "./ui/button";
import { BellIcon, Ghost, Home, HomeIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { currentUser } from '@clerk/nextjs/server';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export const DesktopNav = async ({username}: {username:string}) => {
    const user = await currentUser();
    
    return (
        <div className="hidden md:flex items-center space-x-3">
            <ModeToggle />

            <Button variant='ghost' className="flex items-center gap-2" asChild >
                <Link href='/'>
                    <Home className="w-4 h-4" />
                    <span className=" hidden lg:inline ">Home</span>
                </Link>
            </Button>

            {
                user ? (
                    <>
                        <Button variant="ghost" className="" asChild>
                            <Link href="/notifications">
                            <BellIcon/>
                            <span>Notification</span>
                            </Link>
                        </Button>
                        <Button variant="ghost" className="" asChild>
                            <Link href={`/profile/${username}`}>
                                <UserIcon/>
                                <span>Profile</span>
                            </Link>
                        </Button>
                        <SignedIn >
                            <UserButton />
                        </SignedIn>
                        
                    </>)
                    :
                    (
                        <SignInButton mode="modal">
                            <Button variant='default'>Sign In</Button>
                        </SignInButton>)
            }
        </div>
    )
}