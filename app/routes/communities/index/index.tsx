import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useOutletContext } from "@remix-run/react";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import { ListBoxField } from "~/components/Forms/ListBoxField";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import Post from "~/components/Posts/Post";
import PublicHealthAlertsBanner from "~/components/PublicHealthAlertsBanner/PublicHealthAlertsBanner";
import { APP_CLASSNAMES } from "~/constants";
import type { iWP_Posts_Pagination } from "~/controllers/feed.control";
import type { iGenericError } from "~/models/appContext.model";
import type { iWP_Post } from "~/models/post.model";
import type { iCommunitiesContextState } from "~/routes/communities";
import { requireUserSession } from "~/servers/userSession.server";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import { usePagination } from "~/utilities/hooks/usePagination";

const sortByOptions = ["Recent", "Popular"];
const sortByOptionsMap = sortByOptions.map((option) => ({
  label: _.startCase(option),
  value: option.toLowerCase(),
}));

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserSession(request);
  return json({});
};

export default function CommunitiesMyFeed() {
  const { layoutContext } = useOutletContext<iCommunitiesContextState>();

  const containerElement = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [sortBy, setSortBy] =
    useState<(typeof sortByOptions)[number]>("recent");
  const [posts, setPosts] = useState<iWP_Post[]>([]);
  const [sortError, setSortError] = useState<iGenericError | undefined>(
    undefined,
  );
  const [sortHasChanged, setSortHasChanged] = useState(false);

  const postsFetcherAction = (data: iWP_Posts_Pagination | iGenericError) => {
    if (!mounted) setMounted(true);
    if (sortHasChanged) setSortHasChanged(false);

    if ("error" in data) {
      setSortError(data);
      return;
    }

    if (pagination.isLoading) {
      setPagination({
        isLoading: false,
        pageInfo: data.pageInfo,
      });
      setPosts([...posts, ...data.nodes]);
    } else {
      setPagination({
        isLoading: false,
        pageInfo: data.pageInfo,
      });
      setPosts(data.nodes);
    }
    dispatchEvent(new CustomEvent("postsLoaded"));
  };
  const { state: postFetchState, submit: postFetchSubmit } = useAutoFetcher<
    iWP_Posts_Pagination | iGenericError
  >("/api/feed/getAllPosts", postsFetcherAction);

  const handleOnChangeSortBy = (value: string) => {
    if (value === sortBy) return;
    postFetchSubmit(
      {
        sortBy: value,
        type: "COMMUNITIES",
      },
      "POST",
    );
    setSortError(undefined);
    setSortBy(value as (typeof sortByOptions)[number]);
    setSortHasChanged(true);
  };

  // TOFIX: I want to get rid of this useEffect but doing that prevents the overflowing useEffect on Post.tsx from running
  useEffect(() => {
    postFetchSubmit(
      {
        sortBy: sortBy,
        type: "COMMUNITIES",
      },
      "POST",
    );
  }, []);

  useEffect(() => {
    if (!containerElement.current) return;
    dispatchEvent(new CustomEvent("postsLoaded"));
  }, [containerElement.current?.clientHeight]);

  const { pagination, setPagination, LoadMoreButton } = usePagination(
    containerElement,
    () => {
      if (postFetchState !== "idle" || !pagination.pageInfo) {
        return;
      }
      postFetchSubmit(
        {
          sortBy: sortBy,
          type: "COMMUNITIES",
          after: pagination.pageInfo.endCursor,
        },
        "POST",
      );
    },
  );

  return (
    <>
      <div ref={containerElement} className={APP_CLASSNAMES.CONTAINER}>
        {layoutContext.alert && (
          <PublicHealthAlertsBanner alert={layoutContext.alert} />
        )}
        <div className="flex items-center justify-between gap-2.5 border-b border-solid border-b-[#C1BAB4] pb-1 text-base font-semibold text-[#686867] ">
          <h1 className="">Activity</h1>
          <div className="flex items-center gap-[15px]">
            <ListBoxField
              classes={{
                parent: {
                  className: "flex items-center gap-[15px]",
                  override: true,
                },
                label: {
                  className: "",
                  override: true,
                },
                select: {
                  className: "text-[#032525] font-semibold",
                },
              }}
              label="Sort By:"
              name="activity-sort-by"
              defaultValue={sortBy}
              options={sortByOptionsMap}
              // onChange={(value) => setSortBy(value)}
              onChange={(value) => handleOnChangeSortBy(value)}
              position="right"
            />
          </div>
        </div>
        {/* <PostCommentsThread
              root={true}
              totalComments={{
                count: fakeComments.length,
                collection: fakeComments,
              }}
            /> */}
        {mounted === false || sortHasChanged ? (
          <div className="mx-auto my-8 cursor-progress">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {sortError ? (
              <div className="text-basetext-[#032525] flex flex-col gap-2 text-center">
                <p className="font-semibold ">
                  An error occurred while retrieving your feed. Please try
                  again.
                </p>
                <p>{sortError.error}</p>
                {sortError.error_description && (
                  <p>{sortError.error_description}</p>
                )}
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <Post key={post.databaseId} post={post} />
                ))}

                <div className="mx-auto my-8 flex flex-col items-center justify-center">
                  {postFetchState !== "idle" ? (
                    <LoadingSpinner className="cursor-progress" />
                  ) : (
                    <>
                      {pagination.pageInfo &&
                        (pagination.pageInfo.hasNextPage ? (
                          <LoadMoreButton />
                        ) : (
                          <p className="text-center">
                            You reached the end of the feed.
                          </p>
                        ))}
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
