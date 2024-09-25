import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import {
  Link,
  useLoaderData,
  useNavigate,
  useOutletContext,
} from "@remix-run/react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ContextMenu from "~/components/ContextMenu";
import { createMessageContextMenu } from "~/components/Messages/MessageThreadPreview";
import Avatar from "~/components/User/Avatar";
import { APP_ROUTES } from "~/constants";
import { classNames } from "~/utilities/main";
import type { iPostEditorPropSetter } from "~/components/Posts/Editor/PostEditor";
import PostEditor, {
  EDITOR_ERROR_MESSAGE,
} from "~/components/Posts/Editor/PostEditor";
import type EditorJS from "@editorjs/editorjs";
import { AppContext } from "~/contexts/appContext";
import type { iPublicUser } from "~/controllers/user.control";
import { User } from "~/controllers/user.control";
import type { iGenericError } from "~/models/appContext.model";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { ErrorComponent } from "~/components/Pages/ErrorPage";
import { getUserSubtext } from "./index";
import type { OutputData } from "@editorjs/editorjs";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import { Message } from "~/controllers/message.control";
import type {
  iWP_Messages_Pagination,
  iCreateMessage,
} from "~/controllers/message.control";
import type { iWP_Message } from "~/models/message.model";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";
import { createGraphQLPagination } from "~/controllers/graphql.control";
import type { iMessageThreadPropSetter } from "~/components/Messages/MessageThread";
import MessageThread from "~/components/Messages/MessageThread";
import type { iMessagesContextState } from "../messages";

type iSubmitData = { receiver: string; message: string } | undefined;

type loaderData = {
  user?: iPublicUser | iGenericError;
  messages: iWP_Messages_Pagination | iGenericError | undefined;
  paramId: string | undefined;
};

export async function loader({
  request,
  params,
}: LoaderFunctionArgs): Promise<ReturnType<typeof json<loaderData>>> {
  const JWTUser = await getJWTUserDataFromSession(request);
  const data: loaderData = {
    user: undefined,
    messages: undefined,
    paramId: params["*"],
  };

  if (!JWTUser) return json(data);

  const paramId = params["*"];
  if (!paramId) return json(data);

  const userId = parseInt(paramId);
  if (isNaN(userId)) return json(data);

  const user = await User.API.getUser(userId.toString(), "DATABASE_ID");
  if (user instanceof Error) {
    data.user = { error: user.message };
    return json(data);
  }

  if (user) {
    data.user = User.Utils.removeSensitiveUserData(user);

    const messages = await Message.API.getMessages(
      JWTUser.user.ID.toString(),
      userId.toString(),
      createGraphQLPagination(),
    );

    if (messages) {
      if (messages instanceof Error) {
        data.messages = { error: messages.message };
      } else {
        data.messages = messages;
      }
    }
  }

  return json(data);
}

