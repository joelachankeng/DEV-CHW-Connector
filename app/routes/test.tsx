import Page from "~/components/Pages/Page";
import { APP_CLASSNAMES, USER_ROLES } from "~/constants";
import type EditorJS from "@editorjs/editorjs";
import type { iPostEditorPropSetter } from "~/components/Posts/Editor/PostEditor";
import PostEditor from "~/components/Posts/Editor/PostEditor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OutputData } from "@editorjs/editorjs";
import samplePost from "~/utilities/samplePost.json";
import Post from "~/components/Posts/Post";
import type { LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  getJWTUserDataFromSession,
  getSession,
  requireUserSession,
} from "~/servers/userSession.server";
import { useLoaderData } from "@remix-run/react";
import { User } from "~/controllers/user.control";
import type { iUser_UploadKeys } from "~/models/user.model";
import { OneSignal } from "~/controllers/OneSignal.control";
import { NotificationControl } from "~/controllers/notification.control";

type iLoaderData = {
  uploadKeys: iUser_UploadKeys;
  userToken: string;
};
export const loader: LoaderFunction = async ({ request }) => {
  // const formData = new FormData();
  // formData.append("hello", "world");
  // const result = await NotificationControl.API.Automations.send(
  //   request,
  //   -1,
  //   "post",
  // );

  // if (result instanceof Error) {
  //   console.error("result", result);
  // } else {
  //   console.log("result", result);
  // }

  await requireUserSession(request);
  if (process.env.NODE_ENV !== "development") {
    const notFound = new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
    const JWTUser = await getJWTUserDataFromSession(request);
    if (!JWTUser) throw notFound;

    const user = await User.API.getUser(JWTUser.user.user_email, "EMAIL");
    if (!user || user instanceof Error) throw notFound;

    const isAdmin = user.roles.nodes.find((n) => n.name === USER_ROLES.ADMIN);
    if (!isAdmin) throw notFound;
  }
  const session = await getSession(request);
  const userToken = session.get("user");

  const uploadKeys = User.Utils.getUploadKeys(userToken);

  return json({
    uploadKeys,
    userToken,
  });
};

export default function FeedView() {
  const { uploadKeys, userToken } = useLoaderData<iLoaderData>();
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

  const updateContent = (content: string) => {
    let domain = window.location.origin;
    if (domain.includes("localhost")) {
      domain = "http://localhost:4001";
    }

    const api = "/.netlify/functions/notifications";
    const url = `${domain}${api}`;

    const data = new FormData();
    data.append("session", userToken);
    data.append("postId", "1174");

    fetch(url, {
      method: "POST",
      body: data,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const handleTest = async () => {
    updateContent("hello");
  };

  return (
    <>
      <Page>
        <div className={APP_CLASSNAMES.CONTAINER_FULLWIDTH}>
          <div className="flex min-h-[90vh] w-full items-center justify-center">
            <div className="flex w-full flex-col">
              <div className="my-2 flex items-center gap-2 ">
                {/* <Post post={samplePost[0] as any} /> */}
                <button
                  onClick={handleTest}
                  className="rounded-md bg-blue-500 p-2 text-white"
                >
                  test
                </button>
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
