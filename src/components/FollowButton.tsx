"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { toggleFollow } from "@/actions/user.actions";

function FollowButton({userId}:{userId:string}) {
    const [isLoading,setIsLoading] = useState(false);
    const[isFollowing, setIsFollowing] = useState(false);

    const handleFollow =async ()=>{
        setIsLoading(true);
        setIsFollowing(!isFollowing);
        try {
            await toggleFollow(userId);
            toast.success("user followed successfully")
        } catch (error) {
            console.log("err while following",error);
            toast.error("err in following")
        }finally{
            setIsLoading(false);
        }

    }

  return (
    <Button
    size={"sm"}
    variant={"secondary"}
    onClick={handleFollow}
    disabled={isLoading}
    className="w-20"
    >
        {!isFollowing? (
            isLoading? <Loader2 className="size-4 animate-spin"/> : "Follow"
        ):(
            "Followed"
        )
        }
    </Button>
  )
}

export default FollowButton;
