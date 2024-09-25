import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useOutletContext } from "@remix-run/react";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import PublicHealthAlertsBanner from "~/components/PublicHealthAlertsBanner/PublicHealthAlertsBanner";
import type { iWP_CHWNetwork } from "~/models/CHWNetwork.model";
import type { iGenericError } from "~/models/appContext.model";
import { requireUserSession } from "~/servers/userSession.server";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import GroupFollowCard from "~/components/Cards/GroupFollowCard";
import { APP_CLASSNAMES, APP_ROUTES } from "~/constants";
import type { iCHWNetworkContextState } from "../chw-networks";
import FullWidthContainer from "~/components/Containers/FullWidthContainer";
import { classNames } from "~/utilities/main";
import { usePagination } from "~/utilities/hooks/usePagination";
import type { iWP_CHWNetwork_Pagination } from "~/controllers/CHWNetwork.control";

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserSession(request);

  return json({});
};

export default function CHWNetworksDiscover() {
  const { layoutContext } = useOutletContext<iCHWNetworkContextState>();

  const containerElement = useRef<HTMLDivElement>(null);
  const paginationContainerElement = useRef<HTMLDivElement>(null);

  const [networks, setNetworks] = useState<iWP_CHWNetwork[]>([]);
  const [updatedNetworks, setUpdatedNetworks] = useState<iWP_CHWNetwork[]>([]);
  const [updatingNetworksIds, setUpdatingNetworksIds] = useState<number[]>([]);
  const [sortHasChanged, setSortHasChanged] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { submit: followingFetchSubmit } = useAutoFetcher<
    { id: string; result: string } | (iGenericError & { id: string })
  >("/api/chw-network/updateMember", (data) => {
    if ("id" in data) {
      const parsenetworkId = parseInt(data.id);
      if (updatingNetworksIds.includes(parsenetworkId)) {
        setUpdatingNetworksIds((prev) =>
          prev.filter((id) => id !== parsenetworkId),
        );
      }
    }

    if ("error" in data) {
      console.error(data.error);
      if ("id" in data) {
        setUpdatedNetworks((prev) =>
          prev.map((network) => {
            if (network.databaseId.toString() === data.id) {
              const originalNetwork = networks.find(
                (n) => n.databaseId.toString() === data.id,
              );

              if (originalNetwork) {
                network.chwNetworksFields.isMember =
                  originalNetwork.chwNetworksFields.isMember;
                network.chwNetworksFields.totalMembers =
                  originalNetwork.chwNetworksFields.totalMembers;
              }
            }
            return network;
          }),
        );
        return;
      }
    }
  });

  const { state: networksFetchState, submit: networksFetchSubmit } =
    useAutoFetcher<iWP_CHWNetwork_Pagination | iGenericError>(
      "/api/chw-network/getAll",
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
          newPosts = [...networks, ...data.nodes];
        } else {
          setPagination({
            isLoading: false,
            pageInfo: data.pageInfo,
          });
        }

        setNetworks(newPosts);
        setUpdatedNetworks(_.cloneDeep(newPosts));
        console.log(data);
        dispatchEvent(new CustomEvent("postsLoaded"));
      },
    );

  useEffect(() => {
    networksFetchSubmit({}, "POST");
    dispatchEvent(new CustomEvent("postsLoaded"));
  }, []);

  useEffect(() => {
    if (!containerElement.current) return;
    dispatchEvent(new CustomEvent("postsLoaded"));
  }, [containerElement.current?.clientHeight]);

  const { pagination, setPagination, LoadMoreButton } = usePagination(
    paginationContainerElement,
    () => {
      if (networksFetchState !== "idle" || !pagination.pageInfo) {
        return;
      }
      networksFetchSubmit(
        {
          // sortBy: sortBy,
          after: pagination.pageInfo.endCursor,
        },
        "POST",
      );
    },
  );

  const handleUpdateFollowing = (
    following: "REMOVE" | "ADD",
    networkId: number,
  ) => {
    setUpdatingNetworksIds((prev) => [...prev, networkId]);
    setUpdatedNetworks((prev) =>
      prev.map((network) => {
        if (network.databaseId === networkId) {
          const originalNetwork = networks.find(
            (n) => n.databaseId === networkId,
          );
          if (!originalNetwork) {
            network.chwNetworksFields.totalMembers +=
              following === "ADD" ? 1 : -1;
          } else {
            const isMember = originalNetwork.chwNetworksFields.isMember;
            const originalCount =
              originalNetwork.chwNetworksFields.totalMembers;
            if (isMember) {
              network.chwNetworksFields.totalMembers =
                following === "ADD" ? originalCount : originalCount - 1;
            } else {
              network.chwNetworksFields.totalMembers =
                following === "ADD" ? originalCount + 1 : originalCount;
            }
            network.chwNetworksFields.isMember = following === "ADD";
          }
        }
        return network;
      }),
    );

    followingFetchSubmit(
      {
        networkId: networkId.toString(),
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
            <h2 className="mb-2 font-bold">Discoverable CHW Networks</h2>
            <hr />
            {mounted === false || sortHasChanged ? (
              <div className="mx-auto my-8 flex cursor-progress justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                <div
                  ref={paginationContainerElement}
                  className="my-4 grid items-start gap-4 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                >
                  {updatedNetworks.length > 0 &&
                    updatedNetworks.map((network: iWP_CHWNetwork) => (
                      <GroupFollowCard
                        key={network.databaseId}
                        image={network.featuredImage.node.mediaItemUrl}
                        title={network.title}
                        membersCount={network.chwNetworksFields.totalMembers}
                        url={`${APP_ROUTES.CHW_NETWORKS}/${network.databaseId}`}
                        text={{
                          follow: "Follow this CHW Network",
                          unfollow: "Unfollow",
                        }}
                        isMember={network.chwNetworksFields.isMember}
                        isLoading={updatingNetworksIds.includes(
                          network.databaseId,
                        )}
                        onFollow={(following) =>
                          handleUpdateFollowing(following, network.databaseId)
                        }
                      />
                    ))}
                </div>
                <div className="mx-auto my-8 flex flex-col items-center justify-center">
                  {networksFetchState !== "idle" ? (
                    <LoadingSpinner className="cursor-progress" />
                  ) : (
                    <>
                      {pagination.pageInfo &&
                        pagination.pageInfo.hasNextPage && <LoadMoreButton />}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </FullWidthContainer>
    </>
  );
}
