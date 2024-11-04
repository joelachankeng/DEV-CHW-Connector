import {
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/20/solid";
import { Link, useFetcher, useNavigate } from "@remix-run/react";
import SVGComment from "~/assets/SVGs/SVGComment";
import SVGReact from "~/assets/SVGs/SVGReact";
import SVGShare from "~/assets/SVGs/SVGShare";
import { APP_ROUTES } from "~/constants";
import type { iWP_Comment, iWP_Post } from "~/models/post.model";
import { faBookmark, faFlag, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DateTime } from "luxon";
import { ClientOnly } from "remix-utils/client-only";
import { EditorBlock } from "../Editor/EditorBlock";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type EditorJS from "@editorjs/editorjs";
import type { iGenericError, iGenericSuccess } from "~/models/appContext.model";
import { calcEditorData, classNames } from "~/utilities/main";
import Avatar from "../User/Avatar";
import { AppContext } from "~/contexts/appContext";
import type { iNotificationItem_General } from "../Managers/Notification/NotificationItem";
import type {
  EMOJI_SELECTED_EVENT,
  iEmojiPickerIcon,
} from "~/utilities/hooks/useEmojiMart";
import {
  dispatchShowMobilePicker,
  EMOJIMART_EVENTS,
  useEmojiMart,
} from "~/utilities/hooks/useEmojiMart";
import PostEmojis, { calcUserUpdateReaction } from "./PostEmojis";
import ButtonLoadMore from "../ButtonLoadMore";
import ModalShare from "../Modals/ModalShare";
import PostCommentEditor from "./PostCommentEditor";
import { Collapse } from "@kunukn/react-collapse";
import PostCommentsThread, {
  dispatchAddCommentEvent,
} from "./PostCommentsThread";
import type { iContextMenuProps } from "../ContextMenu";
import ContextMenu from "../ContextMenu";
import ModalNotification from "../Modals/ModalNotification";
import { UserPublic } from "~/controllers/user.control.public";

export default function Post({
  post,
  commentOpts,
}: {
  post: iWP_Post;
  commentOpts?: {
    collapsed?: boolean;
    activeCommentId?: number;
    viewAllComments?: boolean;
  };
}) {
  const { User, NotificationManager } = useContext(AppContext);
  const navigate = useNavigate();

  const { EmojiMart, EmojiMartMobile } = useEmojiMart();
  const fetcher = useFetcher();

  const editorRef = useRef<EditorJS>();
  const shareUrl = useRef<string>(`${APP_ROUTES.POST}/${post.databaseId}`);

  const [updatedPost, setUpdatedPost] = useState<iWP_Post>(post);
  const [isOverflowing, setIsOverflowing] = useState(false); //TODO : DEFAULT IS FALSE - ADD BACK OVERFLOWING
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [action, setAction] = useState<
    "REACT" | "COMMENT" | "SHARE" | "SAVE" | "REPORT" | "DELETE" | undefined
  >();
  const [shareModal, setShareModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isCommentCollapsed, setIsCommentCollapsed] = useState<boolean>(
    commentOpts?.collapsed !== undefined ? commentOpts.collapsed : true,
  );
  const [showEmojiMart, setShowEmojiMart] = useState<boolean>(false);

  const editorHolderId = `post-editor-${updatedPost.databaseId}`;

  useEffect(() => {
    if (!editorRef.current) return;
    // console.log("editorRef.current", editorRef.current);

    editorRef.current?.isReady
      ?.then(() => {
        const editorHolder = document.getElementById(editorHolderId);
        if (!editorHolder) return;
        const isOverflowing =
          editorHolder.scrollHeight > editorHolder.clientHeight;
        // setIsOverflowing(isOverflowing); //TODO : ADD BACK OVERFLOWING
      })
      .catch((error) => {
        console.error("Error on editorRef.current?.isReady", error);
      });
  }, [editorHolderId]);

  useEffect(() => {
    if (fetcher.state !== "idle") return;
    if (!fetcher.data) return;

    const data = fetcher.data as iGenericSuccess | iGenericError;

    const errorNotification: iNotificationItem_General = {
      type: "error",
      message: "An error occurred while trying to",
      time: DateTime.now().toISO(),
    };

    switch (action) {
      case "REACT":
        if ("error" in data) {
          errorNotification.message += ` react to post #${updatedPost.databaseId}. Please try again.`;
          setUpdatedPost((prev) => ({
            ...prev,
            postFields: {
              ...prev.postFields,
              totalEmojis: post.postFields.totalEmojis,
            },
          }));
          NotificationManager.addNotification(errorNotification);
        }
        break;
      case "COMMENT":
        console.log("Commented");
        break;
      case "SHARE":
        // ModalShare is initiationing the request
        break;
      case "SAVE":
        if ("error" in data) {
          const action = updatedPost.postFields.isSaved ? "save" : "unsave";
          errorNotification.message += ` ${action} post #${updatedPost.databaseId}. Please try again.`;
          setUpdatedPost((prev) => ({
            ...prev,
            postFields: {
              ...prev.postFields,
              isSaved: post.postFields.isSaved,
            },
          }));
          NotificationManager.addNotification(errorNotification);
        }

        break;
      case "REPORT":
        if ("error" in data) {
          const action = updatedPost.postFields.isReported
            ? "report"
            : "unreport";
          errorNotification.message += ` ${action} post #${updatedPost.databaseId}. Please try again.`;
          setUpdatedPost((prev) => ({
            ...prev,
            postFields: {
              ...prev.postFields,
              isReported: post.postFields.isReported,
            },
          }));

          NotificationManager.addNotification(errorNotification);
        }
        break;
      case "DELETE":
        if ("error" in data) {
          errorNotification.message += ` delete post #${updatedPost.databaseId}. Please try again.`;
          setIsDeleted(false);

          NotificationManager.addNotification(errorNotification);
        } else {
          setIsDeleted(true);
        }
        setDeleteModal(false);
        break;
    }

    setAction(undefined);
  }, [fetcher.data, fetcher.state]);

  const getGroup = (): { name: string; url: string; imageUrl: string } => {
    const defaultGroup = {
      name: "",
      url: ``,
      imageUrl: "",
    };

    if (updatedPost.postFields.community) {
      defaultGroup.name = updatedPost.postFields.community.node.title;
      defaultGroup.url = `${APP_ROUTES.COMMUNITIES}/${updatedPost.postFields.community.node.databaseId}`;
      defaultGroup.imageUrl =
        updatedPost.postFields.community.node.featuredImage.node.mediaItemUrl;
    } else if (updatedPost.postFields.network) {
      defaultGroup.name = updatedPost.postFields.network.node.title;
      defaultGroup.url = `${APP_ROUTES.CHW_NETWORKS}/${updatedPost.postFields.network.node.databaseId}`;
      defaultGroup.imageUrl =
        updatedPost.postFields.network.node.featuredImage.node.mediaItemUrl;
    }

    return defaultGroup;
  };

  const handleSavePost = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!User.user) return navigate(APP_ROUTES.LOGIN);
    const formData = new FormData();
    formData.append("postId", updatedPost.databaseId.toString());
    formData.append(
      "action",
      updatedPost.postFields.isSaved ? "UNSAVE" : "SAVE",
    );

    fetcher.submit(formData, {
      method: "post",
      action: "/api/post/savePost",
    });

    setUpdatedPost((prev) => ({
      ...prev,
      postFields: {
        ...prev.postFields,
        isSaved: !prev.postFields.isSaved,
      },
    }));
    setAction("SAVE");
  };

  const handleReportPost = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("postId", updatedPost.databaseId.toString());
    formData.append(
      "action",
      updatedPost.postFields.isReported ? "UNREPORT" : "REPORT",
    );

    fetcher.submit(formData, {
      method: "post",
      action: "/api/post/reportPost",
    });

    setUpdatedPost((prev) => ({
      ...prev,
      postFields: {
        ...prev.postFields,
        isReported: !prev.postFields.isReported,
      },
    }));
    setAction("REPORT");
    setIsCommentCollapsed(true);
    document.body.click(); // Close the context menu
  };

  const handleDeletePost = () => {
    const formData = new FormData();
    formData.append("postId", updatedPost.databaseId.toString());
    fetcher.submit(formData, {
      method: "post",
      action: "/api/post/deletePost",
    });

    setAction("DELETE");
  };

  const handleSharePost = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    shareUrl.current =
      window.location.origin + `${APP_ROUTES.POST}/${post.databaseId}`;
    setShareModal(true);
  };

  const handleOnShare = (hasShared: boolean) => {
    setUpdatedPost((prev) => ({
      ...prev,
      postFields: {
        ...prev.postFields,
        totalShares: {
          ...prev.postFields.totalShares,
          count: hasShared
            ? post.postFields.totalShares.count + 1
            : post.postFields.totalShares.count,
          userHasShared: hasShared,
        },
      },
    }));
  };

  const handleEmojiSelect = (emoji: iEmojiPickerIcon) => {
    setShowEmojiMart(false);

    const result = calcUserUpdateReaction(
      User,
      NotificationManager,
      emoji.id,
      updatedPost.postFields.totalEmojis,
    );

    if (!result) return;

    if ("time" in result) {
      NotificationManager.addNotification(result);
      return;
    }

    setUpdatedPost((prev) => ({
      ...prev,
      postFields: {
        ...prev.postFields,
        totalEmojis: result.emojis,
      },
    }));
    console.log("post emoji", result.emojis, emoji.id);

    const formData = new FormData();
    formData.append("postId", updatedPost.databaseId.toString());
    formData.append("action", result.action);
    formData.append("emojiId", emoji.id);
    formData.append("emojiIcon", emoji.native);

    fetcher.submit(formData, {
      method: "post",
      action: "/api/post/react",
    });

    setAction("REACT");
  };

  const handlePostCommentSubmit = useCallback(
    (comment: iWP_Comment) => {
      dispatchAddCommentEvent(post.databaseId, comment);
      setUpdatedPost((prev) => ({
        ...prev,
        postFields: {
          ...prev.postFields,
          totalComments: prev.postFields.totalComments + 1,
          firstComments: {
            total: prev.postFields.firstComments.total + 1,
            nodes: [comment, ...prev.postFields.firstComments.nodes],
          },
        },
      }));
    },
    [post.databaseId],
  );

  const getMenuITtems = (): iContextMenuProps["items"] => {
    const menuITtems = [
      [
        {
          element: (
            <button
              onClick={handleSavePost}
              className={classNames(
                "group flex w-full items-center gap-2 rounded-md px-4 py-2 font-semibold transition duration-300 ease-in-out",
                updatedPost.postFields.isSaved
                  ? "text-chw-light-purple hover:text-[#686867]"
                  : "text-[#686867] hover:text-chw-light-purple",
              )}
            >
              <FontAwesomeIcon className="h-8 w-8" icon={faBookmark} />
              <span>{updatedPost.postFields.isSaved ? "Unsave" : "Save"}</span>
            </button>
          ),
        },
      ],
      [
        {
          element: (
            <button
              onClick={handleReportPost}
              className={classNames(
                "group flex w-full items-center gap-2 rounded-md px-4 py-2 font-semibold transition duration-300 ease-in-out",
                updatedPost.postFields.isReported
                  ? "text-chw-yellow hover:text-[#686867]"
                  : "text-[#686867] hover:text-chw-light-purple",
              )}
            >
              <FontAwesomeIcon className="h-8 w-8" icon={faFlag} />
              <span>
                {updatedPost.postFields.isReported ? "Undo Report" : "Report"}
              </span>
            </button>
          ),
        },
      ],
    ];
    if (UserPublic.Utils.userCanDeletePost(User.user, post)) {
      menuITtems.push([
        {
          element: (
            <button
              onClick={(e) => {
                e.preventDefault();
                setDeleteModal(true);
              }}
              className={classNames(
                "group flex w-full items-center gap-2 rounded-md px-4 py-2 font-semibold transition duration-300 ease-in-out",
                "text-[#686867] hover:text-red-700",
              )}
            >
              <FontAwesomeIcon className="h-8 w-8" icon={faTrash} />
              <span>Delete</span>
            </button>
          ),
        },
      ]);
    }

    return menuITtems;
  };

  const getPostDetails = (): {
    groupName: string;
    groupUrl: string;
    username: string;
    avatarImageUrl: string;
    avatarImageAlt: string;
    avatarUrl: string;
  } => {
    const group = getGroup();
    const username = `${updatedPost.author.node.firstName} ${updatedPost.author.node.lastName}`;
    const defaultDetails = {
      groupName: group.name,
      groupUrl: group.url,
      username,
      avatarImageUrl: updatedPost.author.node.avatar.url || "",
      avatarImageAlt: username,
      avatarUrl: `${APP_ROUTES.PROFILE}/${updatedPost.author.node.databaseId}`,
    };

    if (updatedPost.postFields.poster === "GROUP") {
      defaultDetails.username = "";
      defaultDetails.avatarImageUrl = group.imageUrl;
      defaultDetails.avatarImageAlt = group.name;
      defaultDetails.avatarUrl = group.url;
    }

    return defaultDetails;
  };
  useEffect(() => {
    const handleEmojiSelectListener = (event: EMOJI_SELECTED_EVENT) => {
      const { emoji, id } = event.detail;
      if (id !== updatedPost.databaseId.toString()) return;
      handleEmojiSelect(emoji);
    };

    window.addEventListener(
      EMOJIMART_EVENTS.EMOJI_SELECTED,
      handleEmojiSelectListener as EventListener,
    );

    return () => {
      window.removeEventListener(
        EMOJIMART_EVENTS.EMOJI_SELECTED,
        handleEmojiSelectListener as EventListener,
      );
    };
  }, []);

  const emojiMartPickerOptions = {
    skinTonePosition: "none",
    skin: 1,
    dynamicWidth: true,
    onEmojiSelect: (emoji: iEmojiPickerIcon) => handleEmojiSelect(emoji),
    onClickOutside: () => setShowEmojiMart(false),
  };

  const createEditorReadOnly = useMemo(
    () => (
      <EditorBlock
        onEditor={(editor: EditorJS | undefined) => {
          editorRef.current = editor as EditorJS;
        }}
        onReady={() => {
          // TO FIX: for some reason, updating the state on rhis function prevents the data from being loaded
          // console.log(
          //   "Editor Ready",
          //   editorHolderId,
          //   editorRef.current?.isReady,
          // );
          // editorRef.current?.isReady?.then(() => {
          //   console.log(
          //     "Editor Ready",
          //     editorHolderId,
          //     editorRef.current?.isReady,
          //   );
          //   const editorHolder =
          //     document.getElementById(editorHolderId);
          //   if (!editorHolder) return;
          //   const isOverflowing =
          //     editorHolder.scrollHeight > editorHolder.clientHeight;
          //   setIsOverflowing(isOverflowing);
          // });
        }}
        data={calcEditorData(updatedPost.postFields.content)}
        holder={editorHolderId}
        readOnly={true}
        className={classNames(
          "relative z-0 min-h-[100px] overflow-hidden transition-all duration-300 ease-in-out",
          isOverflowing && isCollapsed
            ? "before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-full before:bg-[linear-gradient(transparent_10%,white)] before:content-['']"
            : "",
          // isCollapsed ? "max-h-28" : "", //TODO: Fix this
        )}
      />
    ),
    [
      editorHolderId,
      isCollapsed,
      isOverflowing,
      updatedPost.postFields.content,
    ],
  );

  const createPostCommentEditor = useMemo(
    () => (
      <PostCommentEditor
        postId={updatedPost.databaseId}
        onSubmit={handlePostCommentSubmit}
      />
    ),
    [handlePostCommentSubmit, updatedPost.databaseId],
  );

  if (isDeleted) {
    return <></>;
  }

  return (
    <>
      <ModalShare
        show={shareModal}
        link={shareUrl.current}
        postId={updatedPost.databaseId}
        hasShared={updatedPost.postFields.totalShares.userHasShared}
        onShare={handleOnShare}
        onClose={() => setShareModal(false)}
      />
      <ModalNotification
        show={deleteModal}
        title="Delete Post"
        content="Are you sure you want to delete this post?"
        onConfirm={handleDeletePost}
        onClose={() => setDeleteModal(false)}
      />

      <div
        className={classNames(
          "relative",
          "max-md:after:-ml-5 max-md:after:block max-md:after:h-[4px] max-md:after:w-[100vw] max-md:after:bg-[#C1BAB4] max-md:after:content-['']",
        )}
      >
        {updatedPost.postFields.isReported && (
          <div className="absolute -left-5 z-20 flex h-full w-full cursor-not-allowed items-center justify-center text-center max-md:w-[100vw]">
            <div className="w-full bg-[#FABE46] px-0 py-5 text-base font-semibold leading-[18px] text-[#032525]">
              <p>You have reported this post. It is currently under review.</p>
              <button
                className={classNames(
                  "cursor-pointer bg-chw-light-purple text-white hover:bg-chw-dark-purple",
                  "mt-4 rounded-[40px] border-[none] px-[25px] py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
                )}
                type="button"
                onClick={handleReportPost}
              >
                Undo Report
              </button>
            </div>
          </div>
        )}
        <div
          className={classNames(
            "editor-top-parent",
            showEmojiMart ? "z-20" : "z-10",
            "relative flex flex-col gap-5 overflow-hidden rounded-[10px] border border-solid border-[#E8E0D6] bg-white p-5",
            updatedPost.postFields.isReported ? "opacity-50 blur-sm " : "",
            "max-md:border-none max-md:px-0",
          )}
        >
          <div
            className={classNames(
              "absolute right-[55px] -mt-6 text-chw-light-purple transition duration-300 ease-in-out",
              updatedPost.postFields.isSaved ? "" : "-translate-y-full",
            )}
          >
            {updatedPost.postFields.isSaved && (
              <FontAwesomeIcon className="h-8 w-8" icon={faBookmark} />
            )}
          </div>

          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-5">
              <div className="h-10 w-10">
                <Link to={getPostDetails().avatarUrl}>
                  <Avatar
                    src={getPostDetails().avatarImageUrl}
                    alt={getPostDetails().avatarImageAlt}
                  />
                </Link>
              </div>
              <div className="font-semibold">
                <Link to={getPostDetails().groupUrl}>
                  <h2 className="text-lg text-[#032525] transition duration-300 ease-in-out hover:text-chw-light-purple">
                    {getPostDetails().groupName}
                  </h2>
                </Link>

                <p className="text-sm text-[#686867]">
                  {getPostDetails().username && (
                    <>
                      <Link
                        to={getPostDetails().avatarUrl}
                        className="transition duration-300 ease-in-out hover:text-chw-light-purple"
                      >
                        {getPostDetails().username}
                      </Link>
                      <span className="px-[5px] py-0">•</span>
                    </>
                  )}
                  <time dateTime={updatedPost.date}>
                    {DateTime.fromISO(updatedPost.date).toLocaleString(
                      DateTime.DATETIME_SHORT,
                    )}
                  </time>
                </p>
              </div>
            </div>
            <ContextMenu
              button={
                <span className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#686867] transition duration-300 ease-in-out group-hover:bg-[#625DA6] group-hover:text-white">
                  <EllipsisHorizontalIcon className="h-4 w-4" />
                </span>
              }
              items={getMenuITtems()}
            />
          </div>
          <ClientOnly fallback={<></>}>{() => createEditorReadOnly}</ClientOnly>
          {isOverflowing && isCollapsed && (
            <ButtonLoadMore
              text="See More"
              onClick={() => setIsCollapsed(false)}
            />
          )}
          <div className="flex items-start justify-between gap-[15px] border-b border-solid border-b-[#C1BAB4] pb-3.5 max-smallest:flex-col">
            <PostEmojis
              postId={updatedPost.databaseId}
              totalEmojis={updatedPost.postFields.totalEmojis}
              onChange={(totalEmojis) => {
                setUpdatedPost((prev) => ({
                  ...prev,
                  postFields: {
                    ...prev.postFields,
                    totalEmojis,
                  },
                }));
              }}
            />
            <div className="flex items-center text-sm text-[#686867]">
              <button
                type="button"
                onClick={() => setIsCommentCollapsed(!isCommentCollapsed)}
                className="text-[#032525] transition duration-300 ease-in-out hover:font-medium"
              >
                {`${updatedPost.postFields.totalComments} ${
                  updatedPost.postFields.totalComments > 1
                    ? "Comments"
                    : "Comment"
                }`}
              </button>

              {updatedPost.postFields.totalShares.count > 0 && (
                <>
                  <span className="px-2 py-0">•</span>
                  <button
                    type="button"
                    onClick={handleSharePost}
                    className="text-[#032525] transition duration-300 ease-in-out hover:font-medium"
                  >
                    {`${updatedPost.postFields.totalShares.count} ${
                      updatedPost.postFields.totalShares.count > 1
                        ? "Shares"
                        : "Share"
                    }`}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="">
            <Collapse
              isOpen={showEmojiMart}
              transition={"height 300ms cubic-bezier(0.4, 0, 0.2, 1)"}
            >
              <EmojiMart
                id={`emoji-mart-mobile-${updatedPost.databaseId}`}
                className={classNames(
                  "post-react-button-emoji-mart",
                  "h-60 w-full",
                )}
                pickerOptions={emojiMartPickerOptions}
              />
            </Collapse>
          </div>
          <div className="flex items-center justify-between gap-2.5 text-base font-semibold text-[#686867]">
            <div className={classNames("relative")}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (!User.user) return navigate(APP_ROUTES.LOGIN);
                  if (window.innerWidth < 768) {
                    dispatchShowMobilePicker(updatedPost.databaseId.toString());
                  } else {
                    setShowEmojiMart(!showEmojiMart);
                  }
                }}
                className="flex items-center gap-2.5 hover:text-chw-light-purple max-xxs:flex-col"
              >
                <div className="h-8 w-8">
                  <SVGReact />
                </div>
                <span>React</span>
              </button>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsCommentCollapsed(!isCommentCollapsed);
              }}
              className="flex items-center gap-2.5 hover:text-chw-light-purple max-xxs:flex-col"
            >
              <div className="h-8 w-8">
                <SVGComment />
              </div>
              <span>Comment</span>
            </button>
            <button
              type="button"
              onClick={handleSharePost}
              className="flex items-center gap-2.5 hover:text-chw-light-purple max-xxs:flex-col"
            >
              <div className="h-8 w-8">
                <SVGShare />
              </div>
              <span>Share</span>
            </button>
          </div>
          <div className="">
            <Collapse
              isOpen={!isCommentCollapsed}
              transition={"height 300ms cubic-bezier(0.4, 0, 0.2, 1)"}
              overflowOnExpanded={false}
              style={
                isCommentCollapsed
                  ? { maxHeight: "120px" }
                  : { maxHeight: "none", overflow: "visible" }
              }
            >
              {createPostCommentEditor}

              {updatedPost.postFields.totalComments > 0 && (
                <>
                  <div className="my-5 w-full border border-[#C1BAB4]"></div>
                  {commentOpts?.viewAllComments && (
                    <ViewAllCommentsButton
                      to={`${APP_ROUTES.POST}/${updatedPost.databaseId}`}
                    />
                  )}

                  <PostCommentsThread
                    root={true}
                    totalComments={updatedPost.postFields.firstComments}
                    post={updatedPost}
                    total={updatedPost.postFields.firstComments.total}
                    activeCommentId={commentOpts?.activeCommentId}
                  />
                  {commentOpts?.viewAllComments && (
                    <ViewAllCommentsButton
                      to={`${APP_ROUTES.POST}/${updatedPost.databaseId}`}
                    />
                  )}
                </>
              )}
            </Collapse>
          </div>
        </div>
      </div>
      {process.env.NODE_ENV === "development" && (
        <h1 className="text-center font-semibold text-[#032525]">
          Post {updatedPost.databaseId}
        </h1>
      )}
    </>
  );
}

function ViewAllCommentsButton({
  className,
  to,
}: {
  className?: string;
  to: string;
}) {
  return (
    <div className="flex">
      <Link
        className={classNames(
          "cursor-pointer text-chw-dark-green hover:text-chw-light-purple",
          "rounded-[40px] border-[none] py-2.5 pr-[25px] text-center text-base font-bold transition duration-300 ease-in-out",
          "flex items-center justify-start gap-1",
          className || "",
        )}
        to={to}
      >
        <span>
          <ChevronLeftIcon className="inline-block h-8 w-8" />
        </span>
        <span>View All Comments</span>
      </Link>
    </div>
  );
}
