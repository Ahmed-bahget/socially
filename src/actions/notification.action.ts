"use server";

import prisma from "@/lib/prisma";
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

export async function getNotifications() {
    try {
    const userId = await getDbUserId();
    if(!userId) return [];

    // Check cache first
    const cacheKey = `notifications-${userId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const notifications = await prisma.notification.findMany({
        where:{
            userId,
        },
        include:{
            creator:{
                select:{
                    id:true,
                    name:true,
                    username:true,
                    image:true
                }
            },
            post:{
                select:{
                    id:true,
                    content:true,
                    image:true
                }
            },
            comment:{
                select:{
                    id:true,
                    content:true,
                    createdAt:true
                }
            }
        },
        orderBy:{
            createdAt:"desc"
        }
        
    })
    
    // Cache the result
    setCachedData(cacheKey, notifications);
    return notifications;
    } catch (error) {
        console.error("error in get notifications", error);
        throw new Error("failed to fetch notification");
    }
}

export async function markNotificationAsRead(notificationIds: string[]){
    try {
        await prisma.notification.updateMany({
            where:{
                id:{
                    in: notificationIds,
                },
            },
            data:{
                read: true
            }
        })

        return {success: true}
    } catch (error) {
        console.error("err mark notification as read", error);
        return {success: false};
    }
}