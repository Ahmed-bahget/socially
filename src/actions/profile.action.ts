"use server"

import prisma from "@/lib/prisma"
import { useAuth } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.actions";

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

export async function getProfileByUsername(username: string) {

    try {
        // Check cache first
        const cacheKey = `profile-${username}`;
        const cached = getCachedData(cacheKey);
        if (cached) return cached;
        
        const user = await prisma.user.findUnique({
            where: { username: username },
            select: {
                id: true,
                name: true,
                username: true,
                bio: true,
                image: true,
                location: true,
                website: true,
                createdAt: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true,
                    },
                },
            },
        });
        
        // Cache the result
        setCachedData(cacheKey, user);
        return user;
    } catch (error) {
        console.error("Error fetching profile:", error);
        throw new Error("Failed to fetch profile");
    }
}


export async function getUserPosts(userId: string, page: number = 1, limit: number = 10) {
    try {
        const skip = (page - 1) * limit;
        
        const posts = await prisma.post.findMany({
            where: { authorId: userId },
            skip,
            take: limit,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                image: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: "asc"
                    },
                    take: 3 // Limit comments
                },
                likes: {
                    select: {
                        userId: true
                    },
                    take: 10 // Limit likes
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        return posts;
    } catch (error) {
        console.error("Error fetching user posts:", error);
        throw new Error("Failed to fetch user posts");
    }
}


export async function getUserLikedPosts(userId: string, page: number = 1, limit: number = 10) {
    try {
        const skip = (page - 1) * limit;
        
        const likedPosts = await prisma.post.findMany({
            where: {
                likes: {
                    some: {
                        userId
                    }
                }
            },
            skip,
            take: limit,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                image: true,
                            },
                        }
                    },
                    orderBy: {
                        createdAt: "asc"
                    },
                    take: 3 // Limit comments
                },
                likes: {
                    select: {
                        userId: true,
                    },
                    take: 10 // Limit likes
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return likedPosts;
    } catch (error) {
        console.error("Error fetching liked posts:", error);
        throw new Error("Failed to fetch liked posts");
    }
}

export async function updateProfile(formData: FormData) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");

        const name = formData.get("name") as string;
        const bio = formData.get("bio") as string;
        const location = formData.get("location") as string;
        const website = formData.get("website") as string;

        const user = await prisma.user.update({
            where: { clerkId },
            data: {
                name,
                bio,
                location,
                website,
            }
        })

        // Invalidate profile cache when updating
        invalidateCache('profile-');
        revalidatePath("/profile");
        return { success: true, user };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Failed to update profile" };
    }
}

export async function isFollowing(userId: string) {
    try {
        const currentUser = await getDbUserId();
        if (!currentUser) return false;

        const follow = await prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUser,
                    followingId: userId
                }
            }
        });

        return !!follow;
    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
    }
}