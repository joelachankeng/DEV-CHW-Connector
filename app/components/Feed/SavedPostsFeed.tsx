import { useState, useEffect } from "react";
import type { iGenericError } from "~/models/appContext.model";
import type { iWP_Post, iWP_Posts } from "~/models/post.model";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import LoadingSpinner from "../Loading/LoadingSpinner";
import Post from "../Posts/Post";

export default function SavedPostsFeed() {
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<iWP_Post[]>([]);
  const [sortError, setSortError] = useState<iGenericError | undefined>(
    undefined,
  );

  const postsFetcherAction = (data: iWP_Posts | iGenericError) => {
    if (!mounted) setMounted(true);
    if ("error" in data) {
      setSortError(data);
      return;
    }
    setPosts(data.nodes);
  };
  const { state: postFetchState, submit: postFetchSubmit } = useAutoFetcher<
    iWP_Posts | iGenericError
  >("/api/feed/getAllSavedPosts", postsFetcherAction);

  // TOFIX: I want to get rid of this useEffect but doing that prevents the overflowing useEffect on Post.tsx from running
  useEffect(() => {
    if (mounted) return;
    postFetchSubmit({}, "POST");
    setMounted(true);
  }, [mounted, postFetchSubmit]);

  return (
    <>
      {mounted === false || postFetchState !== "idle" ? (
        <div className="mx-auto my-8 cursor-progress">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {sortError ? (
            <div className="text-basetext-[#032525] flex flex-col gap-2 text-center">
              <p className="font-semibold ">
                An error occurred while retrieving your saved posts. Please try
                again.
              </p>
              <p>{sortError.error}</p>
              {sortError.error_description && (
                <p>{sortError.error_description}</p>
              )}
            </div>
          ) : (
            <>
              {posts.length === 0 ? (
                <div className="text-center text-base text-[#032525]">
                  You have no saved posts.
                </div>
              ) : (
                <>
                  {posts.map((post) => (
                    <Post key={post.databaseId} post={post} />
                  ))}
                  <p className="text-center">
                    You reached the end of all your saved posts.
                  </p>
                  {/* <Post post={posts[0]} /> */}
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
