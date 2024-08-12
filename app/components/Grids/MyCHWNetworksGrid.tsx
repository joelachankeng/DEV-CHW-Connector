import { useEffect, useState } from "react";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import type {
  iWP_CHWNetwork,
  iWP_CHWNetworks,
} from "~/models/CHWNetwork.model";
import type { iGenericError } from "~/models/appContext.model";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import { APP_ROUTES } from "~/constants";
import MyGroupCard from "~/components/Cards/MyGroupCard";
import _ from "lodash";

export default function MyCHWNetworksGrid({
  networks,
  onReady,
  userId, // If userId is provided, the user is not the viewer
}: {
  networks?: iWP_CHWNetwork[];
  onReady?: (networks: iWP_CHWNetwork[]) => void;
  userId?: number;
}) {
  const [myNetworks, setMyNetworks] = useState<iWP_CHWNetwork[]>(
    networks || [],
  );
  const [updatedNetworks, setUpdatedNetworks] = useState<iWP_CHWNetwork[]>([]);
  const [updatingNetworksIds, setUpdatingNetworksIds] = useState<number[]>([]);

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
              const originalNetwork = myNetworks.find(
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
    } else {
      if ("id" in data) {
        setUpdatedNetworks((prev) => {
          return prev.filter(
            (network) => network.databaseId.toString() !== data.id,
          );
        });
      }
    }
  });

  const { state: networksFetchState, submit: networksFetchSubmit } =
    useAutoFetcher<iWP_CHWNetworks | iGenericError>(
      "/api/chw-network/getMemberships",
      (data) => {
        if ("error" in data) {
          console.error(data.error);
          return;
        }

        onReady && onReady(data.nodes);
        setMyNetworks(data.nodes);
        setUpdatedNetworks(_.cloneDeep(data.nodes));
        dispatchEvent(new CustomEvent("postsLoaded"));
      },
    );

  useEffect(() => {
    if (networks === undefined)
      networksFetchSubmit(
        {
          ...(userId && { userId: userId.toString() }),
        },
        "POST",
      );
  }, []);

  const handleRemoveMembership = (networkId: number) => {
    setUpdatingNetworksIds((prev) => [...prev, networkId]);

    followingFetchSubmit(
      {
        networkId: networkId.toString(),
        action: "REMOVE",
      },
      "POST",
    );
  };

  return (
    <>
      {networksFetchState !== "idle" ? (
        <div className="mx-auto my-8 flex cursor-progress justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="my-4 grid items-start gap-4 max-md:-mx-5 max-md:gap-0 md:grid-cols-2 lg:grid-cols-4">
          {updatedNetworks.length > 0 &&
            updatedNetworks
              .filter((network) => network.chwNetworksFields.isMember)
              .map((network: iWP_CHWNetwork, index) => (
                <MyGroupCard
                  key={network.databaseId}
                  className={
                    index === updatedNetworks.length - 1
                      ? "max-md:!border-b-0"
                      : ""
                  }
                  title={network.title}
                  image={network.featuredImage.node.mediaItemUrl}
                  membersCount={network.chwNetworksFields.totalMembers}
                  url={`${APP_ROUTES.CHW_NETWORKS}/${network.databaseId}`}
                  text={{
                    view: "View",
                    unfollow: userId ? "" : "Unfollow",
                  }}
                  isLoading={updatingNetworksIds.includes(network.databaseId)}
                  onUnFollow={() => {
                    handleRemoveMembership(network.databaseId);
                  }}
                />
              ))}
        </div>
      )}
    </>
  );
}
