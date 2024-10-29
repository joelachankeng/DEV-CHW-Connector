import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import { classNames } from "~/utilities/main";
import ContextMenu from "../ContextMenu";
import Avatar from "../User/Avatar";
import type { iWP_Notification } from "~/models/notifications.model";
import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import type { iGenericError, iGenericSuccess } from "~/models/appContext.model";
import { useNavigate } from "@remix-run/react";

export default function NotificationRow({
  className,
  notification,
}: {
  className?: string;
  notification: iWP_Notification;
}) {
  const navigate = useNavigate();
  const [isRead, setIsRead] = useState(notification.is_read);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsRead(notification.is_read);
  }, [notification.is_read]);

  const handleMarkAsRead = useCallback(
    async (id: number): Promise<iGenericError | iGenericSuccess> => {
      if (notification.is_read) return { error: "Notification already read" };
      setIsLoading(true);
      const formData = new FormData();
      formData.append("id", id.toString());
      return axios
        .post("/api/notification/markAsRead", formData)
        .then((res) => {
          const result = res.data as ReturnType<typeof handleMarkAsRead>;
          if ("success" in result) {
            setIsRead(true);
          } else {
            console.error(result);
          }
          return result;
        })
        .catch((err) => {
          return { error: err.message };
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [notification.is_read],
  );

  const handleDelete = useCallback(
    async (id: number): Promise<iGenericError | iGenericSuccess> => {
      if (isLoading) return { error: "Loading" };
      setIsLoading(true);
      const formData = new FormData();
      formData.append("id", id.toString());
      return axios
        .post("/api/notification/delete", formData)
        .then((res) => {
          const result = res.data as ReturnType<typeof handleDelete>;
          if ("success" in result) {
            setIsDeleted(true);
          } else {
            console.error(result);
          }
          return result;
        })
        .catch((err) => {
          return { error: err.message };
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [],
  );

  const handleClick = useCallback(() => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id).catch((err) => {
        console.error(err);
      });
      navigate(notification.url);
    }
  }, [
    handleMarkAsRead,
    navigate,
    notification.id,
    notification.is_read,
    notification.url,
  ]);

  const getRelativeDate = (): string => {
    const date = DateTime.fromFormat(notification.date, "yyyy-MM-dd HH:mm:ss");
    if (!date.isValid) {
      return "";
    }
    return date.toRelative();
  };

  const ContextMenuCallback = useCallback(
    () => (
      <ContextMenu
        button={
          <span className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#686867] transition duration-300 ease-in-out group-hover:bg-[#625DA6] group-hover:text-white">
            <EllipsisHorizontalIcon className="h-4 w-4" />
          </span>
        }
        items={[
          [
            ...(isRead
              ? []
              : [
                  {
                    element: (
                      <button
                        onClick={() => {
                          handleMarkAsRead(notification.id).catch((err) => {
                            console.error(err);
                          });
                        }}
                        className={classNames(
                          "group flex w-full items-center gap-2 rounded-md px-4 py-2 font-semibold transition duration-300 ease-in-out",
                          "text-[#686867] hover:bg-chw-light-purple hover:text-white",
                          "whitespace-nowrap",
                        )}
                      >
                        Mark as Read
                      </button>
                    ),
                  },
                ]),
            {
              element: (
                <button
                  onClick={() => {
                    handleDelete(notification.id).catch((err) => {
                      console.error(err);
                    });
                  }}
                  className={classNames(
                    "group flex w-full items-center gap-2 rounded-md px-4 py-2 font-semibold transition duration-300 ease-in-out",
                    "text-[#686867] hover:bg-chw-light-purple hover:text-white",
                    "whitespace-nowrap",
                  )}
                >
                  Delete
                </button>
              ),
            },
          ],
        ]}
      />
    ),
    [handleDelete, handleMarkAsRead, isRead, notification.id],
  );

  if (isDeleted) return null;

  return (
    <div
      id={`notification-${notification.id}`}
      className={classNames(isLoading ? "animate-pulse" : "", className ?? "")}
    >
      <button
        onClick={handleClick}
        className="absolute left-0 top-0 z-0 h-full w-full border-none bg-transparent text-left"
      >
        <span className="sr-only">Link to Notification</span>
      </button>
      <div className="flex items-start">
        <div className={classNames("flex items-start")}>
          <div className="mr-5 flex items-center self-center max-md:mr-2 max-xxs:hidden">
            {isRead == false && <UnReadIcon />}
          </div>
          <div
            className={classNames(
              "mr-3 h-[4.5rem] w-[4.5rem] min-w-[4.5rem]",
              "max-xs:h-12 max-xs:w-12 max-xs:min-w-[3rem]",
            )}
          >
            <a className="relative z-10" href={notification.user_url}>
              <Avatar src={notification.avatar} alt={notification.full_name} />
              <div className="absolute bottom-0 hidden max-xxs:block">
                {isRead == false && <UnReadIcon />}
              </div>
            </a>
          </div>
        </div>
        <div className="mr-4 flex-1 max-md:overflow-hidden">
          <div className="flex justify-between">
            <h2 className="relative z-10 text-lg font-semibold text-[#032525] transition duration-300 ease-in-out hover:text-chw-light-purple max-md:text-base max-md:leading-normal">
              <button
                onClick={handleClick}
                className="border-none bg-transparent text-left"
              >
                {notification.full_name}
              </button>
            </h2>
            <div className="hidden max-xxs:block">
              <ContextMenuCallback />
            </div>
          </div>
          <div className="">
            <p className="hidden text-sm font-semibold text-[#686867] max-xxs:block">
              {getRelativeDate()}
            </p>
            <p className="line-clamp-3 text-sm text-[#686867]">
              {notification.excerpt}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 max-xxs:hidden">
          <p className="text-sm font-semibold text-[#686867]">
            {getRelativeDate()}
          </p>
          <ContextMenuCallback />
        </div>
      </div>
    </div>
  );
}

function UnReadIcon() {
  return (
    <span className="block h-2 w-2 rounded-full bg-chw-yellow group-hover:bg-chw-light-purple"></span>
  );
}
