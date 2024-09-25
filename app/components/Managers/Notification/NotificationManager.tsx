import { Transition } from "@headlessui/react";
import { Fragment, useContext, useEffect, useState } from "react";
import { AppContext } from "~/contexts/appContext";
import type {
  iNotificationItem_General,
  iNotificationItem_UserInteraction,
} from "./NotificationItem";
import NotificationItem from "./NotificationItem";
import _ from "lodash";
import { DateTime } from "luxon";

const DEFAULT_TIMEOUT = 15;

export type iNotification =
  | iNotificationItem_General
  | iNotificationItem_UserInteraction;

export default function NotificationManager() {
  const { appContext, setAppContext } = useContext(AppContext);
  const { NotificationManager } = appContext;

  const [isMounted, setIsMounted] = useState(false);
  const [notifications, setNotifications] =
    useState<iNotification[]>(NotificationManager);
  const [previousNotifications, setPreviousNotifications] = useState<
    iNotification[]
  >([]);

  useEffect(() => {
    setNotifications(initializedNotifications());
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    setPreviousNotifications(notifications);
    sessionStorage.setItem("notifications", JSON.stringify(notifications));

    if (_.isEqual(NotificationManager, notifications)) return;
    setAppContext({
      ...appContext,
      NotificationManager: notifications,
    });
  }, [notifications]);

  useEffect(() => {
    if (!isMounted) return;
    if (_.isEqual(NotificationManager, notifications)) return;
    setNotifications(initializedNotifications());
  }, [appContext.NotificationManager]);

  const calcTimeout = (index: number): number | boolean => {
    if (notifications.length === 1) return DEFAULT_TIMEOUT;
    if (index === 0) return DEFAULT_TIMEOUT;
    return false;
  };

  const calcPlaySound = (notification: iNotification): boolean => {
    if (previousNotifications.includes(notification)) return false;
    return true;
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

  function initializedNotifications(): iNotification[] {
    const allNotifications: iNotification[] = [];

    const sessionNotifications = sessionStorage.getItem("notifications");
    if (sessionNotifications) {
      const parsedNotifications = JSON.parse(sessionNotifications);
      allNotifications.push(...parsedNotifications);
    }

    if (NotificationManager) {
      allNotifications.push(...NotificationManager);
    }

    return sortNotificationsByTime(allNotifications);
  }

  if (!appContext.User) return null;

  return (
    <>
      {/* <button
        className="absolute bottom-0 left-0 z-30 text-white bg-chw-dark-purple p-2 font-semibold"
        onClick={() => {
          setNotifications((prev) => [
            ...prev,
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
          ]);
        }}
      >
        Footer
      </button> */}
      <div className="fixed right-5 top-28 z-20 flex max-w-3xl flex-col items-end gap-4">
        {notifications.map((notification, index) => (
          <NotificationItem
            key={notification.time + index + Date.now()}
            data={notification}
            timeOut={calcTimeout(index)}
            playSound={calcPlaySound(notification)}
            onDelete={() => {
              const newNotifications = _.cloneDeep(notifications);
              newNotifications.splice(index, 1);
              setNotifications(newNotifications);
              setPreviousNotifications(newNotifications);
            }}
            onClickDelete={() => {
              const newNotifications = _.cloneDeep(notifications);
              newNotifications.splice(index, 1);
              setNotifications(newNotifications);
              setPreviousNotifications(newNotifications);
            }}
          />
        ))}
      </div>
    </>
  );
}