export default function MessagesSingle() {
  const { layoutContext } = useOutletContext<iMessagesContextState>();
  const { appContext } = useContext(AppContext);
  const { user, messages } = useLoaderData() as loaderData;
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState<string>("");
  const [startSubmit, setStartSubmit] = useState<boolean>(false);
  const submitData = useRef<iSubmitData>();

  const editorHolderId = useRef(`compose-message-editor`);
  const editorRef = useRef<EditorJS>();
  const editorData = useRef<OutputData["blocks"]>([]);
  const userRef = useRef<typeof user>(user);

  const postEditorPropSetter = useRef<iPostEditorPropSetter>();
  const messageThreadPropSetter = useRef<iMessageThreadPropSetter>();

  const { state: messageCreateFetchState, submit: messageCreateFetchSubmit } =
    useAutoFetcher<iCreateMessage | iGenericError>(
      "/api/message/create",
      (data) => {
        setStartSubmit(false);
        submitData.current = undefined;
        postEditorPropSetter.current?.setSubmitting(false);
        messageThreadPropSetter.current?.setSubmitting(false);

        editorRef.current?.readOnly
          .toggle(false)
          .then(() => {
            if ("success" in data) {
              editorRef.current?.clear();
              if (!data.messagePost) {
                setErrorMessage(
                  "An error occurred retrieving the message data. Please try again.",
                );
                return;
              }

              const newMessage: iWP_Message = data.messagePost;
              messageThreadPropSetter.current?.addMessage(newMessage, true);
            }

            if ("error" in data) {
              setErrorMessage(
                "An error occurred during the message submission. Please try again.",
              );
            }
          })
          .catch((error) => {
            console.error("Error: ", error);
            setErrorMessage(EDITOR_ERROR_MESSAGE);
          });
      },
    );

  useEffect(() => {
    if (messageCreateFetchState !== "idle") return;
    if (!submitData.current) return;
    if (startSubmit) {
      postEditorPropSetter.current?.setSubmitting(true);
      messageCreateFetchSubmit(submitData.current, "POST");
      submitData.current = undefined;
    }
  }, [messageCreateFetchState, messageCreateFetchSubmit, startSubmit]);

  const handleDataOnChange = (blocks: OutputData["blocks"]) => {
    editorData.current = blocks;
  };

  const handleSubmitMessage = useCallback(
    (editor: EditorJS, blockData: OutputData["blocks"]) => {
      if (userRef.current === undefined || "error" in userRef.current) return;
      if (!appContext.User) return navigate(APP_ROUTES.LOGIN);
      if (blockData == undefined || blockData.length == 0) return;
      if (!editor) return setErrorMessage(EDITOR_ERROR_MESSAGE);

      messageThreadPropSetter.current?.setSubmitting(true);
      const userId = userRef.current.databaseId;

      editor.readOnly
        .toggle(true)
        .then(() => {
          editorData.current = blockData;
          setStartSubmit(true);
          submitData.current = {
            receiver: userId.toString(),
            message: JSON.stringify({
              blocks: blockData,
            }),
          };
        })
        .catch((error) => {
          console.error("Error: ", error);
          setErrorMessage(EDITOR_ERROR_MESSAGE);
        });
    },
    [appContext.User, navigate],
  );

  const createPostEditor = useMemo(
    () => (
      <PostEditor
        editorRef={editorRef}
        containerClassNames="!w-full"
        blockData={editorData.current}
        editorHolderId={editorHolderId.current}
        editorPlaceholder={"Write a message..."}
        preventWindowClosingMessage="You have unsaved changes in your comment. Are you sure you want to close the window?"
        submitTooltipText={"Send Message"}
        onSubmit={handleSubmitMessage}
        onChange={(data) => handleDataOnChange(data)}
        propSetter={postEditorPropSetter}
      />
    ),
    [handleSubmitMessage],
  );

  const handleMarkAsRead = () => {
    // mark all messages as read
  };

  if (!user || "error" in user) {
    return (
      <ErrorComponent
        title={"User not found"}
        description={
          user?.error ||
          "The user you are looking for does not exist or has been deleted."
        }
        status={user?.error ? "500" : "404"}
        className="max-tablet-lg:!min-h-0"
      />
    );
  }

  if (!messages || "error" in messages) {
    return (
      <ErrorComponent
        title={"Messages not found"}
        description={
          messages?.error ||
          "An error occurred while retrieving the messages. Please try again."
        }
        status={"500"}
        className="max-tablet-lg:!min-h-0"
      />
    );
  }

  return (
    <div
      className={classNames(
        "editor-top-parent",
        "relative flex flex-col overflow-hidden rounded-[10px] border border-solid border-[#E8E0D6] bg-white p-5",
        "max-md:border-none max-md:px-0",
      )}
    >
      <div className="flex items-center gap-5">
        <div className="h-[4.5rem] w-[4.5rem] min-w-[4.5rem]">
          <Avatar
            src={user.avatar.value}
            alt={`${user.firstName.value} ${user.lastName.value}`}
          />
        </div>
        <div className="">
          <h1 className="text-lg font-semibold text-[#032525]">
            {user.firstName.value} {user.lastName.value}
          </h1>
          <p className="text-sm font-semibold text-[#686867]">
            {getUserSubtext(user).map((text, index) => (
              <span key={index}>{text}</span>
            ))}
          </p>
        </div>
        <div className="flex-1">
          <ContextMenu
            button={
              <span className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#686867] transition duration-300 ease-in-out group-hover:bg-[#625DA6] group-hover:text-white">
                <EllipsisHorizontalIcon className="h-4 w-4" />
              </span>
            }
            items={createMessageContextMenu(
              `${APP_ROUTES.PROFILE}/${user.databaseId}`,
              messages.nodes.length > 0 ? handleMarkAsRead : undefined,
              messages.nodes.length > 0 ? handleMarkAsRead : undefined,
              () => {
                //
              },
              () => {
                //
              },
            )}
          />
        </div>
      </div>
      {layoutContext.conversations?.map((conversation, index) => (
        <React.Fragment key={index}>
          {conversation.user.databaseId === user.databaseId ? (
            <MessageThread
              messages={messages}
              user={user}
              onAfterMessageFetch={() => {
                setStartSubmit(false);
                submitData.current = undefined;
              }}
              propSetter={messageThreadPropSetter}
            />
          ) : null}
        </React.Fragment>
      ))}
      <div
        className={`${editorHolderId}-container message-editor mt-4 flex items-start gap-2.5 border-t border-solid border-t-[#C1BAB4] pt-5`}
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
          {createPostEditor}
          {errorMessage && (
            <p className="">
              <span className="font-semibold text-red-800">{errorMessage}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
