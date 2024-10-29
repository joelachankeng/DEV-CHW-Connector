import { useCallback, useContext, useEffect, useRef } from "react";
import { AppContext } from "~/contexts/appContext";
import type { iGenericError } from "~/models/appContext.model";
import axios from "axios";
import type { iWP_Notification_Pagination } from "~/models/notifications.model";
import type { iNotificationItem_UserInteraction } from "./NotificationItem";

export default function NotificationUnreadManager() {
  const { User, NotificationManager } = useContext(AppContext);
  const isFetching = useRef(false);

  const fetchAllUnreadMessages = useCallback(async (): Promise<
    iWP_Notification_Pagination | iGenericError
  > => {
    const formData = new FormData();
    formData.append("limit", "100");
    return axios
      .post("/api/notification/getAllUnread", formData)
      .then((res) => {
        return res.data as ReturnType<typeof fetchAllUnreadMessages>;
      })
      .catch((err) => {
        return { error: err.message };
      });
  }, []);

  const updateContext = useCallback(
    (data: iWP_Notification_Pagination | iGenericError) => {
      if (data instanceof Error) return;
      if (!("notifications" in data)) return;
      if (!Array.isArray(data.notifications)) return;

      const notifications = data.notifications;

      const unreadIds = NotificationManager.unreadIds;
      const newNotificationsMessages: iNotificationItem_UserInteraction[] = [];
      const newIds: number[] = [];

      if (notifications.length === 0) {
        if (unreadIds.length === 0) return;
        NotificationManager.setUnreadIds([]);
        return;
      }

      notifications.forEach((n) => {
        if (unreadIds.includes(n.id)) return;
        newIds.push(n.id);

        if (!User.user) return console.error("User is not logged in");
        let itemType = n.type as iNotificationItem_UserInteraction["type"];
        switch (n.type) {
          case "post":
            if (n.group_type === "COMMUNITY") {
              const notificationSetting =
                User.user.userFields.notificationSettings["Community Groups"][
                  "New Posts"
                ];
              if (notificationSetting.siteNotifications === false) {
                return console.log(
                  "User has disabled Community Groups New Posts",
                  notificationSetting,
                );
              }
            }
            if (n.group_type === "NETWORK") {
              const notificationSetting =
                User.user.userFields.notificationSettings["CHW Network Groups"][
                  "New Posts"
                ];
              if (notificationSetting.siteNotifications === false) {
                return console.log(
                  "User has disabled CHW Network New Posts",
                  notificationSetting,
                );
              }
            }
            break;
          case "message":
            // don't show message notifications, the MessagesManager component will handle this
            break;
          case "reaction":
            itemType = "post";
            if (n.group_type === "COMMUNITY") {
              const notificationSetting =
                User.user.userFields.notificationSettings["Community Groups"]
                  .Reactions;

              if (notificationSetting.siteNotifications === false) {
                return console.log(
                  "User has disabled Community Groups Reactions",
                  notificationSetting,
                );
              }
            }
            if (n.group_type === "NETWORK") {
              const notificationSetting =
                User.user.userFields.notificationSettings["CHW Network Groups"]
                  .Reactions;

              if (notificationSetting.siteNotifications === false) {
                return console.log(
                  "User has disabled CHW Network Reactions",
                  notificationSetting,
                );
              }
            }
            break;
          default:
            break;
        }
        newNotificationsMessages.push({
          type: itemType,
          avatarURL: n.avatar,
          userURL: n.user_url,
          name: n.full_name,
          actionType: "message",
          contentURL: n.url,
          time: n.date,
          message: n.excerpt,
        });
      });

      if (newIds.length === 0) {
        if (notifications.length !== unreadIds.length) {
          // this updates the count on the header as the user is reading the unread messages
          NotificationManager.setUnreadIds(notifications.map((m) => m.id));
        }

        return;
      }

      NotificationManager.setUnreadIds(notifications.map((m) => m.id));
      if (newNotificationsMessages.length > 0) {
        newNotificationsMessages.forEach((n) => {
          NotificationManager.addNotification(n);
        });
      }
    },
    [NotificationManager, User.user],
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
