import { useCallback, useContext, useEffect, useRef } from "react";
import { AppContext } from "~/contexts/appContext";
import type { iGenericError } from "~/models/appContext.model";
import type { iNotificationItem_UserInteraction } from "./Notification/NotificationItem";
import type { iWP_Message } from "~/models/message.model";
import { APP_ROUTES } from "~/constants";
import axios from "axios";
import { getParagraphTextFromEditorData } from "~/utilities/main";
import { excerpts } from "~/utilities/excerpts";

export default function MessagesManager() {
  const { User, MessagesManager, NotificationManager } = useContext(AppContext);
  const isFetching = useRef(false);

  const fetchAllUnreadMessages = useCallback(async (): Promise<
    iWP_Message[] | iGenericError
  > => {
    const formData = new FormData();
    return axios
      .post("/api/user/getAllUnreadMessages", formData)
      .then((res) => {
        return res.data as ReturnType<typeof fetchAllUnreadMessages>;
      })
      .catch((err) => {
        return { error: err.message };
      });
  }, []);

  const updateContext = useCallback(
    (data: iWP_Message[] | iGenericError) => {
      if (!Array.isArray(data)) return;

      const unreadIds = MessagesManager.unreadIds;
      const newNotificationsMessages: iNotificationItem_UserInteraction[] = [];
      const newIds: number[] = [];

      if (data.length === 0) {
        if (unreadIds.length === 0) return;
        MessagesManager.setUnreadIds([]);
        return;
      }

      data.forEach((m) => {
        if (unreadIds.includes(m.databaseId)) return;

        newIds.push(m.databaseId);
        newNotificationsMessages.push({
          type: "message",
          avatarURL: m.author.node.avatar.url,
          userURL: `${APP_ROUTES.PROFILE}/${m.author.node.databaseId}`,
          name: `${m.author.node.firstName} ${m.author.node.lastName}`,
          actionType: "message",
          contentURL: `${APP_ROUTES.MESSAGES}/${m.author.node.databaseId}`,
          time: m.date,
          message: excerpts(
            getParagraphTextFromEditorData(m.messageFields.content),
          ),
        });
      });

      if (newIds.length === 0) {
        if (data.length !== unreadIds.length) {
          // this updates the count on the header as the user is reading the unread messages
          MessagesManager.setUnreadIds(data.map((m) => m.databaseId));
        }

        return;
      }

      MessagesManager.setUnreadIds(data.map((m) => m.databaseId));
      if (!User.user) return console.error("User is not logged in");
      if (
        User.user.userFields.notificationSettings.Messaging["Direct Messages"]
          .siteNotifications === true
      ) {
        if (
          window.location.pathname.startsWith(APP_ROUTES.MESSAGES) === false
        ) {
          if (newNotificationsMessages.length > 0) {
            newNotificationsMessages.forEach((n) => {
              NotificationManager.addNotification(n);
            });
          }
        }
      }
    },
    [MessagesManager, NotificationManager, User.user],
  );

  useEffect(() => {
    const interval = setInterval(function () {
      if (!User.user) return;
      if (isFetching.current) return;

      isFetching.current = true;
      fetchAllUnreadMessages()
        .then(updateContext)
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          isFetching.current = false;
        });
    }, 1000);
    return () => clearInterval(interval);
  }, [User.user, fetchAllUnreadMessages, updateContext]);

  return (
    <>
      {/* <button
        className="bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
        onClick={fetchAllUnreadMessages}
      >
        Send Notification
      </button> */}
    </>
  );
}
