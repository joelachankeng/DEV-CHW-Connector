import { Form, Link } from "@remix-run/react";
import { useContext, useRef, useState } from "react";
import { APP_ROUTES, USER_ROLES } from "~/constants";
import { AppContext } from "~/contexts/appContext";
import { classNames } from "~/utilities/main";
import Avatar from "../User/Avatar";
import SVGCloseButton from "~/assets/SVGs/SVGCloseButton";
import PostEditor, { EDITOR_ERROR_MESSAGE } from "./Editor/PostEditor";
import type { OutputData } from "@editorjs/editorjs";
import type EditorJS from "@editorjs/editorjs";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import type { iGenericError, iGenericSuccess } from "~/models/appContext.model";
import type { iWP_Post, iWP_Post_Group_Type } from "~/models/post.model";
import LoadingSpinner from "../Loading/LoadingSpinner";
import _ from "lodash";

export default function PostAddNew({
  groupId,
  groupType,
  onSubmit,
}: {
  groupId: number;
  groupType: iWP_Post_Group_Type;
  onSubmit: () => void;
}) {
  const { appContext } = useContext(AppContext);

  const [collapsed, setCollapsed] = useState(true);
  const [postData, setPostData] = useState<OutputData["blocks"]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const editorRef = useRef<EditorJS>();

  const { state: addPostFetchState, submit: addPostFetchSubmit } =
    useAutoFetcher<iGenericSuccess | iGenericError>(
      "/api/post/create",
      (data) => {
        editorRef.current?.readOnly
          .toggle(false)
          .then(() => {
            if ("success" in data) {
              setErrorMessage("");
              editorRef.current?.clear();
              onSubmit();
            }

            if ("error" in data) {
              setErrorMessage(
                `An error occurred while creating the post: ${data.error} Please try again.`,
              );
            }
          })
          .catch((error) => {
            console.error("Error: ", error);
            setErrorMessage(EDITOR_ERROR_MESSAGE);
          });
      },
    );

  const handleClearNewPost = () => {
    editorRef.current?.clear();
    setCollapsed(true);
  };

  const handleEditorOnChange = (blocks: OutputData["blocks"]) => {
    if (blocks.length === 0) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
    setPostData(blocks);
  };

  const handleSubmitNewPost = (
    e: React.MouseEvent<HTMLButtonElement>,
    poster: iWP_Post["postFields"]["poster"] = "USER",
  ) => {
    e.preventDefault();
    if (postData == undefined || postData.length == 0) return;

    if (!editorRef.current) return setErrorMessage(EDITOR_ERROR_MESSAGE);
    editorRef.current.readOnly
      .toggle(true)
      .then(() => {
        addPostFetchSubmit(
          {
            groupId: groupId.toString(),
            groupType: groupType,
            post: JSON.stringify({
              blocks: postData,
            }),
            poster: poster,
          },
          "POST",
        );
      })
      .catch((error) => {
        console.error("Error: ", error);
        setErrorMessage(EDITOR_ERROR_MESSAGE);
      });
  };

  const durationClasses = "transition-all duration-300 ease-in-out";

  return (
    <div
      className={classNames(
        "relative",
        "max-md:after:-ml-5 max-md:after:block max-md:after:h-[4px] max-md:after:w-[100vw] max-md:after:bg-[#C1BAB4] max-md:after:content-['']",
      )}
    >
      <Form
        className={classNames(
          "editor-top-parent",
          "relative z-10 flex flex-col gap-5 overflow-hidden rounded-[10px] border border-solid border-[#E8E0D6] bg-white p-5",
          "max-md:border-none max-md:px-0",
        )}
        encType="multipart/form-data"
      >
        <div className="flex w-full items-center justify-between gap-2.5">
          <div className="flex w-full items-center gap-5">
            <div className="h-10 w-10">
              <Link to={`${APP_ROUTES.PROFILE}/${appContext.User?.databaseId}`}>
                <Avatar
                  src={appContext.User?.avatar?.url}
                  alt={`${appContext.User?.firstName} ${appContext.User?.lastName}`}
                />
              </Link>
            </div>
            <div className="flex flex-1 flex-col">
              <div className="font-semibold">
                <p className="text-sm text-[#686867]">
                  <Link
                    to={`${APP_ROUTES.PROFILE}/${appContext.User?.databaseId}`}
                    className="transition duration-300 ease-in-out hover:text-chw-light-purple"
                  >
                    {appContext.User?.firstName} {appContext.User?.lastName}
                  </Link>
                </p>
              </div>
            </div>
            <div className="">
              <button
                onClick={handleClearNewPost}
                type="button"
                className="h-5 w-5"
              >
                <span className="sr-only">Clear New Post</span>
                <SVGCloseButton
                  bgStroke={{ default: "none", hover: "#625DA6" }}
                  stroke={{ default: "#686867", hover: "#fff" }}
                  border={{ default: "#686867", hover: "none" }}
                />
              </button>
            </div>
          </div>
        </div>
        <div
          className={classNames(
            "flex w-full items-center gap-5",
            durationClasses,
            "relative z-10",
            collapsed ? "-mt-16" : "mt-0",
          )}
        >
          <div
            className={classNames(
              "h-10 w-10",
              durationClasses,
              collapsed
                ? ""
                : "max-xs:-ml-5 max-xs:h-0 max-xs:w-0 max-xs:opacity-0",
            )}
          ></div>
          <PostEditor
            editorRef={editorRef}
            containerClassNames="!w-full"
            blockData={postData}
            editorHolderId="new-post-editor"
            editorPlaceholder="Make a post..."
            onChange={(data) => handleEditorOnChange(data)}
          />
        </div>
        {errorMessage && (
          <p className="ml-[3.75rem] max-xs:ml-0">
            <span className="font-semibold text-red-800">{errorMessage}</span>
          </p>
        )}
        <div
          className={classNames(
            "flex items-end justify-end gap-x-5 gap-y-2 max-xs:flex-col",
            durationClasses,
            collapsed ? "-mt-[4.6875rem] mr-7" : "mr-0 mt-0",
            errorMessage ? "!mt-0" : "",
          )}
        >
          {addPostFetchState !== "idle" ? (
            <LoadingSpinner className="" />
          ) : (
            <>
              <button
                onClick={handleSubmitNewPost}
                type="submit"
                disabled={collapsed || postData.length === 0}
                className="w-full max-w-[6.875rem] cursor-pointer rounded-[40px] border-2 border-[none] border-chw-light-purple bg-white px-[25px] py-2.5 text-center text-base font-bold text-chw-light-purple transition duration-300 ease-in-out hover:bg-chw-light-purple hover:text-white"
              >
                Post
              </button>
              {appContext.User &&
                appContext.User.roles.nodes.find(
                  (n) => n.name === USER_ROLES.ADMIN,
                ) && (
                  <button
                    onClick={(e) => handleSubmitNewPost(e, "GROUP")}
                    type="submit"
                    disabled={collapsed || postData.length === 0}
                    className="cursor-pointer rounded-[40px] border-2 border-[none] border-chw-light-purple bg-white px-[25px] py-2.5 text-center text-base font-bold text-chw-light-purple transition duration-300 ease-in-out hover:bg-chw-light-purple hover:text-white"
                  >
                    Post as {_.capitalize(groupType)}
                  </button>
                )}
            </>
          )}
        </div>
      </Form>
    </div>
  );
}
