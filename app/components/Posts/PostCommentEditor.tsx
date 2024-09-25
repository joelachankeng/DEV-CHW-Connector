import { Form, Link, useNavigate } from "@remix-run/react";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { APP_ROUTES } from "~/constants";
import type { iWP_Comment } from "~/models/post.model";
import { AppContext } from "~/contexts/appContext";
import Avatar from "../User/Avatar";
import type { OutputData } from "@editorjs/editorjs";
import type EditorJS from "@editorjs/editorjs";
import type { iGenericError } from "~/models/appContext.model";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import type { iPostEditorPropSetter } from "./Editor/PostEditor";
import PostEditor, { EDITOR_ERROR_MESSAGE } from "./Editor/PostEditor";
import type { iCreatePostComment } from "~/controllers/feed.control";

export default function PostCommentEditor({
  postId,
  parentId = 0,
  onSubmit,
}: {
  postId: number;
  parentId?: number;
  onSubmit: (comment: iWP_Comment) => void;
}) {
  const editorHolderId = `post-${postId}-commentParent-${parentId}-comment-editor`;

  const { appContext } = useContext(AppContext);
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState<string>("");

  const [startSubmit, setStartSubmit] = useState<boolean>(false);
  const hasSubmitted = useRef<boolean | undefined>(undefined);

  const editorRef = useRef<EditorJS>();
  const commentData = useRef<OutputData["blocks"]>([]);
  const postEditorPropSetter = useRef<iPostEditorPropSetter>();

  const { state: commentFetchState, submit: commentFetchSubmit } =
    useAutoFetcher<iCreatePostComment | iGenericError>(
      "/api/comment/create",
      (data) => {
        setStartSubmit(false);
        hasSubmitted.current = undefined;

        postEditorPropSetter.current?.setSubmitting(false);

        editorRef.current?.readOnly
          .toggle(false)
          .then(() => {
            if ("success" in data) {
              editorRef.current?.clear();
              commentData.current = [];
              if (!data.comment) {
                setErrorMessage(
                  "An error occurred retrieving the comment data. Please try again.",
                );
                return;
              }

              const newComment: iWP_Comment = data.comment;
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
    commentData.current = blocks;
    if (blocks.length === 0) {
      //
    } else {
      //
    }
  };

  useEffect(() => {
    if (commentFetchState !== "idle") return;
    if (startSubmit && hasSubmitted.current === false) {
      postEditorPropSetter.current?.setSubmitting(true);
      commentFetchSubmit(
        {
          postId: postId.toString(),
          parentId: parentId.toString(),
          comment: JSON.stringify({
            blocks: commentData.current,
          }),
        },
        "POST",
      );
      hasSubmitted.current = true;
    }
  }, [commentFetchState, commentFetchSubmit, parentId, postId, startSubmit]);

  const handleSubmitComment = useCallback(
    (_editor: EditorJS, blockData: OutputData["blocks"]) => {
      if (!appContext.User) return navigate(APP_ROUTES.LOGIN);
      if (blockData == undefined || blockData.length == 0) return;
      if (!editorRef.current) return setErrorMessage(EDITOR_ERROR_MESSAGE);

      editorRef.current.readOnly
        .toggle(true)
        .then(() => {
          commentData.current = blockData;

          setStartSubmit(true);
          hasSubmitted.current = false;
        })
        .catch((error) => {
          console.error("Error: ", error);
          setErrorMessage(EDITOR_ERROR_MESSAGE);
        });
    },
    [appContext.User, navigate],
  );

  const createEditor = useMemo(
    () => (
      <PostEditor
        editorRef={editorRef}
        containerClassNames="!w-full"
        blockData={commentData.current}
        editorHolderId={editorHolderId}
        editorPlaceholder={
          appContext.User ? "Add a comment..." : "Please log in to comment."
        }
        preventWindowClosingMessage="You have unsaved changes in your comment. Are you sure you want to close the window?"
        submitTooltipText={appContext.User ? "Post Comment" : "Log In"}
        onSubmit={handleSubmitComment}
        onChange={(data) => handleDataOnChange(data)}
        propSetter={postEditorPropSetter}
      />
    ),
    [editorHolderId, appContext.User, handleSubmitComment],
  );

  return (
    <>
      <Form
        encType="multipart/form-data"
        method="post"
        onSubmit={() => {
          if (!editorRef.current) return;
          handleSubmitComment(editorRef.current, commentData.current);
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
            {createEditor}
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
