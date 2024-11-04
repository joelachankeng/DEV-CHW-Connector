import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import type { LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import ContainerWithRightSideBar from "~/components/Containers/ContainerWithRightSideBar";
import Drawer from "~/components/Drawer";
import { ErrorPageGeneric } from "~/components/Pages/ErrorPage";
import Page from "~/components/Pages/Page";
import PublicHealthAlertsBanner from "~/components/PublicHealthAlertsBanner/PublicHealthAlertsBanner";
import { InfoSideBarMobile } from "~/components/SideBars/InfoSideBar";
import InfoSideBarGroupTemplate, {
  InfoSideBarGroupTemplateMobile,
} from "~/components/SideBars/InfoSideBar.GroupTemplate";
import { APP_CLASSNAMES, APP_ROUTES } from "~/constants";
import { PublicHealthAlert } from "~/controllers/publicHealthAlert.control";
import type { iGenericError } from "~/models/appContext.model";
import type { iWP_CHWNetwork } from "~/models/CHWNetwork.model";
import type { iWP_Community } from "~/models/community.model";
import type { iWP_Comment, iWP_Post } from "~/models/post.model";
import type { iWP_PublicHealthAlert } from "~/models/publicHealthAlert.model";
import { getPostData, getGroupProps } from "..";
import Post from "~/components/Posts/Post";
import { Feed } from "~/controllers/feed.control";
import { User } from "~/controllers/user.control";
import { createGraphQLPagination } from "~/controllers/graphql.control";
import { NotFound } from "~/components/NotFound";

type iLoaderData = {
  alert?: iWP_PublicHealthAlert;
  group?: iWP_CHWNetwork | iWP_Community;
  post: iWP_Post | iGenericError | null;
  commentId?: number;
};
export const loader: LoaderFunction = async ({
  request,
  params,
}): Promise<iLoaderData> => {
  const getUser = await User.Utils.getUserFromSession(request);
  const userId =
    getUser && !(getUser instanceof Error) ? getUser.databaseId : -1;

  const postId = parseInt(params["postId"] ?? "-1");
  let commentId = parseInt(params["commentId"] ?? "-1");

  const postData = await getPostData(getUser, postId.toString());

  if (postData.post && !("error" in postData.post)) {
    const comment = await Feed.API.Comment.getComment(
      userId.toString(),
      commentId.toString(),
    );
    if (comment) {
      if (comment instanceof Error) {
        commentId = -1;
      } else {
        const parentId = comment.commentsField.parentId;
        if (parentId && parentId > 0) {
          const [parentComment, childComments] = await Promise.all([
            Feed.API.Comment.getComment(userId.toString(), parentId.toString()),
            Feed.API.Comment.getPostComments(
              userId.toString(),
              postId.toString(),
              parentId.toString(),
              createGraphQLPagination({
                first: 999,
              }),
            ),
          ]);
          let allComments: iWP_Comment[] = [];
          if (parentComment && !(parentComment instanceof Error)) {
            allComments.push(parentComment);
          }
          if (childComments && !(childComments instanceof Error)) {
            allComments.push(...childComments.nodes);
          }
          if (allComments.length < 1) allComments = [comment];
          postData.post.postFields.firstComments = {
            nodes: allComments,
            total: allComments.filter(
              (c) =>
                c.commentsField.parentId === null ||
                c.commentsField.parentId === undefined ||
                c.commentsField.parentId === 0,
            ).length,
          };
        } else {
          const hasComment = postData.post.postFields.firstComments.nodes.find(
            (c) => c.databaseId.toString() === commentId.toString(),
          );
          if (!hasComment) {
            postData.post.postFields.firstComments.nodes.push(comment);
          }
        }
      }
    } else {
      commentId = -1;
    }
  }

  let alert: iWP_PublicHealthAlert | undefined = undefined;
  const getAlert = await PublicHealthAlert.API.getMostRecentAlert();
  if (!(getAlert instanceof Error) && getAlert !== null) {
    alert = getAlert;
  }
  return {
    alert: alert,
    post: postData.post,
    group: postData.group,
    commentId: commentId,
  };
};
export default function SinglePostComment() {
  const { alert, group, post, commentId } = useLoaderData<iLoaderData>();

  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const groupProps = getGroupProps(group);

  useEffect(() => {
    if (isMounted) return;
    if (!commentId) return;
    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const headerHeight = document.querySelector("header")?.clientHeight ?? 0;
      const commentElement = document.getElementById(`comment-${commentId}`);

      if (commentElement) {
        const position = commentElement.getBoundingClientRect().top;
        const offsetPosition =
          position + (window.scrollY || window.pageXOffset) - headerHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      } else {
        console.error(`Could not find comment with id ${commentId}`);
      }
    })().catch(console.error);
    setIsMounted(true);
  }, [commentId, isMounted]);

  if (post === undefined || post === null || "error" in post) {
    return <ErrorPageGeneric error={post} dataType="Post" />;
  }
  if (commentId === -1) {
    return (
      <Page>
        <CustomErrorComponent
          title="Comment not found"
          description="The comment you are looking for has been deleted or does not exist."
          status="404"
          link={{
            text: post ? "Go back to post" : "Go back home",
            href: post
              ? `${APP_ROUTES.POST}/${post.databaseId}`
              : APP_ROUTES.HOME,
          }}
        />
      </Page>
    );
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
          <Post
            post={post}
            commentOpts={{
              collapsed: false,
              activeCommentId: commentId ?? -1,
              viewAllComments: true,
            }}
          />
          <>
            <div className="my-5 w-full border border-[#C1BAB4]"></div>
          </>
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

function CustomErrorComponent({
  title,
  description,
  status,
  className,
  link,
}: {
  title: string;
  description: string;
  status: string;
  className?: string;
  link?: {
    text: string;
    href: string;
  };
}) {
  return (
    <NotFound
      title={title}
      subtitle={description}
      status={status}
      className={className}
    >
      <div className="mt-10 flex items-center justify-center gap-6 max-md:flex-col">
        <Link
          to={link?.href || APP_ROUTES.HOME}
          className="rounded-md bg-chw-dark-purple px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-chw-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chw-dark-purple"
        >
          {link?.text || "Go back home"}
        </Link>

        <Link
          to={APP_ROUTES.CONTACT}
          className="text-sm font-semibold text-gray-900 hover:text-chw-dark-purple"
        >
          Contact support
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </NotFound>
  );
}
