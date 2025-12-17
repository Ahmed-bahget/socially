import { getPosts } from "@/actions/post.actions";
import { getDbUserId } from "@/actions/user.actions";
import CreatePost from "@/components/CreatePost";
import WhoToFollow from "@/components/WhoToFollow";
import { currentUser } from "@clerk/nextjs/server";
import PostFeed from "@/components/PostFeed";

export default async function Home() {
  const user = await currentUser();
  const posts = await getPosts(1, 10); // Get first page with 10 posts
  const dbUserId = await getDbUserId();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-6">
        {user ? <CreatePost /> : null}
        <PostFeed initialPosts={posts || []} dbUserId={dbUserId} />
      </div>
      <div className="hidden lg:block lg:col-span-4 sticky top-20">
        <WhoToFollow />
      </div>
    </div>
  );
}