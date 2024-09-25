import { Link } from "@remix-run/react";
import type { MutableRefObject } from "react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Avatar from "~/components/User/Avatar";
import { APP_ROUTES } from "~/constants";
import { classNames, isToday, isYesterday } from "~/utilities/main";
import type EditorJS from "@editorjs/editorjs";
import { AppContext } from "~/contexts/appContext";
import type { iPublicUser } from "~/controllers/user.control";
import type { iGenericError } from "~/models/appContext.model";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import type { iWP_Messages_Pagination } from "~/controllers/message.control";
import type { iWP_Message } from "~/models/message.model";
import { DateTime } from "luxon";
import { ClientOnly } from "remix-utils/client-only";
import { EditorBlock } from "~/components/Editor/EditorBlock";
import { calcEditorData } from "~/components/Posts/Post";
import _ from "lodash";
import { usePagination } from "~/utilities/hooks/usePagination";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import axios from "axios";

export type iMessageThreadPropSetter =
  | {
      addMessage: (message: iWP_Message, autoScroll: boolean) => void;
      setSubmitting: (isSubmitting: boolean) => void;
    }
  | undefined;

export default function MessageThread({
  messages,
  user,
  onAfterMessageFetch,
  propSetter,
}: {
  messages: iWP_Messages_Pagination;
  user: iPublicUser;
  onAfterMessageFetch?: (data: iWP_Messages_Pagination | iGenericError) => void;
  propSetter?: MutableRefObject<iMessageThreadPropSetter>;
}) {
  const { appContext } = useContext(AppContext);

  const [messagesGroups, setMessagesGroups] = useState<iMessageGroup[]>(
    organizeMessagesByDate(initMessages(messages)),
  );
  const [paginationError, setPaginationError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesRef = useRef<typeof messages>(messages);
  const paginationContainerRef = useRef<HTMLDivElement>(null);
  const isFetchingNewMessages = useRef(false);

  const observer = useRef<IntersectionObserver | null>(null);

  const ReadyOnlyEditor = useCallback(
    ({
      singleMessage,
      autoScroll = true,
    }: {
      singleMessage: iWP_Message;
      autoScroll?: boolean;
    }) => {
      return (
        <EditorBlock
          onEditor={(editor: EditorJS | undefined) => {
            //
          }}
          onReady={() => {
            if (autoScroll) scrollToCompose();
            const editorElement = document.getElementById(
              "message-" + singleMessage.databaseId + "-editor-readonly",
            );
            if (editorElement) {
              observer.current?.observe(editorElement);
            }
          }}
          dataContentId={singleMessage.databaseId.toString()}
          data={calcEditorData(singleMessage.messageFields.content)}
          holder={"message-" + singleMessage.databaseId + "-editor-readonly"}
          readOnly={true}
          className={classNames(
            "relative z-0 overflow-hidden transition-all duration-300 ease-in-out",
          )}
        />
      );
    },
    [],
  );

  const createEditors = useMemo(
    () =>
      messagesRef.current && "nodes" in messagesRef.current
        ? messagesRef.current.nodes.map((singleMessage) => (
            <ReadyOnlyEditor
              key={singleMessage.databaseId}
              singleMessage={singleMessage}
            />
          ))
        : [],
    [ReadyOnlyEditor],
  );

  function MessagesEditorsController(
    editors: JSX.Element[],
    messagesRef: MutableRefObject<iWP_Messages_Pagination>,
  ) {
    const add = (message: iWP_Message, autoScroll = false) => {
      if (messagesRef.current && "nodes" in messagesRef.current) {
        messagesRef.current.nodes.push(message);
      }
      editors.push(
        <ReadyOnlyEditor
          key={message.databaseId}
          singleMessage={message}
          autoScroll={autoScroll}
        />,
      );
    };

    const set = (messages: iWP_Message[], autoScroll = false) => {
      if (messagesRef.current && "nodes" in messagesRef.current) {
        messagesRef.current.nodes = messages;
      } else {
        messagesRef.current = {
          nodes: [],
          pageInfo: {
            endCursor: "",
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: "",
            total: messages.length,
          },
        };
      }
      editors.length = 0;
      messages.forEach((message) => {
        editors.push(
          <ReadyOnlyEditor
            key={message.databaseId}
            singleMessage={message}
            autoScroll={autoScroll}
          />,
        );
      });
    };

    return { add, set };
  }

  const messagesEditorsControl = useRef(
    MessagesEditorsController(createEditors, messagesRef),
  );

  const { pagination, setPagination, LoadMoreButton } = usePagination(
    paginationContainerRef,
    () => {
      if (!user || "error" in user) return;
      if (messageFetchState !== "idle" || !pagination.pageInfo) {
        return;
      }
      messageFetchSubmit(
        {
          receiverId: user.databaseId.toString(),
          after: pagination.pageInfo.endCursor,
        },
        "POST",
      );
      setPaginationError("");
    },
    {
      pageInfo:
        messages && "pageInfo" in messages ? messages.pageInfo : undefined,
      reverseScroll: true,
    },
  );

  const { state: messageFetchState, submit: messageFetchSubmit } =
    useAutoFetcher<iWP_Messages_Pagination | iGenericError>(
      "/api/message/getAllMessages",
      (data) => {
        onAfterMessageFetch && onAfterMessageFetch(data);

        if ("error" in data) {
          setPaginationError(
            "An error occurred while retrieving the messages. Please try again.",
          );
          return;
        }

        if (pagination.isLoading) {
          setPagination({
            isLoading: false,
            pageInfo: data.pageInfo,
          });
          let newMessagesGroups = messagesGroups;
          data.nodes.forEach((m) => {
            newMessagesGroups = addMessageToGroups(m, newMessagesGroups);
            messagesEditorsControl.current.add(m, false);
          });
          console.log(
            "newMessagesGroups",
            newMessagesGroups,
            messagesGroups,
            _.isEqual(newMessagesGroups, messagesGroups),
          );

          setMessagesGroups(newMessagesGroups);
        } else {
          setPagination({
            isLoading: false,
            pageInfo: data.pageInfo,
          });
          setMessagesGroups(organizeMessagesByDate(data.nodes));
          messagesEditorsControl.current.set(data.nodes, false);
        }
        console.log("data", data);
      },
    );

  const fetchNewMessages = useCallback(
    async (
      receiverId: number,
    ): Promise<iWP_Messages_Pagination | iGenericError> => {
      const formData = new FormData();
      formData.append("receiverId", receiverId.toString());
      return axios
        .post("/api/message/getAllMessages", formData)
        .then((res) => {
          return res.data as ReturnType<typeof fetchNewMessages>;
        })
        .catch((err) => {
          return { error: err.message };
        });
    },
    [],
  );

  const updateNewMessages = useCallback(
    (data: iWP_Messages_Pagination | iGenericError) => {
      if ("error" in data) return console.error(data.error);
      if (messagesRef.current === undefined || "error" in messagesRef.current)
        return;

      let newMessagesCount = 0;
      let newMessagesGroups = messagesGroups;
      // const fakeMessages = Array.from({ length: 5 }, () =>
      //   createRandomMessage(),
      // );
      // fakeMessages.forEach((m) => {
      data.nodes.forEach((m) => {
        if (
          messagesRef.current.nodes.find(
            (msg) => msg.databaseId === m.databaseId,
          )
        )
          return;
        newMessagesGroups = addMessageToGroups(m, newMessagesGroups);
        messagesEditorsControl.current.add(m, false);
        newMessagesCount++;
      });
      if (newMessagesCount === 0) return;

      setMessagesGroups(newMessagesGroups);
    },
    [messagesGroups],
  );

  useEffect(() => {
    scrollToCompose();
  }, []);

  useEffect(() => {
    observer.current = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          const messageElement = target as HTMLElement;
          const contentId = messageElement.getAttribute("data-content-id");
          if (!contentId) return;

          const getMessage = findMessageInGroups(
            parseInt(contentId),
            messagesGroups,
          );

          if (getMessage && appContext.User?.databaseId) {
            if (
              getMessage.messageFields.receiverId.toString() !==
              appContext.User.databaseId.toString()
            ) {
              // the message is not for the current user
              return;
            }
            if (getMessage.messageFields.read) return;
          }

          const formData = new FormData();
          formData.append("messageId", contentId);
          axios.post("/api/message/read", formData).catch((e) => {
            console.error("Error: ", e);
          });
        }
      });
    });

    return () => {
      observer.current?.disconnect();
    };
  }, [appContext.User?.databaseId, messagesGroups]);

  useEffect(() => {
    const interval = setInterval(function () {
      if (!appContext.User) return;
      if (!user || "error" in user) return;
      if (isSubmitting) return;
      if (isFetchingNewMessages.current) return;

      isFetchingNewMessages.current = true;
      fetchNewMessages(user.databaseId)
        .then(updateNewMessages)
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          isFetchingNewMessages.current = false;
        });
    }, 1000);
    return () => clearInterval(interval);
  }, [
    appContext.User,
    fetchNewMessages,
    isSubmitting,
    messageFetchState,
    updateNewMessages,
    user,
  ]);

  useEffect(() => {
    if (!propSetter) return;

    propSetter.current = {
      addMessage: (message, autoScroll) => {
        if (
          messagesRef.current.nodes.find(
            (msg) => msg.databaseId === message.databaseId,
          )
        )
          return;
        messagesEditorsControl.current.add(message, autoScroll);
        setMessagesGroups(addMessageToGroups(message, messagesGroups));
      },
      setSubmitting: () => setIsSubmitting,
    };

    return () => {
      propSetter.current = undefined;
    };
  }, [messages, messagesGroups, propSetter]);

  return (
    <>
      <div ref={paginationContainerRef} className="min-h-[12rem]">
        {messages.nodes.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-[#686867]">No messages yet.</p>
            <p className="font-semibold text-chw-dark-purple">
              Send a message to {user.firstName.value} to start a conversation.
            </p>
          </div>
        )}

        <div className="mx-auto flex flex-col items-center justify-center">
          {messageFetchState !== "idle" ? (
            <LoadingSpinner className="mt-4 cursor-progress" />
          ) : (
            <>
              {paginationError && (
                <p className="text-center font-semibold">
                  <span className="text-red-500">{paginationError}</span>
                </p>
              )}
              {pagination.pageInfo &&
                (pagination.pageInfo.hasNextPage ? (
                  <LoadMoreButton className="mt-4" />
                ) : (
                  <>
                    {messages.pageInfo.hasNextPage && (
                      <p className="mt-4 text-center">
                        You reached the end of the messages.
                      </p>
                    )}
                  </>
                ))}
            </>
          )}
        </div>
        {messagesGroups.map((messageGroup, index) => (
          <React.Fragment key={messageGroup.date}>
            <div
              className={classNames(
                "relative mx-0 mt-5 flex items-center justify-center text-center text-sm font-bold uppercase text-[#686867]",
                "after:absolute after:left-0 after:z-0 after:h-px after:w-full after:bg-[#C1BAB4] after:content-['']",
              )}
            >
              <span className="z-10 bg-white px-2.5 py-0">
                {getDateTime(messageGroup.date)}
              </span>
            </div>
            <div className="flex flex-col gap-2 ">
              {messageGroup.times.map((messageGroupTime, index) => (
                <div
                  key={messageGroupTime.time}
                  className={classNames(
                    "group-time",
                    index === 0 ? "mt-5" : "",
                    index === messageGroupTime.messages.length ? "mb-5" : "",
                  )}
                >
                  {messageGroupTime.messages.map((singleMessage, smindex) => (
                    <React.Fragment key={singleMessage.databaseId}>
                      {displayGroupTimeAuthor(
                        messageGroupTime.messages,
                        smindex,
                      ) && (
                        <div
                          className={classNames(
                            "mb-2.5 flex w-full items-center gap-5",
                            singleMessage.author.node.databaseId ===
                              appContext.User?.databaseId
                              ? "flex-row-reverse text-right"
                              : "",
                          )}
                        >
                          <Link to={`${APP_ROUTES.PROFILE}/`} className="">
                            <div className="h-8 w-8">
                              <Avatar
                                src={singleMessage.author.node.avatar.url}
                                alt={`${singleMessage.author.node.firstName} ${singleMessage.author.node.lastName}`}
                              />
                            </div>
                          </Link>
                          <div className="">
                            <h1 className="font-semibold text-[#032525]">
                              {singleMessage.author.node.firstName}{" "}
                              {singleMessage.author.node.lastName}
                            </h1>
                            <p className="text-xs font-semibold text-[#686867]">
                              <time
                                dateTime={messageGroupTime.time}
                                className="block text-sm font-semibold text-[#686867]"
                              >
                                {messageGroupTime.time}
                              </time>
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col items-start gap-2">
                        <div
                          className={classNames(
                            "flex w-full flex-col",
                            singleMessage.author.node.databaseId ===
                              appContext.User?.databaseId
                              ? "mr-12 items-end self-end"
                              : "ml-12 items-start self-start",
                          )}
                        >
                          {process.env.NODE_ENV === "development" && (
                            <span className="text-center font-semibold text-[#032525]">
                              {" "}
                              ID - {singleMessage.databaseId}
                            </span>
                          )}
                          <div
                            className={classNames(
                              "html-formatted-content message-content",
                              "max-w-[70%] rounded-[1.25rem] px-5 py-2.5",
                              "font-normal text-[#032525]",
                              singleMessage.author.node.databaseId ===
                                appContext.User?.databaseId
                                ? "self-end bg-[#e5e3ff]"
                                : "bg-chw-cream-01",
                            )}
                          >
                            <ClientOnly fallback={<></>}>
                              {() =>
                                createEditors.find(
                                  (editor) =>
                                    editor.key ===
                                    singleMessage.databaseId.toString(),
                                )
                              }
                            </ClientOnly>
                          </div>
                          {/* {singleMessage.author.node.databaseId !==
                            appContext.User?.databaseId && (
                            <button
                              type="button"
                              className={
                                "font-semibold text-[#686867] hover:text-[#032525]"
                              }
                              // onClick={handleReactComment}
                            >
                              React
                            </button>
                          )} */}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

function scrollToCompose() {
  if (typeof window === "undefined") return;
  window.scrollTo(0, document.body.scrollHeight);
}

const initMessages = (
  messages: iWP_Messages_Pagination | iGenericError | undefined,
): iWP_Message[] => {
  if (!messages || "error" in messages) return [];
  return messages.nodes;
};

type iMessageGroup = {
  date: string;
  times: iMessageGroupTime[];
};

type iMessageGroupTime = {
  time: string;
  messages: iWP_Message[];
};

const sortMessageGroups = (messageGroups: iMessageGroup[]): iMessageGroup[] => {
  const _messageGroups = _.cloneDeep(messageGroups);
  _messageGroups.sort((a, b) => {
    const dateA = DateTime.fromISO(a.date).toMillis();
    const dateB = DateTime.fromISO(b.date).toMillis();
    return dateA - dateB;
  });

  _messageGroups.forEach((group) => {
    group.times.sort((a, b) => {
      const dateA = DateTime.fromFormat(a.time, "h:mm a").toMillis();
      const dateB = DateTime.fromFormat(b.time, "h:mm a").toMillis();
      return dateA - dateB;
    });

    group.times.forEach((timeGroup) => {
      timeGroup.messages = timeGroup.messages.sort((a, b) => {
        const dateA = DateTime.fromISO(a.date).toMillis();
        const dateB = DateTime.fromISO(b.date).toMillis();
        return dateA - dateB;
      });
    });
  });

  return _messageGroups;
};

const addMessageToTimeGroup = (
  message: iWP_Message,
  timeGroup: iMessageGroupTime,
): iMessageGroupTime | undefined => {
  /**
   * 1. check if the message was sent within the same timeframe
   * 2. if it was, add the message to the time group
   *    and sort the messages by date
   * 2a. if the message was not sent within the same timeframe,
   *    return undefined, so that the message can be added to a new time group
   */
  const MAX_TIME_DIFFERENCE = 1 * 60 * 1000; // 1 minute
  const clonedTimeGroup = _.cloneDeep(timeGroup);

  const messageTime = DateTime.fromISO(message.date).toMillis();

  let isWithinTimeFrame = false;
  timeGroup.messages.every((timeGroupMessage) => {
    const timeGroupMessageTime = DateTime.fromISO(
      timeGroupMessage.date,
    ).toMillis();
    const timeDifference = Math.abs(timeGroupMessageTime - messageTime);
    if (timeDifference <= MAX_TIME_DIFFERENCE) {
      isWithinTimeFrame = true;
      clonedTimeGroup.messages.push(message);
      return false;
    }
    return true;
  });

  if (!isWithinTimeFrame) return undefined;

  clonedTimeGroup.messages = clonedTimeGroup.messages.sort((a, b) => {
    const dateA = DateTime.fromISO(a.date).toMillis();
    const dateB = DateTime.fromISO(b.date).toMillis();
    return dateA - dateB;
  });

  return clonedTimeGroup;
};

const addMessageToGroup = (
  message: iWP_Message,
  group: iMessageGroup,
): iMessageGroup => {
  const clonedGroup = _.cloneDeep(group);
  const hasUniqueTimeFrame = clonedGroup.times.every((timeGroup, index) => {
    const newTimeGroup = addMessageToTimeGroup(message, timeGroup);
    if (newTimeGroup) {
      clonedGroup.times[index] = newTimeGroup;
      return false;
    }
    return true;
  });

  if (!hasUniqueTimeFrame) return clonedGroup;

  const newTimeGroup: iMessageGroupTime = {
    time: DateTime.fromISO(message.date).toLocaleString(DateTime.TIME_SIMPLE),
    messages: [message],
  };
  clonedGroup.times.push(newTimeGroup);

  return clonedGroup;
};

const organizeMessagesByDate = (_messages: iWP_Message[]): iMessageGroup[] => {
  const messageGroups: iMessageGroup[] = [];
  if (_messages.length === 0) return messageGroups;

  _messages.forEach((message) => {
    const messageDate = DateTime.fromISO(message.date).toISODate();
    const time = DateTime.fromISO(message.date).toLocaleString(
      DateTime.TIME_SIMPLE,
    );
    if (!messageDate) return;
    if (!time) return;

    const groupIndex = messageGroups.findIndex(
      (group) => group.date === messageDate,
    );

    if (groupIndex === -1) {
      messageGroups.push({
        date: messageDate,
        times: [
          {
            time: time,
            messages: [message],
          },
        ],
      });
    } else {
      messageGroups[groupIndex] = addMessageToGroup(
        message,
        messageGroups[groupIndex],
      );
    }
  });

  return sortMessageGroups(messageGroups);
};

const addMessageToGroups = (
  message: iWP_Message,
  groups: iMessageGroup[],
): iMessageGroup[] => {
  const clonedGroups = _.cloneDeep(groups);
  const messageDate = DateTime.fromISO(message.date).toISODate();
  const messageTime = DateTime.fromISO(message.date).toLocaleString(
    DateTime.TIME_SIMPLE,
  );
  if (!messageDate) return clonedGroups;
  if (!messageTime) return clonedGroups;

  const groupIndex = clonedGroups.findIndex(
    (group) => group.date === messageDate,
  );
  if (groupIndex === -1) {
    clonedGroups.push({
      date: messageDate,
      times: [
        {
          time: messageTime,
          messages: [message],
        },
      ],
    });
  } else {
    clonedGroups[groupIndex] = addMessageToGroup(
      message,
      clonedGroups[groupIndex],
    );
  }

  return sortMessageGroups(clonedGroups);
};

const findMessageInGroups = (
  messageId: number,
  groups: iMessageGroup[],
): iWP_Message | undefined => {
  let message: iWP_Message | undefined;
  groups.every((group) => {
    group.times.every((timeGroup) => {
      timeGroup.messages.every((m) => {
        if (m.databaseId === messageId) {
          message = m;
          return false;
        }
        return true;
      });
      if (message) return false;
      return true;
    });
    if (message) return false;
    return true;
  });

  return message;
};

const getDateTime = (date: string): string => {
  const dateObject = DateTime.fromISO(date);
  if (!dateObject.isValid) return "Invalid Date";

  if (isToday(dateObject)) return "Today";
  if (isYesterday(dateObject)) return "Yesterday";

  return dateObject.toLocaleString(DateTime.DATE_FULL);
};

const displayGroupTimeAuthor = (
  messages: iWP_Message[],
  index: number,
): boolean => {
  if (index === 0) return true;

  if (
    messages[index].author.node.databaseId !==
    messages[index - 1]?.author.node.databaseId
  )
    return true;
  return false;
};

function createRandomMessage(): iWP_Message {
  const date = DateTime.now();
  return {
    databaseId: parseInt(date.toFormat("HHmmss")),
    date: "2024-09-09T06:44:42",
    author: {
      node: {
        databaseId: 1,
        firstName: "Joel",
        lastName: "Admin",
        avatar: {
          url: "https://wp-chw-connector.ddev.site/wp-content/uploads/user/1/avatar.jpg?v=1720158031",
        },
      },
    },
    messageFields: {
      receiverId: 24,
      read: false,
      content:
        "JTdCJTIyYmxvY2tzJTIyJTNBJTVCJTdCJTIyaWQlMjIlM0ElMjJXRk5NNlh5eXVTJTIyJTJDJTIydHlwZSUyMiUzQSUyMmdpcGh5JTIyJTJDJTIyZGF0YSUyMiUzQSU3QiUyMmdpcGh5VXJsJTIyJTNBJTIyaHR0cHMlM0ElMkYlMkZtZWRpYTIuZ2lwaHkuY29tJTJGbWVkaWElMkZsMlFaWk1VbXZ0RllZQlVXWSUyRmdpcGh5LmdpZiUzRmNpZCUzRGU4NDUyZTY4dGg4czN4YXBkajhzY3cya3plb2kzN3NubzRsZXBhbG83bmp3emowOCUyNmVwJTNEdjFfZ2lmc190cmVuZGluZyUyNnJpZCUzRGdpcGh5LmdpZiUyNmN0JTNEZyUyMiU3RCU3RCU1RCU3RA==",
    },
  };
}
