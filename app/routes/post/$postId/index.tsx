import type { LoaderFunction } from "@remix-run/node";
import { useState } from "react";
import { useLoaderData } from "@remix-run/react";
import { CHWNetwork } from "~/controllers/CHWNetwork.control";
import type { iWP_CHWNetwork } from "~/models/CHWNetwork.model";
import { Feed } from "~/controllers/feed.control";
import { PublicHealthAlert } from "~/controllers/publicHealthAlert.control";
import type { iWP_PublicHealthAlert } from "~/models/publicHealthAlert.model";
import type { iWP_Community } from "~/models/community.model";
import { User } from "~/controllers/user.control";
import type { iWP_Post } from "~/models/post.model";
import Page from "~/components/Pages/Page";
import { APP_CLASSNAMES, APP_ROUTES } from "~/constants";
import PublicHealthAlertsBanner from "~/components/PublicHealthAlertsBanner/PublicHealthAlertsBanner";
import Post from "~/components/Posts/Post";
import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import ContainerWithRightSideBar from "~/components/Containers/ContainerWithRightSideBar";
import Drawer from "~/components/Drawer";
import { InfoSideBarMobile } from "~/components/SideBars/InfoSideBar";
import type {
  iCreateInfoSideBarGroupTemplatePropsArgs,
  iInfoSideBarGroupTemplateProps,
} from "~/components/SideBars/InfoSideBar.GroupTemplate";
import InfoSideBarGroupTemplate, {
  createInfoSideBarGroupTemplateProps,
  InfoSideBarGroupTemplateMobile,
} from "~/components/SideBars/InfoSideBar.GroupTemplate";
import { Community } from "~/controllers/community.control";
import type { iGenericError } from "~/models/appContext.model";
import { ErrorPageGeneric } from "~/components/Pages/ErrorPage";
import { UserPublic } from "~/controllers/user.control.public";
import type { iWP_User } from "~/models/user.model";

type iLoaderData = {
  alert?: iWP_PublicHealthAlert;
  group?: iWP_CHWNetwork | iWP_Community;
  post: iWP_Post | iGenericError | null;
};

export const getPostData = async (
  user: iWP_User | Error | undefined,
  postId: string,
): Promise<{
  post: iLoaderData["post"];
  group: iLoaderData["group"];
}> => {
  const userId = user && !(user instanceof Error) ? user.databaseId : -1;
  let group: iLoaderData["group"] = undefined;
  let post = await Feed.API.Post.getPost(userId.toString(), postId.toString());

  if (post && !(post instanceof Error)) {
    if ("network" in post.postFields && post.postFields.network) {
      const networkId = post.postFields.network.node.databaseId;
      const network = await CHWNetwork.API.get(
        userId.toString(),
        networkId.toString(),
      );
      if (network && !(network instanceof Error)) {
        group = network;
      }
    }

    if ("community" in post.postFields && post.postFields.community) {
      const communityId = post.postFields.community.node.databaseId;
      const community = await Community.API.get(
        userId.toString(),
        communityId.toString(),
      );
      if (community && !(community instanceof Error)) {
        group = community;
      }
    }

    if (post.status !== "publish") {
      if (
        user &&
        !(user instanceof Error) &&
        UserPublic.Utils.userIsAdmin(user) === false
      ) {
        post = new Error("Post not found");
      }
    }
  }

  return {
    post:
      post instanceof Error
        ? {
            error: post.message,
          }
        : post,
    group: group,
  };
};

export const loader: LoaderFunction = async ({
  request,
  params,
}): Promise<iLoaderData> => {
  const getUser = await User.Utils.getUserFromSession(request);

  const paramId = params["postId"];
  const postId = parseInt(paramId ?? "-1");

  const postData = await getPostData(getUser, postId.toString());

  let alert: iWP_PublicHealthAlert | undefined = undefined;
  const getAlert = await PublicHealthAlert.API.getMostRecentAlert();
  if (!(getAlert instanceof Error) && getAlert !== null) {
    alert = getAlert;
  }
  return {
    alert: alert,
    post: postData.post,
    group: postData.group,
  };
};
export default function SinglePost() {
  const { alert, group, post } = useLoaderData<iLoaderData>();

  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  const groupProps = getGroupProps(group);

  if (post === undefined || post === null || "error" in post) {
    return <ErrorPageGeneric error={post} dataType="Post" />;
  }

  return (
    <Page>
      <div className={APP_CLASSNAMES.CONTAINER_FULLWIDTH}>
        <ContainerWithRightSideBar
          sideBar={<InfoSideBarGroupTemplate {...groupProps} />}
          mobileSideBarNav={
            <InfoSideBarMobile
              ariaLabel={groupProps.ariaLabel}
              image={groupProps.image}
              title={groupProps.title}
              subtitle={groupProps.subtitle}
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
          {alert && <PublicHealthAlertsBanner alert={alert} />}
          <Post post={post} />
        </ContainerWithRightSideBar>
        <Drawer
          open={showProfileDrawer}
          position="left"
          onClose={() => setShowProfileDrawer(false)}
        >
          <InfoSideBarGroupTemplateMobile {...groupProps} />
        </Drawer>
      </div>
    </Page>
  );
}

export const getGroupProps = (
  group?: iWP_CHWNetwork | iWP_Community | Error | null,
): iInfoSideBarGroupTemplateProps => {
  let args: iCreateInfoSideBarGroupTemplatePropsArgs = {
    type: "COMMUNITY",
    groupData: undefined,
  };

  if (group !== undefined && !(group instanceof Error) && group !== null) {
    if ("chwNetworksFields" in group) {
      args = {
        type: "NETWORK",
        groupData: group,
      };
    }
    if ("communitiesFields" in group) {
      args = {
        type: "COMMUNITY",
        groupData: group,
      };
    }
  }

  const groupProps: iInfoSideBarGroupTemplateProps | undefined =
    createInfoSideBarGroupTemplateProps(args);
  if (!group) return groupProps;
  if (!("title" in group)) return groupProps;
  if (!group.title || group.title === "") return groupProps;

  const btnText = "View " + (args.type === "NETWORK" ? "Network" : "Community");

  const btnHref =
    args.type === "NETWORK"
      ? `${APP_ROUTES.CHW_NETWORKS}/${group.databaseId}`
      : `${APP_ROUTES.COMMUNITIES}/${group.databaseId}`;

  return {
    ...groupProps,
    membership: {
      isMember: false,
      joinButton: {
        text: btnText,
        href: btnHref,
      },
      leaveButton: {
        text: btnText,
        href: btnHref,
      },
    },
    guidelines: undefined,
    onSearchChange: undefined,
    onReport: undefined,
  };
};
