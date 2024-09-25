import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import type { iGenericError } from "~/models/appContext.model";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import type { iWP_Community } from "~/models/community.model";
import MyGroupCard from "~/components/Cards/MyGroupCard";
import { APP_ROUTES } from "~/constants";
import { usePagination } from "~/utilities/hooks/usePagination";
import type { iWP_Communites_Pagination } from "~/controllers/community.control";

export default function MyCommunitiesGrid({
  communities,
  onReady,
  userId, // If userId is provided, the user is not the viewer
}: {
  communities?: iWP_Community[];
  onReady?: (communities: iWP_Community[], total: number) => void;
  userId?: number;
}) {
  const containerElement = useRef<HTMLDivElement>(null);

  const [myCommunities, setMyCommunities] = useState<iWP_Community[]>(
    communities || [],
  );
  const [updatedCommunities, setUpdatedCommunities] = useState<iWP_Community[]>(
    [],
  );
  const [updatedCommunitiesIds, setUpdatedCommunitiesIds] = useState<number[]>(
    [],
  );
  const [sortHasChanged, setSortHasChanged] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { submit: followingFetchSubmit } = useAutoFetcher<
    { id: string; result: string } | (iGenericError & { id: string })
  >("/api/community/updateMember", (data) => {
    if ("id" in data) {
      const parseCommunityId = parseInt(data.id);
      if (updatedCommunitiesIds.includes(parseCommunityId)) {
        setUpdatedCommunitiesIds((prev) =>
          prev.filter((id) => id !== parseCommunityId),
        );
      }
    }

    if ("error" in data) {
      console.error(data.error);
      if ("id" in data) {
        setUpdatedCommunities((prev) =>
          prev.map((community) => {
            if (community.databaseId.toString() === data.id) {
              const originalCommunity = myCommunities.find(
                (c) => c.databaseId.toString() === data.id,
              );

              if (originalCommunity) {
                community.communitiesFields.isMember =
                  originalCommunity.communitiesFields.isMember;
                community.communitiesFields.totalMembers =
                  originalCommunity.communitiesFields.totalMembers;
              }
            }
            return community;
          }),
        );
        return;
      }
    } else {
      if ("id" in data) {
        // remove community from updatedCommunities
        setUpdatedCommunities((prev) => {
          return prev.filter(
            (community) => community.databaseId.toString() !== data.id,
          );
        });
      }
    }
  });

  const { state: communitiesFetchState, submit: communitiesFetchSubmit } =
    useAutoFetcher<iWP_Communites_Pagination | iGenericError>(
      "/api/community/getMemberships",
      (data) => {
        if (!mounted) setMounted(true);
        if (sortHasChanged) setSortHasChanged(false);

        if ("error" in data) {
          console.error(data.error);
          return;
        }

        let newPosts = data.nodes;
        if (pagination.isLoading) {
          setPagination({
            isLoading: false,
            pageInfo: data.pageInfo,
          });
          const mergeCommunities = [
            ...(communities || []),
            ...updatedCommunities,
          ];
          // remove any items with the same databaseId in data.nodes
          newPosts = newPosts.filter(
            (community) =>
              !mergeCommunities.some(
                (c) => c.databaseId === community.databaseId,
              ),
          );
          newPosts = [...mergeCommunities, ...newPosts];
        } else {
          setPagination({
            isLoading: false,
            pageInfo: data.pageInfo,
          });
        }

        if (!mounted) onReady && onReady(newPosts, data.pageInfo.total);
        setMyCommunities(newPosts);
        setUpdatedCommunities(_.cloneDeep(newPosts));
        dispatchEvent(new CustomEvent("postsLoaded"));
      },
    );

  useEffect(() => {
    if (communities === undefined)
      communitiesFetchSubmit(
        {
          ...(userId && { userId: userId.toString() }),
        },
        "POST",
      );
  }, []);

  const handleRemoveMembership = (communityId: number) => {
    setUpdatedCommunitiesIds((prev) => [...prev, communityId]);

    followingFetchSubmit(
      {
        communityId: communityId.toString(),
        action: "REMOVE",
      },
      "POST",
    );
  };

  const { pagination, setPagination, LoadMoreButton } = usePagination(
    containerElement,
    () => {
      if (communities) return;
      if (communitiesFetchState !== "idle" || !pagination.pageInfo) {
        return;
      }
      communitiesFetchSubmit(
        {
          ...(userId && { userId: userId.toString() }),
          after: pagination.pageInfo.endCursor,
        },
        "POST",
      );
    },
  );

  return (
    <>
      {mounted === false || sortHasChanged ? (
        <div className="mx-auto my-8 flex cursor-progress justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div
            ref={containerElement}
            className="my-4 grid items-start gap-4 max-md:-mx-5 max-md:gap-0 md:grid-cols-2 lg:grid-cols-4"
          >
            {updatedCommunities.length > 0 &&
              updatedCommunities
                .filter((community) => community.communitiesFields.isMember)
                .map((community: iWP_Community, index) => (
                  <MyGroupCard
                    key={community.databaseId}
                    className={
                      index === updatedCommunities.length - 1
                        ? "max-md:!border-b-0"
                        : ""
                    }
                    title={community.title}
                    image={community.featuredImage.node.mediaItemUrl}
                    membersCount={community.communitiesFields.totalMembers}
                    url={`${APP_ROUTES.COMMUNITIES}/${community.databaseId}`}
                    text={{
                      view: "View",
                      unfollow: userId ? "" : "Leave",
                    }}
                    isLoading={updatedCommunitiesIds.includes(
                      community.databaseId,
                    )}
                    onUnFollow={() => {
                      handleRemoveMembership(community.databaseId);
                    }}
                  />
                ))}
          </div>
          <div className="mx-auto my-8 flex flex-col items-center justify-center">
            {communitiesFetchState !== "idle" ? (
              <LoadingSpinner className="cursor-progress" />
            ) : (
              <>
                {pagination.pageInfo && pagination.pageInfo.hasNextPage && (
                  <LoadMoreButton />
                )}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
