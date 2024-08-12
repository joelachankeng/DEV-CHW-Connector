import type { LoaderFunction } from "@remix-run/node";
import { useCallback, useContext, useEffect, useState } from "react";
import { InfoSideBarMobile } from "~/components/SideBars/InfoSideBar";
import type { iGenericError } from "~/models/appContext.model";
import type { iWP_Post, iWP_Posts } from "~/models/post.model";
import _ from "lodash";
import { ListBoxField } from "~/components/Forms/ListBoxField";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import Post from "~/components/Posts/Post";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import { User } from "~/controllers/user.control";
import PublicHealthAlertsBanner from "~/components/PublicHealthAlertsBanner/PublicHealthAlertsBanner";
import ContainerWithRightSideBar from "~/components/Containers/ContainerWithRightSideBar";
import type { iInfoSideBarGroupTemplateProps } from "~/components/SideBars/InfoSideBar.GroupTemplate";
import InfoSideBarGroupTemplate, {
  createInfoSideBarGroupTemplateProps,
  InfoSideBarGroupTemplateMobile,
} from "~/components/SideBars/InfoSideBar.GroupTemplate";
import Drawer from "~/components/Drawer";
import PostAddNew from "~/components/Posts/PostAddNew";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import type { iCHWNetworkContextState } from "../chw-networks";
import { AppContext } from "~/contexts/appContext";
import { CHWNetwork } from "~/controllers/CHWNetwork.control";
import { UserPublic } from "~/controllers/user.control.public";
import type { iWP_CHWNetwork } from "~/models/CHWNetwork.model";
import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import { ErrorComponent } from "~/components/Pages/ErrorPage";

const sortByOptions = ["Recent", "Popular"];
const sortByOptionsMap = sortByOptions.map((option) => ({
  label: _.startCase(option),
  value: option.toLowerCase(),
}));

