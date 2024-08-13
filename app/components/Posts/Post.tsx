import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import { Link, useFetcher, useNavigate } from "@remix-run/react";
import SVGComment from "~/assets/SVGs/SVGComment";
import SVGReact from "~/assets/SVGs/SVGReact";
import SVGShare from "~/assets/SVGs/SVGShare";
import { APP_ROUTES } from "~/constants";
import type { iWP_Post } from "~/models/post.model";
import { faBookmark, faFlag, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DateTime } from "luxon";
import { ClientOnly } from "remix-utils/client-only";
import { EditorBlock } from "../Editor/EditorBlock";
import type { OutputData } from "@editorjs/editorjs";
import { useContext, useEffect, useRef, useState } from "react";
import type EditorJS from "@editorjs/editorjs";
import type { iGenericError, iGenericSuccess } from "~/models/appContext.model";
import { classNames } from "~/utilities/main";
import Avatar from "../User/Avatar";
import { AppContext } from "~/contexts/appContext";
import type { iNotificationItem_General } from "../Managers/Notification/NotificationItem";
import type { iEmojiPickerIcon } from "~/utilities/hooks/useEmojiMart";
import { useEmojiMart } from "~/utilities/hooks/useEmojiMart";
import PostEmojis, { calcUserUpdateReaction } from "./PostEmojis";
import ButtonLoadMore from "../ButtonLoadMore";
import ModalShare from "../Modals/ModalShare";
import PostCommentEditor from "./PostCommentEditor";
import { Collapse } from "@kunukn/react-collapse";
import PostCommentsThread from "./PostCommentsThread";
import type { iContextMenuProps } from "../ContextMenu";
import ContextMenu from "../ContextMenu";
import ModalNotification from "../Modals/ModalNotification";
import { UserPublic } from "~/controllers/user.control.public";

export default function Post({ post }: { post: iWP_Post }) {
  const { appContext, setAppContext } = useContext(AppContext);
  const navigate = useNavigate();
  const { NotificationManager } = appContext;

  const { EmojiMart, showEmojiMart, setShowEmojiMart } = useEmojiMart();
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
  const [isCommentCollapsed, setIsCommentCollapsed] = useState(true);

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
  }, [editorRef.current]);

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

          const newAppContext = {
            ...appContext,
            NotificationManager: [...NotificationManager, errorNotification],
          };
          setAppContext(newAppContext);
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

          const newAppContext = {
            ...appContext,
            NotificationManager: [...NotificationManager, errorNotification],
          };
          setAppContext(newAppContext);
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

          const newAppContext = {
            ...appContext,
            NotificationManager: [...NotificationManager, errorNotification],
          };
          setAppContext(newAppContext);
        }
        break;
      case "DELETE":
        if ("error" in data) {
          errorNotification.message += ` delete post #${updatedPost.databaseId}. Please try again.`;
          setIsDeleted(false);

          const newAppContext = {
            ...appContext,
            NotificationManager: [...NotificationManager, errorNotification],
          };
          setAppContext(newAppContext);
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
    if (!appContext.User) return navigate(APP_ROUTES.LOGIN);
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
      appContext,
      emoji.id,
      updatedPost.postFields.totalEmojis,
    );

    if (!result) return;

    if ("time" in result) {
      setAppContext({
        ...appContext,
        NotificationManager: [...appContext.NotificationManager, result],
      });
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

    fetcher.submit(formData, {
      method: "post",
      action: "/api/post/react",
    });

    setAction("REACT");
  };

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
    if (UserPublic.Utils.userCanDeletePost(appContext.User, post)) {
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
          <ClientOnly fallback={<></>}>
            {() => (
              <>
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
              </>
            )}
          </ClientOnly>
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
                {`${updatedPost.postFields.totalComments.count} ${
                  updatedPost.postFields.totalComments.count > 1
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
                pickerOptions={{
                  skinTonePosition: "none",
                  skin: 1,
                  dynamicWidth: true,
                  onEmojiSelect: (emoji: iEmojiPickerIcon) =>
                    handleEmojiSelect(emoji),
                  onClickOutside: () => setShowEmojiMart(false),
                }}
              />
            </Collapse>
          </div>
          <div className="flex items-center justify-between gap-2.5 text-base font-semibold text-[#686867]">
            <div className={classNames("relative")}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (!appContext.User) return navigate(APP_ROUTES.LOGIN);
                  setShowEmojiMart(!showEmojiMart);
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
              <PostCommentEditor
                postId={updatedPost.databaseId}
                onSubmit={(comment) => {
                  console.log("Commented", comment);

                  setUpdatedPost((prev) => ({
                    ...prev,
                    postFields: {
                      ...prev.postFields,
                      totalComments: {
                        count: prev.postFields.totalComments.count + 1,
                        collection: [
                          comment,
                          ...prev.postFields.totalComments.collection,
                        ],
                      },
                    },
                  }));
                }}
              />

              {updatedPost.postFields.totalComments.count > 0 && (
                <>
                  <div className="my-5 w-full border border-[#C1BAB4]"></div>
                  <PostCommentsThread
                    root={true}
                    totalComments={updatedPost.postFields.totalComments}
                    post={updatedPost}
                  />
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

export function calcEditorData(editorSavedData: string): OutputData {
  let editorData: OutputData = {
    blocks: [],
  };
  try {
    editorData = JSON.parse(editorSavedData) as OutputData;
  } catch (error) {
    editorData.blocks = [
      {
        type: "paragraph",
        data: {
          text: "An error occurred while trying to load this post.",
        },
      },
    ];
  }
  return editorData as OutputData;
}
