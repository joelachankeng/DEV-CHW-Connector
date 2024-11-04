import { Link, useFetcher, useNavigate } from "@remix-run/react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { APP_ROUTES } from "~/constants";
import type { iWP_Comment } from "~/models/post.model";
import { AppContext } from "~/contexts/appContext";
import Avatar from "../User/Avatar";
import { ClientOnly } from "remix-utils/client-only";
import { calcEditorData, classNames } from "~/utilities/main";
import ButtonLoadMore from "../ButtonLoadMore";
import { EditorBlock } from "../Editor/EditorBlock";
import type EditorJS from "@editorjs/editorjs";
import { DateTime } from "luxon";
import { UserPublic } from "~/controllers/user.control.public";
import type { iGenericSuccess, iGenericError } from "~/models/appContext.model";
import ModalNotification from "../Modals/ModalNotification";
import PostCommentEditor from "./PostCommentEditor";
import { Collapse } from "@kunukn/react-collapse";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
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
import type { iNotificationItem_General } from "../Managers/Notification/NotificationItem";

const BUTTON_CLASSNAMES =
  "text-[#686867] font-semibold text-sm hover:text-[#032525]";

export default function PostComment({
  comment,
  groupId,
  postId,
  active = false,
  onSubmit,
}: {
  comment: iWP_Comment;
  groupId: number | undefined;
  postId: number;
  active?: boolean;
  onSubmit?: (comment: iWP_Comment) => void;
}) {
  const { User, NotificationManager } = useContext(AppContext);
  const navigate = useNavigate();

  const commentId = `comment-${comment.databaseId}`;
  const editorHolderId = useRef(`comment-readonly-editor-${commentId}`);

  const fetcher = useFetcher();
  const editorRef = useRef<EditorJS>();

  const { EmojiMart } = useEmojiMart();
  const [showEmojiMart, setShowEmojiMart] = useState<boolean>(false);

  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [action, setAction] = useState<
    "REACT" | "REPLY" | "REPORT" | "DELETE" | undefined
  >();
  const [deleteModal, setDeleteModal] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isCommentCollapsed, setIsCommentCollapsed] = useState(true);
  const [isReported, setIsReported] = useState(
    comment.commentsField.isReported,
  );
  const [totalEmojis, setTotalEmojis] = useState(
    comment.commentsField.totalEmojis,
  );

  const { state: commentFetchState, submit: commentFetchSubmit } =
    useAutoFetcher<iGenericSuccess | iGenericError>(
      "/api/comment/reportComment",
      (data) => {
        if ("error" in data) {
          setIsDeleted(comment.commentsField.isReported);
        }
      },
    );

  useEffect(() => {
    if (!editorRef.current) return;
    // console.log("editorRef.current", editorRef.current);

    editorRef.current?.isReady
      .then(() => {
        const editorHolder = document.getElementById(editorHolderId.current);
        if (!editorHolder) return;
        // const isOverflowing =
        //   editorHolder.scrollHeight > editorHolder.clientHeight;
        // setIsOverflowing(isOverflowing);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

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
          errorNotification.message += ` react to comment #${comment.databaseId}. Please try again.`;
          setTotalEmojis(comment.commentsField.totalEmojis);
          NotificationManager.addNotification(errorNotification);
        }
        break;
      case "DELETE":
        if ("error" in data) {
          errorNotification.message += ` delete post #${comment.databaseId}. Please try again.`;
          setIsDeleted(false);

          NotificationManager.addNotification(errorNotification);
        } else {
          setIsDeleted(true);
        }
        setDeleteModal(false);
        break;
    }

    setAction(undefined);
  }, [action, fetcher.data, fetcher.state]);

  useEffect(() => {
    if (isReported !== comment.commentsField.isReported) {
      setIsReported(comment.commentsField.isReported);
    }
  }, [comment.commentsField.isReported]);

  const handleDeleteComment = () => {
    const formData = new FormData();
    formData.append("commentId", comment.databaseId.toString());
    fetcher.submit(formData, {
      method: "post",
      action: "/api/comment/deleteComment",
    });

    setAction("DELETE");
  };

  const handleReactComment = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!User.user) return navigate(APP_ROUTES.LOGIN);
    if (window.innerWidth < 768) {
      dispatchShowMobilePicker(commentId);
    } else {
      setShowEmojiMart(!showEmojiMart);
    }
  };

  const handleReplyComment = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!User.user) return navigate(APP_ROUTES.LOGIN);

    setIsCommentCollapsed(!isCommentCollapsed);
  };

  const handleReportComment = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!User.user) return navigate(APP_ROUTES.LOGIN);

    commentFetchSubmit(
      {
        commentId: comment.databaseId.toString(),
        action: comment.commentsField.isReported ? "UNREPORT" : "REPORT",
      },
      "POST",
    );

    setIsReported(!isReported);
  };

  const createEditorReadOnly = useMemo(
    () => (
      <EditorBlock
        onEditor={(editor: EditorJS | undefined) => {
          editorRef.current = editor as EditorJS;
        }}
        data={calcEditorData(comment.commentsField.content)}
        holder={editorHolderId.current}
        readOnly={true}
        className={classNames(
          "relative z-0 overflow-hidden transition-all duration-300 ease-in-out",
          isOverflowing && isCollapsed
            ? "before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-full before:bg-[linear-gradient(transparent_10%,white)] before:content-['']"
            : "",
          // isCollapsed ? "max-h-28" : "", //TODO: Fix this
        )}
      />
    ),
    [comment.commentsField.content, isCollapsed, isOverflowing],
  );

  const createPostCommentEditor = useMemo(
    () => (
      <PostCommentEditor
        postId={postId}
        parentId={comment.databaseId}
        onSubmit={(comment) => {
          if (onSubmit) onSubmit(comment);
        }}
      />
    ),
    [comment.databaseId, onSubmit, postId],
  );

  useEffect(() => {
    const handleEmojiSelectListener = (event: EMOJI_SELECTED_EVENT) => {
      const { emoji, id } = event.detail;
      if (id !== commentId) return;
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

  const handleEmojiSelect = (emoji: iEmojiPickerIcon) => {
    setShowEmojiMart(false);

    const result = calcUserUpdateReaction(
      User,
      NotificationManager,
      emoji.id,
      totalEmojis,
    );

    if (!result) return;

    if ("time" in result) {
      NotificationManager.addNotification(result);
      return;
    }

    setTotalEmojis(result.emojis);
    console.log("comment emoji", result.emojis, emoji.id);

    const formData = new FormData();
    formData.append("postId", comment.databaseId.toString());
    formData.append("action", result.action);
    formData.append("emojiId", emoji.id);
    formData.append("emojiIcon", emoji.native);

    fetcher.submit(formData, {
      method: "post",
      action: "/api/comment/react",
    });

    setAction("REACT");
  };

  const emojiMartPickerOptions = {
    skinTonePosition: "none",
    skin: 1,
    dynamicWidth: true,
    onEmojiSelect: (emoji: iEmojiPickerIcon) => handleEmojiSelect(emoji),
    onClickOutside: () => setShowEmojiMart(false),
  };

  if (isDeleted) {
    return <></>;
  }

  return (
    <>
      <ModalNotification
        show={deleteModal}
        title="Delete Comment"
        content="Are you sure you want to delete this comment?"
        onConfirm={handleDeleteComment}
        onClose={() => setDeleteModal(false)}
      />
      <div className="relative">
        {isReported && (
          <div className="absolute -left-5 z-20 flex h-full w-[calc(100%+2.5rem)] cursor-not-allowed items-center justify-center text-center max-md:left-0 max-md:w-[100%]">
            <div className="w-full bg-[#FABE46] px-3 py-5 text-base font-semibold leading-[18px] text-[#032525]">
              <p>
                You have reported this comment. It is currently under review.
              </p>
              <button
                className={classNames(
                  "cursor-pointer bg-chw-light-purple text-white hover:bg-chw-dark-purple",
                  "mt-4 rounded-[40px] border-[none] px-[25px] py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
                )}
                type="button"
                onClick={handleReportComment}
              >
                Undo Report
              </button>
            </div>
          </div>
        )}

        <div
          id={`comment-${comment.databaseId}`}
          className={classNames(
            `${commentId}-container comment-editor`,
            `relative mt-1 flex items-start gap-2.5`,
            isReported ? "opacity-50 blur-sm " : "",
          )}
        >
          <div className="">
            <Link
              to={`${APP_ROUTES.PROFILE}/${comment.commentsField.author.databaseId}`}
              className="flex items-center gap-2"
            >
              <div className="h-10 w-10">
                <Avatar
                  src={comment.commentsField.author.avatarUrl}
                  alt={`${comment.commentsField.author.firstName} ${comment.commentsField.author.lastName}`}
                />
              </div>
            </Link>
          </div>
          <div className="w-full">
            <div
              className={classNames(
                "flex flex-1 flex-col rounded-[20px] bg-[#FFF5E5] px-5 py-2.5",
                active ? "border-4 border-chw-light-purple" : "",
              )}
            >
              <div className="mb-4">
                <Link
                  to={`${APP_ROUTES.PROFILE}/${comment.commentsField.author.databaseId}`}
                  className="text-base font-semibold text-[#032525] transition duration-300 ease-in-out hover:text-chw-light-purple hover:underline"
                >
                  {`${comment.commentsField.author.firstName} ${comment.commentsField.author.lastName}`}
                </Link>
                <time
                  dateTime={comment.createdDate}
                  className="block text-sm font-semibold text-[#686867]"
                >
                  {DateTime.fromISO(comment.createdDate).toLocaleString(
                    DateTime.DATETIME_SHORT,
                  )}{" "}
                  {process.env.NODE_ENV === "development" && (
                    <span className="font-semibold text-[#032525]">
                      ID - {comment.databaseId} | Parent ID -{" "}
                      {comment.commentsField.parentId || 0}
                    </span>
                  )}
                </time>
                {comment.modifiedDate != comment.createdDate && (
                  <p className="text-sm font-semibold text-chw-dark-purple">
                    <i>Edited</i>
                  </p>
                )}
              </div>
              <ClientOnly fallback={<></>}>
                {() => createEditorReadOnly}
              </ClientOnly>
              {isOverflowing && isCollapsed && (
                <ButtonLoadMore
                  text="See More"
                  onClick={() => setIsCollapsed(false)}
                />
              )}
            </div>
            {totalEmojis.usersCount > 0 && (
              <div className="mt-1">
                <PostEmojis
                  postId={comment.databaseId}
                  postType="COMMENT"
                  totalEmojis={totalEmojis}
                  onChange={(totalEmojis) => {
                    setTotalEmojis(totalEmojis);
                  }}
                />
              </div>
            )}
            <div className="">
              <Collapse
                isOpen={showEmojiMart}
                transition={"height 300ms cubic-bezier(0.4, 0, 0.2, 1)"}
              >
                <EmojiMart
                  id={`emoji-mart-mobile-comment-${comment.databaseId}`}
                  className={classNames(
                    "post-react-button-emoji-mart",
                    "mt-2 h-60 w-full",
                  )}
                  pickerOptions={emojiMartPickerOptions}
                />
              </Collapse>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 ">
                <button
                  type="button"
                  className={BUTTON_CLASSNAMES}
                  onClick={handleReactComment}
                >
                  React
                </button>
                <button
                  type="button"
                  className={classNames(
                    BUTTON_CLASSNAMES,
                    isCommentCollapsed
                      ? ""
                      : "!font-bold !text-chw-light-purple",
                  )}
                  onClick={handleReplyComment}
                >
                  Reply
                </button>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className={BUTTON_CLASSNAMES}
                  onClick={handleReportComment}
                >
                  Report
                </button>
                {UserPublic.Utils.userCanDeleteComment(
                  User.user,
                  groupId,
                  comment.commentsField.author.databaseId,
                ) && (
                  <button
                    type="button"
                    className={BUTTON_CLASSNAMES}
                    onClick={() => setDeleteModal(true)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            <div className={classNames(isCommentCollapsed ? "" : "mt-5")}>
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
              </Collapse>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
