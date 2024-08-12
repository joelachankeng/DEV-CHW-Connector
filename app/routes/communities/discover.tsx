import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useOutletContext } from "@remix-run/react";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import PublicHealthAlertsBanner from "~/components/PublicHealthAlertsBanner/PublicHealthAlertsBanner";
import type { iGenericError } from "~/models/appContext.model";
import { requireUserSession } from "~/servers/userSession.server";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import type { iWP_Communites, iWP_Community } from "~/models/community.model";
import GroupFollowCard from "~/components/Cards/GroupFollowCard";
import { APP_CLASSNAMES, APP_ROUTES } from "~/constants";
import type { iCommunitiesContextState } from "../communities";
import { calculateOverlappingDistance, classNames } from "~/utilities/main";
import FullWidthContainer from "~/components/Containers/FullWidthContainer";

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserSession(request);

  return json({});
};
export default function CommunitiesDiscover() {
  const { layoutContext } = useOutletContext<iCommunitiesContextState>();

  const containerElement = useRef<HTMLDivElement>(null);

  const [communities, setCommunities] = useState<iWP_Community[]>([]);
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
              const originalCommunity = communities.find(
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
    }
  });

  const { state: communitiesFetchState, submit: communitiesFetchSubmit } =
    useAutoFetcher<iWP_Communites | iGenericError>(
      "/api/community/getAll",
      (data) => {
        if ("error" in data) {
          console.error(data.error);
          return;
        }

        setCommunities(data.nodes);
        setUpdatedCommunities(_.cloneDeep(data.nodes));
        console.log(data);

        dispatchEvent(new CustomEvent("postsLoaded"));
      },
    );

  useEffect(() => {
    communitiesFetchSubmit({}, "POST");
    dispatchEvent(new CustomEvent("postsLoaded"));
  }, []);

  useEffect(() => {
    if (!containerElement.current) return;
    dispatchEvent(new CustomEvent("postsLoaded"));
  }, [containerElement.current?.clientHeight]);

  const handleUpdateFollowing = (
    following: "REMOVE" | "ADD",
    communityId: number,
  ) => {
    setUpdatedCommunitiesIds((prev) => [...prev, communityId]);

    setUpdatedCommunities((prev) =>
      prev.map((community) => {
        if (community.databaseId === communityId) {
          const originalCommunity = communities.find(
            (n) => n.databaseId === communityId,
          );
          if (!originalCommunity) {
            community.communitiesFields.totalMembers +=
              following === "ADD" ? 1 : -1;
          } else {
            const isMember = originalCommunity.communitiesFields.isMember;
            const originalCount =
              originalCommunity.communitiesFields.totalMembers;
            if (isMember) {
              community.communitiesFields.totalMembers =
                following === "ADD" ? originalCount : originalCount - 1;
            } else {
              community.communitiesFields.totalMembers =
                following === "ADD" ? originalCount + 1 : originalCount;
            }
            community.communitiesFields.isMember = following === "ADD";
          }
        }
        return community;
      }),
    );

    followingFetchSubmit(
      {
        communityId: communityId.toString(),
        action: following,
      },
      "POST",
    );
  };

  return (
    <>
      <FullWidthContainer>
        {layoutContext.alert && (
          <div className={classNames(APP_CLASSNAMES.CONTAINER, "!py-0")}>
            <PublicHealthAlertsBanner alert={layoutContext.alert} />
          </div>
        )}
        <div className="flex items-center justify-between gap-2.5 pb-1 text-base font-semibold text-[#032525]">
          <div className="w-full">
            <h2 className="mb-2 font-bold">Discoverable Communities</h2>
            <hr />
            {communitiesFetchState !== "idle" ? (
              <div className="mx-auto my-8 flex cursor-progress justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="my-4 grid items-start gap-4 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {updatedCommunities.length > 0 &&
                  updatedCommunities.map((community: iWP_Community) => (
                    <GroupFollowCard
                      key={community.databaseId}
                      image={community.featuredImage.node.mediaItemUrl}
                      title={community.title}
                      membersCount={community.communitiesFields.totalMembers}
                      url={`${APP_ROUTES.COMMUNITIES}/${community.databaseId}`}
                      text={{
                        follow: "Join this Community",
                        unfollow: "Unjoin",
                      }}
                      isMember={community.communitiesFields.isMember}
                      isLoading={updatedCommunitiesIds.includes(
                        community.databaseId,
                      )}
                      onFollow={(following) =>
                        handleUpdateFollowing(following, community.databaseId)
                      }
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </FullWidthContainer>
    </>
  );
}
