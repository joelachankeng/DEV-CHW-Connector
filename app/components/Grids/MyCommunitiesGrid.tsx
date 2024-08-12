import _ from "lodash";
import { useEffect, useState } from "react";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import type { iGenericError } from "~/models/appContext.model";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import type { iWP_Communites, iWP_Community } from "~/models/community.model";
import MyGroupCard from "~/components/Cards/MyGroupCard";
import { APP_ROUTES } from "~/constants";

export default function MyCommunitiesGrid({
  communities,
  onReady,
  userId, // If userId is provided, the user is not the viewer
}: {
  communities?: iWP_Community[];
  onReady?: (communities: iWP_Community[]) => void;
  userId?: number;
}) {
  const [myCommunities, setMyCommunities] = useState<iWP_Community[]>(
    communities || [],
  );
  const [updatedCommunities, setUpdatedCommunities] = useState<iWP_Community[]>(
    [],
  );
  const [updatedCommunitiesIds, setUpdatedCommunitiesIds] = useState<number[]>(
    [],
  );

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
    useAutoFetcher<iWP_Communites | iGenericError>(
      "/api/community/getMemberships",
      (data) => {
        if ("error" in data) {
          console.error(data.error);
          return;
        }

        onReady && onReady(data.nodes);
        setMyCommunities(data.nodes);
        setUpdatedCommunities(_.cloneDeep(data.nodes));
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

  return (
    <>
      {communitiesFetchState !== "idle" ? (
        <div className="mx-auto my-8 flex cursor-progress justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="my-4 grid items-start gap-4 max-md:-mx-5 max-md:gap-0 md:grid-cols-2 lg:grid-cols-4">
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
      )}
    </>
  );
}
