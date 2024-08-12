import { Link, useFetcher, useNavigate } from "@remix-run/react";
import { useContext, useEffect, useRef, useState } from "react";
import { APP_ROUTES } from "~/constants";
import type { iWP_Post } from "~/models/post.model";
import { AppContext } from "~/contexts/appContext";
import Avatar from "../User/Avatar";
import { calcEditorData } from "./Post";
import { ClientOnly } from "remix-utils/client-only";
import { classNames } from "~/utilities/main";
import ButtonLoadMore from "../ButtonLoadMore";
import { EditorBlock } from "../Editor/EditorBlock";
import type EditorJS from "@editorjs/editorjs";
import { DateTime } from "luxon";
import { UserPublic } from "~/controllers/user.control.public";
import type { iGenericSuccess, iGenericError } from "~/models/appContext.model";
import ModalNotification from "../Modals/ModalNotification";

const BUTTON_CLASSNAMES =
  "text-[#686867] font-semibold text-sm hover:text-[#032525]";

export default function PostComment({
  comment,
  groupId,
}: {
  comment: iWP_Post["postFields"]["totalComments"]["collection"][0];
  groupId: number | undefined;
}) {
  const { appContext } = useContext(AppContext);
  const navigation = useNavigate();

  const commentId = `comment-${comment.databaseId}`;
  const editorHolderId = `comment-readonly-editor-${commentId}`;

  const fetcher = useFetcher();
  const editorRef = useRef<EditorJS>();

  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [action, setAction] = useState<
    "REACT" | "REPLY" | "REPORT" | "DELETE" | undefined
  >();
  const [deleteModal, setDeleteModal] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;
    // console.log("editorRef.current", editorRef.current);

    editorRef.current?.isReady
      .then(() => {
        const editorHolder = document.getElementById(editorHolderId);
        if (!editorHolder) return;
        // const isOverflowing =
        //   editorHolder.scrollHeight > editorHolder.clientHeight;
        // setIsOverflowing(isOverflowing);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [editorHolderId]);

  useEffect(() => {
    if (fetcher.state !== "idle") return;
    if (!fetcher.data) return;

    const data = fetcher.data as iGenericSuccess | iGenericError;
    switch (action) {
      case "DELETE":
        if ("error" in data) {
          setIsDeleted(false);
        } else {
          setIsDeleted(true);
        }
        setDeleteModal(false);
        break;
    }

    setAction(undefined);
  }, [action, fetcher.data, fetcher.state]);

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
    if (!appContext.User) return navigation(APP_ROUTES.LOGIN);
  };

  const handleReplyComment = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!appContext.User) return navigation(APP_ROUTES.LOGIN);
  };

  const handleReportComment = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
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
      <div
        className={`${commentId}-container comment-editor mt-1 flex items-start gap-2.5`}
      >
        <div className="">
          <Link
            to={`${APP_ROUTES.PROFILE}/${comment.author.databaseId}`}
            className="flex items-center gap-2"
          >
            <div className="h-10 w-10">
              <Avatar
                src={comment.author.avatarUrl}
                alt={`${comment.author.firstName} ${comment.author.lastName}`}
              />
            </div>
          </Link>
        </div>
        <div className="w-full">
          <div className="flex flex-1 flex-col rounded-[20px] bg-[#FFF5E5] px-5 py-2.5">
            <div className="mb-4">
              <Link
                to={`${APP_ROUTES.PROFILE}/${comment.author.databaseId}`}
                className="text-base font-semibold text-[#032525] transition duration-300 ease-in-out hover:text-chw-light-purple hover:underline"
              >
                {`${comment.author.firstName} ${comment.author.lastName}`}
              </Link>
              <time
                dateTime={comment.createdDate}
                className="block text-sm font-semibold text-[#686867]"
              >
                {DateTime.fromISO(comment.createdDate).toLocaleString(
                  DateTime.DATETIME_SHORT,
                )}
              </time>
              {comment.modifiedDate != comment.createdDate && (
                <p className="text-sm font-semibold text-chw-dark-purple">
                  <i>Edited</i>
                </p>
              )}
            </div>
            <ClientOnly fallback={<></>}>
              {() => (
                <>
                  <EditorBlock
                    onEditor={(editor: EditorJS | undefined) => {
                      editorRef.current = editor as EditorJS;
                    }}
                    data={calcEditorData(comment.content)}
                    holder={editorHolderId}
                    readOnly={true}
                    className={classNames(
                      "relative z-0 overflow-hidden transition-all duration-300 ease-in-out",
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
                className={BUTTON_CLASSNAMES}
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
                appContext.User,
                groupId,
                comment.author.databaseId,
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
        </div>
      </div>
    </>
  );
}
