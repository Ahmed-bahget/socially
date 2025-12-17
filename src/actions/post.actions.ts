"use server";
import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.actions";
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

export async function createPost(content: string, image: string) {
    try {
        const userId = await getDbUserId();
        if (!userId) return;

        const post = await prisma.post.create({
            data: {
                content,
                image,
                authorId: userId,
            },
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
                            }
                        }
                    },
                    orderBy: {
                        createdAt: "asc"
                    },
                    take: 3 // Limit comments per post
                },
                likes: {
                    select: {
                        userId: true
                    },
                    take: 10 // Limit likes per post if needed
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            }
        })

        // Invalidate post cache when creating new post
        invalidateCache('posts-');
        revalidatePath("/");

        return { success: true, post }
    } catch (error) {
        console.log(error);
        return { success: false, error: "failed to create post" }
    }
}

export async function getPosts(page: number = 1, limit: number = 10) {
    try {
        const skip = (page - 1) * limit;
        
        // Check cache first
        const cacheKey = `posts-${page}-${limit}`;
        const cached = getCachedData(cacheKey);
        if (cached) return cached;
        
        const posts = await prisma.post.findMany({
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc"
            },
            include: {
                author: {
                    select: {
                        id:true,
                        name: true,
                        image: true,
                        username: true
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                image: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: "asc"
                    },
                    take: 3 // Limit comments per post
                },
                likes: {
                    select: {
                        userId: true
                    },
                    take: 10 // Limit likes per post if needed
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            }
        })

        // Cache the result
        setCachedData(cacheKey, posts);
        return posts;

    } catch (error) {
        console.log("err in getting posts", error)
        return []; // Return empty array instead of undefined
    }
}

export async function toggleLike(postId: string) {
    try {
        const userId = await getDbUserId();
        if (!userId) return { success: false, error: "User not authenticated" };
        
        // Validate postId
        if (!postId) return { success: false, error: "Post ID is required" };

        const existingLIKE = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId
                },
            }
        });

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true }
        });
        
        if (!post) return { success: false, error: "Post not found" };

        if (existingLIKE) {
            await prisma.like.delete({
                where: {
                    userId_postId: {
                        userId,
                        postId
                    },
                }
            });
        } else {
            await prisma.$transaction([
                prisma.like.create({
                    data: {
                        userId,
                        postId
                    },
                }),

                ...(post.authorId !== userId ?
                    [prisma.notification.create({
                        data: {
                            type: "LIKE",
                            userId: post.authorId,
                            creatorId: userId,
                            postId
                        }
                    })]
                    : []
                )
            ])
        }

        // Invalidate post cache when toggling like
        invalidateCache('posts-');
        revalidatePath("/");
        return { success: true }
    } catch (error) {
        console.log("err in like post", error)
        return { success: false, error: "Failed to toggle like" };
    }
}

export async function createComment(postId: string, content: string) {
    try {
        const userId = await getDbUserId();
        if (!userId) return { success: false, error: "User not authenticated" };
        if (!content) return { success: false, error: "Content is required" };
        
        // Validate postId
        if (!postId) return { success: false, error: "Post ID is required" };

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true }
        });

        if (!post) return { success: false, error: "Post not found" };

        const [comment] = await prisma.$transaction(async (tx) => {
            const newComment = await tx.comment.create({
                data: {
                    content,
                    authorId: userId,
                    postId
                },
            });

            if (post.authorId !== userId) {
                await tx.notification.create({
                    data: {
                        type: "COMMENT",
                        userId: post.authorId,
                        creatorId: userId,
                        postId,
                        commentId: newComment.id
                    }
                })
            }
            return [newComment]
        });

        // Invalidate post cache when creating comment
        invalidateCache('posts-');
        revalidatePath(`/posts/${postId}`);
        return { success: true, comment };

    } catch (error) {
        console.log("Failed to comment", error);
        return { success: false, error: "Failed to comment" }
    }

}

export async function deletePost(postId: string) {
    try {
        const userId = await getDbUserId();
        if (!userId) return { success: false, error: "User not authenticated" };

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true }
        });

        if (!post) return { success: false, error: "Post not found" };
        if (post.authorId !== userId) return { success: false, error: "You are not authorized to delete this post" };

        await prisma.post.delete({
            where: { id: postId }
        });

        // Invalidate post cache when deleting post
        invalidateCache('posts-');
        revalidatePath("/");
        return {success: true}

    } catch (error) {
        console.error("Failed to delete post:",error);
        return {success:false, error:"Failed to delete post"};
    }
}