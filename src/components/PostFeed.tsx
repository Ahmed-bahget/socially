"use client";

import { getPosts } from "@/actions/post.actions";
import PostCard from "@/components/PostCard";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

type Post = {
  id: string;
  content: string | null;
  image: string | null;
  createdAt: Date;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    username: string;
  };
  comments: {
    id: string;
    content: string;
    createdAt: Date;
    authorId: string;
    postId: string;
    author: {
      id: string;
      name: string | null;
      username: string;
      image: string | null;
    };
  }[];
  likes: {
    userId: string;
  }[];
  _count: {
    likes: number;
    comments: number;
  };
};

export default function PostFeed({ 
  initialPosts, 
  dbUserId 
}: { 
  initialPosts: Post[]; 
  dbUserId: string | null; 
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPosts.length === 10);
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement>(null);

  // Load more posts
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const nextPage = page + 1;
      const newPosts = await getPosts(nextPage, 10);
      
      if (newPosts && newPosts.length > 0) {
        setPosts(prev => [...prev, ...newPosts]);
        setPage(nextPage);
        setHasMore(newPosts.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  // Function to add a new post to the feed
  const addNewPost = useCallback((newPost: Post) => {
    console.log("Adding new post to feed:", newPost);
    setPosts(prev => [newPost, ...prev]);
  }, []);

  // Function to remove a post from the feed
  const removePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  }, []);

  // Handle post creation event
  useEffect(() => {
    const handlePostCreated = (event: CustomEvent) => {
      console.log("Received postCreated event:", event.detail);
      const newPost = event.detail as Post;
      addNewPost(newPost);
    };

    window.addEventListener('postCreated', handlePostCreated as EventListener);
    
    return () => {
      window.removeEventListener('postCreated', handlePostCreated as EventListener);
    };
  }, [addNewPost]);

  // Handle post deletion event
  useEffect(() => {
    const handlePostDeleted = (event: CustomEvent) => {
      const postId = event.detail as string;
      removePost(postId);
    };

    window.addEventListener('postDeleted', handlePostDeleted as EventListener);
    
    return () => {
      window.removeEventListener('postDeleted', handlePostDeleted as EventListener);
    };
  }, [removePost]);

  // Set up intersection observer
  useEffect(() => {
    if (loading) return;
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });

    if (lastPostRef.current) {
      observer.current.observe(lastPostRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loading, hasMore, loadMore]);

  return (
    <div className="space-y-6">
      {posts?.map((post: Post, index) => (
        <div 
          ref={index === posts.length - 1 ? lastPostRef : null}
          key={post.id}
        >
          <PostCard 
            post={post} 
            dbUserId={dbUserId} 
          />
        </div>
      ))}
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      
      {/* End of posts message */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-4 text-muted-foreground">
          You've reached the end of the posts
        </div>
      )}
    </div>
  );
}

// Export functions for use in other components
export { type Post, type Post as PostType };