import Page from "~/components/Pages/Page";
import { APP_CLASSNAMES } from "~/constants";
import type EditorJS from "@editorjs/editorjs";
import type { iPostEditorPropSetter } from "~/components/Posts/Editor/PostEditor";
import PostEditor from "~/components/Posts/Editor/PostEditor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OutputData } from "@editorjs/editorjs";
import samplePost from "~/utilities/samplePost.json";
import Post from "~/components/Posts/Post";
import type { LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { requireUserSession } from "~/servers/userSession.server";
import { useLoaderData } from "@remix-run/react";
import { User } from "~/controllers/user.control";
import type { iUser_UploadKeys } from "~/models/user.model";

type iLoaderData = {
  uploadKeys: iUser_UploadKeys;
};
export const loader: LoaderFunction = async ({ request }) => {
  if (process.env.NODE_ENV !== "development") {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }
  const userToken = await requireUserSession(request);

  const uploadKeys = User.Utils.getUploadKeys(userToken);

  return json({
    uploadKeys,
  });
};

export default function FeedView() {
  const { uploadKeys } = useLoaderData<iLoaderData>();
  console.log("Rendering FeedView");

  const [count, setCount] = useState(0);
  const [editorDataJSON, setEditorDataJSON] = useState<string>("");

  const editorRef = useRef<EditorJS>();
  const editorData = useRef<OutputData["blocks"]>([]);
  const editorHolderId = useRef(`compose-message-editor`).current;
  const postEditorPropSetter = useRef<iPostEditorPropSetter>();

  const handleDataOnChange = useCallback((data: OutputData["blocks"]) => {
    editorData.current = data;
    setEditorDataJSON(JSON.stringify(data));
  }, []);

  const createPostEditor = useMemo(
    () => (
      <PostEditor
        editorRef={editorRef}
        containerClassNames="!w-full"
        blockData={editorData.current}
        editorHolderId={editorHolderId}
        editorPlaceholder={"Write a message..."}
        preventWindowClosingMessage="You have unsaved changes in your comment. Are you sure you want to close the window?"
        submitTooltipText={"Send Message"}
        isSubmitting={false}
        onSubmit={(e, data) => {
          console.log("onSubmit", data);
        }}
        onChange={(data) => handleDataOnChange(data)}
        propSetter={postEditorPropSetter}
      />
    ),
    [editorHolderId, handleDataOnChange],
  );

  return (
    <>
      <Page>
        <div className={APP_CLASSNAMES.CONTAINER_FULLWIDTH}>
          <div className="flex min-h-[90vh] w-full items-center justify-center">
            <div className="flex w-full flex-col">
              <div className="my-2 flex items-center gap-2 ">
                {/* <Post post={samplePost[0] as any} /> */}
                <button
                  onClick={() => {
                    editorRef.current
                      ?.save()
                      .then((data) => {
                        // console.log("editorData.current", editorData.current);
                        // console.log("editorDataJSON", editorDataJSON);
                        console.log("editorRef data", data);
                      })
                      .catch((error) => {
                        console.error("Error: ", error);
                      });
                  }}
                >
                  Click
                </button>
                <button
                  onClick={() => {
                    setCount(count + 1);
                  }}
                >
                  {count}
                </button>
              </div>
              {createPostEditor}
            </div>
          </div>
        </div>
      </Page>
    </>
  );
}
