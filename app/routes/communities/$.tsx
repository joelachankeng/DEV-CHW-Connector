import type { LoaderFunction } from "@remix-run/node";
import { useCallback, useContext, useEffect, useState } from "react";
import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import { InfoSideBarMobile } from "~/components/SideBars/InfoSideBar";
import type { iGenericError } from "~/models/appContext.model";
import type { iWP_Post, iWP_Posts } from "~/models/post.model";
import _ from "lodash";
import { ListBoxField } from "~/components/Forms/ListBoxField";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import Post from "~/components/Posts/Post";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import { User } from "~/controllers/user.control";
import { Community } from "~/controllers/community.control";
import type { iWP_Community } from "~/models/community.model";
import PublicHealthAlertsBanner from "~/components/PublicHealthAlertsBanner/PublicHealthAlertsBanner";
import type { iCommunitiesContextState } from "../communities";
import ContainerWithRightSideBar from "~/components/Containers/ContainerWithRightSideBar";
import type { iInfoSideBarGroupTemplateProps } from "~/components/SideBars/InfoSideBar.GroupTemplate";
import InfoSideBarGroupTemplate, {
  createInfoSideBarGroupTemplateProps,
  InfoSideBarGroupTemplateMobile,
} from "~/components/SideBars/InfoSideBar.GroupTemplate";
import Drawer from "~/components/Drawer";
import PostAddNew from "~/components/Posts/PostAddNew";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { ErrorComponent } from "~/components/Pages/ErrorPage";
import { AppContext } from "~/contexts/appContext";
import { UserPublic } from "~/controllers/user.control.public";

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

  const communityId = parseInt(paramId ?? "-1");

  const community = await Community.API.get(
    userId.toString(),
    communityId.toString(),
  );

  return {
    community: community instanceof Error ? undefined : community,
  };
};
export default function CommunitiesSingle() {
  const { appContext } = useContext(AppContext);
  const { layoutContext } = useOutletContext<iCommunitiesContextState>();

  const { community } = useLoaderData() as {
    community: undefined | iWP_Community;
  };

  const [communityState, setCommunityState] = useState<
    iWP_Community | undefined
  >(community);
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
    getGroupProps(communityState),
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
  >("/api/community/updateMember", (data) => {
    if (!communityState) return;
    if ("id" in data && !("error" in data)) {
      const parseCommunityId = parseInt(data.id);
      if (communityState.databaseId === parseCommunityId) {
        const newCommunityState = _.cloneDeep(communityState);

        if (action === "ADD" && !communityState.communitiesFields.isMember) {
          newCommunityState.communitiesFields.totalMembers++;
          newCommunityState.communitiesFields.isMember = true;
        }
        if (action === "REMOVE" && communityState.communitiesFields.isMember) {
          newCommunityState.communitiesFields.totalMembers--;
          newCommunityState.communitiesFields.isMember = false;
        }
        setCommunityState(newCommunityState);
        setGroupProps(getGroupProps(newCommunityState));
      }
    }
  });

  const handleOnChangeSortBy = (value: string) => {
    if (value === sortBy) return;
    postFetchSubmit(
      {
        sortBy: value,
        type: "COMMUNITY",
        typeId: communityState?.databaseId.toString() ?? "",
      },
      "POST",
    );
    setSortError(undefined);
    setSortBy(value as (typeof sortByOptions)[number]);
  };

  const handlePostSubmit = useCallback(() => {
    postFetchSubmit(
      {
        sortBy: sortBy,
        type: "COMMUNITY",
        typeId: communityState?.databaseId.toString() ?? "",
      },
      "POST",
    );
  }, []);

  // TOFIX: I want to get rid of this useEffect but doing that prevents the overflowing useEffect on Post.tsx from running
  useEffect(() => {
    setMounted(true);
    handlePostSubmit();
  }, []);

  const handleUpdateFollowing = (
    following: "REMOVE" | "ADD",
    communityId: number,
  ) => {
    setAction(following);
    setGroupProps(getGroupProps(communityState, true));

    followingFetchSubmit(
      {
        communityId: communityId.toString(),
        action: following,
      },
      "POST",
    );
  };

  function getGroupProps(
    communityData?: iWP_Community,
    isLoading?: boolean,
  ): iInfoSideBarGroupTemplateProps {
    const groupProps: iInfoSideBarGroupTemplateProps | undefined =
      createInfoSideBarGroupTemplateProps({
        type: "COMMUNITY",
        groupData: communityData,
      });
    if (!communityData) return groupProps;
    if (!communityData.title) return groupProps;

    return {
      ...groupProps,
      membership: {
        isMember: groupProps.membership?.isMember ?? false,
        joinButton: {
          text: groupProps.membership?.joinButton?.text ?? "",
          onClick: (e) => {
            e.preventDefault();
            handleUpdateFollowing("ADD", communityData.databaseId);
          },
          isLoading: isLoading,
        },
        leaveButton: {
          text: groupProps.membership?.leaveButton?.text ?? "",
          onClick: (e) => {
            e.preventDefault();
            handleUpdateFollowing("REMOVE", communityData.databaseId);
          },
          isLoading: isLoading,
        },
      },
      guidelines: {
        title: "Community Guidelines",
        content: communityData.communitiesFields.communityGuidelines,
      },
      onSearchChange: undefined,
      onReport: () => {
        // TOFIX: Implement report community
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
        {communityState ? (
          <>
            {layoutContext.alert && (
              <PublicHealthAlertsBanner alert={layoutContext.alert} />
            )}

            <div className="flex items-center justify-between gap-2.5 border-b border-solid border-b-[#C1BAB4] pb-1 text-base font-semibold text-[#686867] max-md:mt-5 ">
              <h1 className="">Activity</h1>
              <div className="flex items-center gap-[15px]">
                {communityState && (
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
            {communityState &&
              UserPublic.Utils.userCanPostInGroup(
                appContext.User,
                communityState.databaseId,
              ) && (
                <PostAddNew
                  groupId={communityState.databaseId}
                  groupType="COMMUNITY"
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
            title={"Community not found"}
            description={
              "The Community you are looking for does not exist or has been deleted."
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
