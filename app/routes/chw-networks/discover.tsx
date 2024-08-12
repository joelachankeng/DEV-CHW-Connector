import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData, Link, useOutletContext } from "@remix-run/react";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import SVGDiscover from "~/assets/SVGs/SVGDiscover";
import SVGFeed from "~/assets/SVGs/SVGFeed";
import SVGMyCHWNetworks from "~/assets/SVGs/SVGMyCHWNetworks";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import Page from "~/components/Pages/Page";
import PublicHealthAlertsBanner from "~/components/PublicHealthAlertsBanner/PublicHealthAlertsBanner";
import SideBar from "app/components/SideBars/LeftSideBar";
import { publicHealthAlert } from "~/controllers/publicHealthAlert.control";
import { iWP_CHWNetwork, iWP_CHWNetworks } from "~/models/CHWNetwork.model";
import { iGenericError, iGenericSuccess } from "~/models/appContext.model";
import { iWP_PublicHealthAlert } from "~/models/publicHealthAlert.model";
import { requireUserSession } from "~/servers/userSession.server";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import GroupFollowCard from "~/components/Cards/GroupFollowCard";
import { APP_CLASSNAMES, APP_ROUTES } from "~/constants";
import { iCHWNetworkContextState } from "../chw-networks";
import FullWidthContainer from "~/components/Containers/FullWidthContainer";
import { classNames } from "~/utilities/main";

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserSession(request);

  return json({});
};

export default function CHWNetworksDiscover() {
  const { layoutContext } = useOutletContext<iCHWNetworkContextState>();

  const containerElement = useRef<HTMLDivElement>(null);

  const [networks, setNetworks] = useState<iWP_CHWNetwork[]>([]);
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
    useAutoFetcher<iWP_CHWNetworks | iGenericError>(
      "/api/chw-network/getAll",
      (data) => {
        if ("error" in data) {
          console.error(data.error);
          return;
        }

        setNetworks(data.nodes);
        setUpdatedNetworks(_.cloneDeep(data.nodes));
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
            {networksFetchState !== "idle" ? (
              <div className="mx-auto my-8 flex cursor-progress justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="my-4 grid items-start gap-4 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
            )}
          </div>
        </div>
      </FullWidthContainer>
    </>
  );
}
