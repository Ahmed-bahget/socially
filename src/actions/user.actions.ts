"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Simple in-memory cache for development that respects Next.js revalidation
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Track which cache keys should be invalidated
const invalidationTracker = new Set<string>();

function getCachedData(key: string) {
  // If this key was marked for invalidation, don't use cached data
  if (invalidationTracker.has(key)) {
    return null;
  }
  
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  // Only cache if this key wasn't marked for invalidation
  if (!invalidationTracker.has(key)) {
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Function to invalidate cache entries
function invalidateCache(pattern: string) {
  // Mark all keys matching the pattern for invalidation
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      invalidationTracker.add(key);
    }
  }
  
  // Clear the invalidation tracker periodically to prevent memory leaks
  setTimeout(() => {
    invalidationTracker.clear();
  }, CACHE_DURATION);
}

export async function syncUser(){
    try {
        const {userId} = await auth();
        const user = await currentUser();

        if(!userId || !user) return;

        const existingUser = await prisma.user.findUnique({
            where:{
                clerkId:userId
            }
        })
        
        if(existingUser) return existingUser;

        const dbUser = await prisma.user.create({
            data:{
                clerkId: userId,
                name:`${user.firstName || ""} ${user.lastName || ""}`,
                username:user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
                email:user.emailAddresses[0].emailAddress,
                image:user.imageUrl,
            }
        })  
        return dbUser;      
    } catch (error) {
        console.log("error in syncUser" , error)
    }

}

export async function getUserByClerkId(clerkId:string) {
    // Check cache first
    const cacheKey = `user-${clerkId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
    
    const user = await prisma.user.findUnique({
        where:{
            clerkId
        },
        include:{
            _count:{
                select:{
                    followers:true,
                    following:true,
                    posts:true,
                }
            }
        }
    })
    
    // Cache the result
    setCachedData(cacheKey, user);
    return user;
}

export async function getDbUserId(){
    const {userId:clerkId} = await auth();
    if(!clerkId) return null;
    const user = await getUserByClerkId(clerkId);
    if(!user) throw new Error("this user isn't found") 
    return user.id;

}

export async function getRandomUsers(){
    try {
        const userId = await getDbUserId();
        if(!userId) return [];
        
        // Check cache first
        const cacheKey = `random-users-${userId}`;
        const cached = getCachedData(cacheKey);
        if (cached) return cached;
        
        const randomUsers = await prisma.user.findMany({
            where:{
                AND:[
                    {NOT:{id:userId}},
                    {NOT:{followers:{
                        some:{
                            followerId:userId
                        }
                    }}}
                ]
            },
            select:{
                id:true,
                name:true,
                username:true,
                image:true,
                _count:{
                    select:{
                        followers:true
                    }
                }
            },
            take:3,
        })

        // Cache the result
        setCachedData(cacheKey, randomUsers);
        return randomUsers;
    } catch (error) {
        console.log("error fetching random users",error);
        return[];
    }
}

export async function toggleFollow(targetUserId:string) {
    try {
        const userId = await getDbUserId(); 
        if(!userId) return;
        if(userId === targetUserId) throw new Error("you can't follow yourself");

        const existingFollow = await prisma.follows.findUnique({
            where:{
                followerId_followingId:{
                    followerId:userId,
                    followingId:targetUserId,
                }
            }
        })

        if(existingFollow){
            await prisma.follows.delete({
                where:{
                    followerId_followingId:{
                    followerId:userId,
                    followingId:targetUserId,
                }
                }
            });
        }else{
            await prisma.$transaction([
                prisma.follows.create({
                    data:{
                        followerId:userId,
                        followingId:targetUserId,
                    }
                }),
                prisma.notification.create({
                    data:{
                        type:"FOLLOW",
                        userId:targetUserId,
                        creatorId:userId,
                    }
                })
            ])}
            
            // Invalidate related caches
            invalidateCache('random-users-');
            invalidateCache('user-');
            revalidatePath("/");
            return {success: true};
    } catch (error) {
        console.log("err in toggleFollow", error);
        return {success: false, error:"err in toggleFollow"}
    }
}