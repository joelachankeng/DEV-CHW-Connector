import {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppContext } from "~/contexts/appContext";
import type {
  iNotificationItem_General,
  iNotificationItem_UserInteraction,
} from "./NotificationItem";
import NotificationItem from "./NotificationItem";
import _ from "lodash";
import { DateTime } from "luxon";

const DEFAULT_TIMEOUT = 10;

export type iNotification =
  | iNotificationItem_General
  | iNotificationItem_UserInteraction;

export default function NotificationManager() {
  const { User, NotificationManager } = useContext(AppContext);
  const { notificationManager: notifications } = NotificationManager;

  const previousNotifications = useRef<iNotification[]>(notifications);

  const calcTimeout = (index: number): number | boolean => {
    if (notifications.length === 1) return DEFAULT_TIMEOUT;
    if (index === 0) return DEFAULT_TIMEOUT;
    return false;
  };

  useEffect(() => {
    previousNotifications.current = notifications;
  }, [notifications]);

  const calcPlaySound = (notification: iNotification): boolean => {
    const isOld = previousNotifications.current.find((pn) =>
      _.isEqual(pn, notification),
    );
    return !isOld;
  };

  const sortNotificationsByTime = (
    notifications: iNotification[],
  ): iNotification[] => {
    return notifications.sort((a, b) => {
      return (
        DateTime.fromISO(a.time).toMillis() -
        DateTime.fromISO(b.time).toMillis()
      );
    });
  };

  if (!User.user) return null;

  return (
    <>
      {/* <button
        className="absolute bottom-0 left-0 z-30 bg-chw-dark-purple p-2 font-semibold text-white"
        onClick={() => {
          NotificationManager.addNotification(
            // {
            //   type: "error",
            //   message: "This is a general notification",
            //   time: "2024-05-31T00:10:00.160Z",
            // },
            {
              type: "message",
              avatarURL:
                "http://localhost/wp-chw-connector/wp-content/uploads/2024/05/16391545485537.jpg",
              name: "John Doe" + DateTime.now().second.toString(),
              actionType: "message", //| "react" | "message";
              contentURL: "aaa",
              time: "2024-05-31T00:10:00.160Z",
              message: `// add line clampLorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris at felis eu nibh tempor venenatis vitae id dolor.
              Sed eget aliquam sem. Vivamus tempor justo at turpis imperdiet, in pulvinar nisi pellentesque. Fusce pretium metus eu dolor bibendum posuere. Nulla a orci cursus, posuere dui a, venenatis velit. Vivamus ornare erat libero, vel ultrices ante aliquet sed. Nullam eu consequat lorem.`,
              userURL: "aaa",
            },
          );
        }}
      >
        Footer
      </button> */}
      <div className="fixed right-5 top-28 z-20 flex max-w-lg flex-col items-end gap-4">
        {sortNotificationsByTime(notifications).map((notification, index) => (
          <NotificationItem
            key={notification.time + index + Date.now()}
            data={notification}
            timeOut={calcTimeout(index)}
            playSound={calcPlaySound(notification)}
            onDelete={() => {
              NotificationManager.removeNotification(index);
            }}
            onClickDelete={() => {
              NotificationManager.removeNotification(index);
            }}
          />
        ))}
      </div>
    </>
  );
}