export const loader: LoaderFunction = async ({ request, params }) => {
  let userId = -1;
  const getUser = await User.Utils.getUserFromSession(request);
  if (getUser && !(getUser instanceof Error)) {
    userId = getUser.databaseId;
  }

  const paramId = params["*"];

  const networkId = parseInt(paramId ?? "-1");

  const network = await CHWNetwork.API.get(
    userId.toString(),
    networkId.toString(),
  );

  return {
    network: network instanceof Error ? undefined : network,
  };
};
export default function CHWNetworkSingle() {
  const { appContext } = useContext(AppContext);
  const { layoutContext } = useOutletContext<iCHWNetworkContextState>();

  const { network } = useLoaderData() as {
    network: undefined | iWP_CHWNetwork;
  };

  const [networkState, setNetworkState] = useState<iWP_CHWNetwork | undefined>(
    network,
  );
  const [mounted, setMounted] = useState(false);
  const [sortBy, setSortBy] =
    useState<(typeof sortByOptions)[number]>("recent");
  const [posts, setPosts] = useState<iWP_Post[]>([]);
  const [sortError, setSortError] = useState<iGenericError | undefined>(
    undefined,
  );
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [action, setAction] = useState<"ADD" | "REMOVE">("ADD");
  const [groupProps, setGroupProps] = useState<iInfoSideBarGroupTemplateProps>(
    getGroupProps(networkState),
  );

  const postsFetcherAction = (data: iWP_Posts | iGenericError) => {
    if (!mounted) setMounted(true);
    if ("error" in data) {
      setSortError(data);
      return;
    }
    setPosts(data.nodes);
    dispatchEvent(new CustomEvent("postsLoaded"));
  };

  const { state: postFetchState, submit: postFetchSubmit } = useAutoFetcher<
    iWP_Posts | iGenericError
  >("/api/feed/getAllPosts", postsFetcherAction);

  const { submit: followingFetchSubmit } = useAutoFetcher<
    { id: string; result: string } | (iGenericError & { id: string })
  >("/api/chw-network/updateMember", (data) => {
    if (!networkState) return;
    if ("id" in data && !("error" in data)) {
      const parseCommunityId = parseInt(data.id);
      if (networkState.databaseId === parseCommunityId) {
        const newNetworkState = _.cloneDeep(networkState);

        if (action === "ADD" && !networkState.chwNetworksFields.isMember) {
          newNetworkState.chwNetworksFields.totalMembers++;
          newNetworkState.chwNetworksFields.isMember = true;
        }
        if (action === "REMOVE" && networkState.chwNetworksFields.isMember) {
          newNetworkState.chwNetworksFields.totalMembers--;
          newNetworkState.chwNetworksFields.isMember = false;
        }
        setNetworkState(newNetworkState);
        setGroupProps(getGroupProps(newNetworkState));
      }
    }
  });

  const handleOnChangeSortBy = (value: string) => {
    if (value === sortBy) return;
    postFetchSubmit(
      {
        sortBy: value,
        type: "NETWORKS",
        typeId: networkState?.databaseId.toString() ?? "",
      },
      "POST",
    );
    setSortError(undefined);
    setSortBy(value as (typeof sortByOptions)[number]);
  };

  const handlePostSubmit = useCallback(() => {
    if (!networkState) return;
    postFetchSubmit(
      {
        sortBy: sortBy,
        type: "NETWORKS",
        typeId: networkState?.databaseId.toString() ?? "",
      },
      "POST",
    );
  }, [networkState, postFetchSubmit, sortBy]);

  // TOFIX: I want to get rid of this useEffect but doing that prevents the overflowing useEffect on Post.tsx from running
  useEffect(() => {
    handlePostSubmit();
    setMounted(true);
  }, []);

  const handleUpdateFollowing = (
    following: "REMOVE" | "ADD",
    communityId: number,
  ) => {
    setAction(following);
    setGroupProps(getGroupProps(networkState, true));

    followingFetchSubmit(
      {
        networkId: communityId.toString(),
        action: following,
      },
      "POST",
    );
  };

  function getGroupProps(
    networkData?: iWP_CHWNetwork,
    isLoading?: boolean,
  ): iInfoSideBarGroupTemplateProps {
    const groupProps: iInfoSideBarGroupTemplateProps | undefined =
      createInfoSideBarGroupTemplateProps({
        type: "NETWORK",
        groupData: networkData,
      });
    if (!networkData) return groupProps;
    if (!networkData.title) return groupProps;

    return {
      ...groupProps,
      membership: {
        isMember: groupProps.membership?.isMember ?? false,
        joinButton: {
          text: groupProps.membership?.joinButton?.text ?? "",
          onClick: (e) => {
            e.preventDefault();
            handleUpdateFollowing("ADD", networkData.databaseId);
          },
          isLoading: isLoading,
        },
        leaveButton: {
          text: groupProps.membership?.leaveButton?.text ?? "",
          onClick: (e) => {
            e.preventDefault();
            handleUpdateFollowing("REMOVE", networkData.databaseId);
          },
          isLoading: isLoading,
        },
      },
      guidelines: {
        title: "Community Guidelines",
        content: networkData.chwNetworksFields.communityGuidelines,
      },
      onSearchChange: undefined,
      onReport: () => {
        // TOFIX: Implement report network
      },
    };
  }

  return (
    <>
      <ContainerWithRightSideBar
        sideBar={<InfoSideBarGroupTemplate {...groupProps} />}
        mobileSideBarNav={
          <InfoSideBarMobile
            ariaLabel={groupProps.ariaLabel}
            image={groupProps.image}
            title={groupProps.title}
            subtitle={groupProps.subtitle}
            visible={groupProps.visible}
          >
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm font-semibold leading-[18px]">About</h1>
              <button
                className="inline-flex justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
                onClick={() => setShowProfileDrawer(true)}
              >
                <span className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#686867] transition duration-300 ease-in-out group-hover:bg-[#625DA6] group-hover:text-white">
                  <EllipsisHorizontalIcon className="h-4 w-4" />
                </span>
              </button>
            </div>
          </InfoSideBarMobile>
        }
      >
        {networkState ? (
          <>
            {layoutContext.alert && (
              <PublicHealthAlertsBanner alert={layoutContext.alert} />
            )}

            <div className="flex items-center justify-between gap-2.5 border-b border-solid border-b-[#C1BAB4] pb-1 text-base font-semibold text-[#686867] ">
              <h1 className="">Activity</h1>
              <div className="flex items-center gap-[15px]">
                {networkState && (
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
                )}
              </div>
            </div>
            {/* <PostCommentsThread
              root={true}
              totalComments={{
                count: fakeComments.length,
                collection: fakeComments,
              }}
            /> */}
            {networkState &&
              UserPublic.Utils.userCanPostInGroup(
                appContext.User,
                networkState.databaseId,
              ) && (
                <PostAddNew
                  groupId={networkState.databaseId}
                  groupType="NETWORK"
                  onSubmit={handlePostSubmit}
                />
              )}
            {mounted === false || postFetchState !== "idle" ? (
              <div className="mx-auto my-8 cursor-progress">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                {sortError ? (
                  <div className="text-basetext-[#032525] flex flex-col gap-2 text-center max-md:mt-2">
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
                    {posts.length === 0 ? (
                      <div className="text-center text-base text-[#032525]">
                        No posts available.
                      </div>
                    ) : (
                      <>
                        {posts.map((post) => (
                          <Post key={post.databaseId} post={post} />
                        ))}
                        <p className="text-center">
                          You reached the end of the feed.
                        </p>
                        {/* <Post post={posts[0]} /> */}
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <ErrorComponent
            title={"CHW Network not found"}
            description={
              "The CHW Network you are looking for does not exist or has been deleted."
            }
            status={"404"}
            className="max-tablet-lg:!pt-0"
          />
        )}
      </ContainerWithRightSideBar>
      <Drawer
        open={showProfileDrawer}
        position="left"
        onClose={() => setShowProfileDrawer(false)}
      >
        <InfoSideBarGroupTemplateMobile {...groupProps} />
      </Drawer>
    </>
  );
}
