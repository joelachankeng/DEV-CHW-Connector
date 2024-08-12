import { Form, Link, useNavigate } from "@remix-run/react";
import { useContext, useRef, useState } from "react";
import { APP_ROUTES } from "~/constants";
import type { iWP_Post } from "~/models/post.model";
import { AppContext } from "~/contexts/appContext";
import Avatar from "../User/Avatar";
import type { OutputData } from "@editorjs/editorjs";
import type EditorJS from "@editorjs/editorjs";
import type { iGenericError, iGenericSuccess } from "~/models/appContext.model";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import PostEditor, { EDITOR_ERROR_MESSAGE } from "./Editor/PostEditor";

export default function PostCommentEditor({
  postId,
  onSubmit,
}: {
  postId: number;
  onSubmit: (
    comment: iWP_Post["postFields"]["totalComments"]["collection"][0],
  ) => void;
}) {
  const editorHolderId = `post-${postId}-comment-editor`;

  const { appContext } = useContext(AppContext);
  const editorRef = useRef<EditorJS>();
  const navigate = useNavigate();

  const [commentData, setCommentData] = useState<OutputData["blocks"]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { state: commentFetchState, submit: commentFetchSubmit } =
    useAutoFetcher<iGenericSuccess | iGenericError>(
      "/api/comment/create",
      (data) => {
        editorRef.current?.readOnly
          .toggle(false)
          .then(() => {
            if ("success" in data) {
              editorRef.current?.clear();

              const currentDate = new Date().toISOString();

              const newComment: iWP_Post["postFields"]["totalComments"]["collection"][0] =
                {
                  createdDate: currentDate,
                  modifiedDate: currentDate,
                  databaseId: new Date().getTime(),
                  parentId: undefined,
                  postId: postId,
                  content: JSON.stringify({
                    blocks: commentData,
                  }),
                  author: {
                    avatarUrl: appContext.User?.avatar.url || "",
                    databaseId: appContext.User?.databaseId || 0,
                    firstName: appContext.User?.firstName || "",
                    lastName: appContext.User?.lastName || "",
                  },
                };

              setCommentData([]);
              onSubmit(newComment);
            }

            if ("error" in data) {
              setErrorMessage(
                "An error occurred during the comment submission. Please try again.",
              );
            }
          })
          .catch((error) => {
            console.error("Error: ", error);
            setErrorMessage(EDITOR_ERROR_MESSAGE);
          });
      },
    );

  const handleDataOnChange = (blocks: OutputData["blocks"]) => {
    if (blocks.length === 0) {
      //
    } else {
      //
    }
    setCommentData(blocks);
  };

  const handleSubmitComment = (
    editor: EditorJS,
    blockData: OutputData["blocks"],
  ) => {
    if (!appContext.User) return navigate(APP_ROUTES.LOGIN);
    console.log(blockData);
    if (blockData == undefined || blockData.length == 0) return;
    if (!editorRef.current) return setErrorMessage(EDITOR_ERROR_MESSAGE);

    editorRef.current.readOnly
      .toggle(true)
      .then(() => {
        commentFetchSubmit(
          {
            postId: postId.toString(),
            parentId: "",
            comment: JSON.stringify({
              blocks: blockData,
            }),
          },
          "POST",
        );
      })
      .catch((error) => {
        console.error("Error: ", error);
        setErrorMessage(EDITOR_ERROR_MESSAGE);
      });
  };

  return (
    <>
      <Form
        encType="multipart/form-data"
        method="post"
        onSubmit={() => {
          if (!editorRef.current) return;
          handleSubmitComment(editorRef.current, commentData);
        }}
      >
        <div
          className={`${editorHolderId}-container comment-editor mt-1 flex items-start gap-2.5`}
        >
          <div className="">
            <Link
              to={`${APP_ROUTES.PROFILE}/${appContext.User?.databaseId}`}
              className="flex items-center gap-2"
            >
              <div className="h-10 w-10">
                <Avatar
                  src={appContext.User?.avatar.url}
                  alt={`${appContext.User?.firstName} ${appContext.User?.lastName}`}
                />
              </div>
            </Link>
          </div>
          <div className="flex w-full flex-col gap-1">
            <PostEditor
              editorRef={editorRef}
              containerClassNames="!w-full"
              blockData={commentData}
              editorHolderId={editorHolderId}
              editorPlaceholder={
                appContext.User
                  ? "Add a comment..."
                  : "Please log in to comment."
              }
              preventWindowClosingMessage="You have unsaved changes in your comment. Are you sure you want to close the window?"
              submitTooltipText={appContext.User ? "Post Comment" : "Log In"}
              isSubmitting={commentFetchState !== "idle"}
              onSubmit={handleSubmitComment}
              onChange={(data) => handleDataOnChange(data)}
            />
            {errorMessage && (
              <p className="">
                <span className="font-semibold text-red-800">
                  {errorMessage}
                </span>
              </p>
            )}
          </div>
        </div>
      </Form>
    </>
  );
}
