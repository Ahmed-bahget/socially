"use client";
import { BellIcon, HomeIcon, LogOutIcon, MenuIcon, MoonIcon, SunIcon, UserIcon } from "lucide-react"
import { ModeToggle } from "./ModeToggle"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"
import { Button } from "./ui/button"
import Link from "next/link"
import { SignInButton, SignOutButton, useAuth } from "@clerk/nextjs"
import { useState } from "react";
import { useTheme } from "next-themes";

export const MobileNav = ({ username }: { username: string }) => {
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const { isSignedIn } = useAuth();
    const { theme, setTheme } = useTheme();
    return (
        <div className="flex md:hidden items-center space-x-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="mr-2"
            >
                <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
            </Button>
            <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MenuIcon />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]" >
                    <SheetHeader>
                        <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-col space-y-4 mt-6">
                        <Button variant="ghost" className="justify-start " asChild>
                            <Link href="/" className="flex items-center gap-3 ">
                                <HomeIcon />
                                Home
                            </Link>
                        </Button>
                        {isSignedIn ?
                            (
                                <>
                                    <Button variant="ghost" className="flex items-center gap-3 justify-start " asChild>
                                        <Link href="/notification">
                                            <BellIcon />
                                            Notification
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" className="flex items-center gap-3 justify-start " asChild>
                                        <Link href={`/profile/${username}`}>
                                            <UserIcon />
                                            Profile
                                        </Link>
                                    </Button>
                                    <SignOutButton>
                                        <Button variant="ghost" className="flex items-center gap-3 justify-start w-full">
                                            <LogOutIcon />
                                            Log Out
                                        </Button>
                                    </SignOutButton>
                                </>
                            )
                            :
                            (
                                <SignInButton mode="modal">
                                    <Button variant="ghost" className="w-full bg-slate-200">
                                        Sign In
                                    </Button>
                                </SignInButton>
                            )

                        }

                    </nav>
                </SheetContent>
            </Sheet>
        </div>
    )
}

