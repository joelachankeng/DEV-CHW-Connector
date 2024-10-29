import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import axios from "axios";
import _, { set } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import ContextMenu from "~/components/ContextMenu";
import { ListBoxField } from "~/components/Forms/ListBoxField";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import ModalNotification from "~/components/Modals/ModalNotification";
import NotificationRow from "~/components/Notification/NotificationRow";
import Page from "~/components/Pages/Page";
import PublicHealthAlertsBanner from "~/components/PublicHealthAlertsBanner/PublicHealthAlertsBanner";
import { APP_CLASSNAMES, APP_ROUTES } from "~/constants";
import { PublicHealthAlert } from "~/controllers/publicHealthAlert.control";
import type { iGenericError, iGenericSuccess } from "~/models/appContext.model";
import type {
  iWP_Notification,
  iWP_Notification_Pagination,
} from "~/models/notifications.model";
import type { iWP_PublicHealthAlert } from "~/models/publicHealthAlert.model";
import { requireUserSession } from "~/servers/userSession.server";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import { usePagination } from "~/utilities/hooks/usePagination";
import { classNames } from "~/utilities/main";

const API_ROUTES = {
  GET_ALL: "/api/notification/getAll",
  GET_UNREAD: "/api/notification/getAllUnread",
};

const sortByOptions = ["All", "Unread"];
const sortByOptionsMap = sortByOptions.map((option) => ({
  label: _.startCase(option),
  value: option.toLowerCase(),
}));

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserSession(request);
  const alert = await PublicHealthAlert.API.getMostRecentAlert();
  if (alert instanceof Error) {
    return json({});
  }
  return json({
    alert: alert,
  });
};

export default function Notifications() {
  const { alert } = useLoaderData() as { alert: iWP_PublicHealthAlert };

  const paginationContainerRef = useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [sortBy, setSortBy] =
    useState<(typeof sortByOptions)[number]>("recent");
  const [notifications, setNotifications] = useState<iWP_Notification[]>([]);
  const [sortError, setSortError] = useState<iGenericError | undefined>(
    undefined,
  );
  const [sortHasChanged, setSortHasChanged] = useState(false);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const notificationsFetcherAction = (
    data: iWP_Notification_Pagination | iGenericError,
  ) => {
    if (!mounted) setMounted(true);
    if (sortHasChanged) setSortHasChanged(false);
    if ("error" in data) {
      setSortError(data);
      return;
    }
    const pageInfo = {
      hasNextPage: data.total > data.notifications.length,
      hasPreviousPage: false,
      startCursor: "",
      endCursor: (data.offset + data.limit).toString(),
      total: data.total,
    };

    if (pagination.isLoading) {
      const newNotifications = [...notifications, ...data.notifications];
      pageInfo.hasNextPage = data.total > newNotifications.length;
      setPagination({
        isLoading: false,
        pageInfo: pageInfo,
      });
      setNotifications(newNotifications);
    } else {
      setPagination({
        isLoading: false,
        pageInfo: pageInfo,
      });
      setNotifications(data.notifications);
    }
  };
  const {
    state: notificationAllFetchState,
    submit: notificationAllFetchSubmit,
  } = useAutoFetcher<iWP_Notification_Pagination | iGenericError>(
    API_ROUTES.GET_ALL,
    notificationsFetcherAction,
  );

  const {
    state: notificationUnreadFetchState,
    submit: notificationUnreadFetchSubmit,
  } = useAutoFetcher<iWP_Notification_Pagination | iGenericError>(
    API_ROUTES.GET_UNREAD,
    notificationsFetcherAction,
  );

  const handleOnChangeSortBy = (value: string) => {
    if (value === sortBy) return;
    const sortValue = value as (typeof sortByOptions)[number];

    if (sortValue === "unread") {
      notificationUnreadFetchSubmit({}, "POST");
    } else {
      notificationAllFetchSubmit({}, "POST");
    }

    setSortError(undefined);
    setSortBy(sortValue);
    setSortHasChanged(true);
  };

  useEffect(() => {
    if (mounted) return;
    notificationAllFetchSubmit({}, "POST");
    setMounted(true);
  }, [mounted, notificationAllFetchState, notificationAllFetchSubmit]);

  const { pagination, setPagination, LoadMoreButton } = usePagination(
    paginationContainerRef,
    () => {
      if (
        notificationAllFetchState !== "idle" ||
        notificationUnreadFetchState !== "idle" ||
        !pagination.pageInfo
      ) {
        return;
      }

      const offset = pagination.pageInfo.endCursor;
      if (sortBy === "unread") {
        notificationUnreadFetchSubmit({ offset }, "POST");
      } else {
        notificationAllFetchSubmit({ offset }, "POST");
      }
    },
  );

  const handleMarkAllAsRead = useCallback(async (): Promise<
    iGenericError | iGenericSuccess
  > => {
    if (isMarkingAllAsRead) return { error: "Already marking all as read" };
    setIsMarkingAllAsRead(true);

    return axios
      .post("/api/notification/markAllAsRead")
      .then((res) => {
        const result = res.data as ReturnType<typeof handleMarkAllAsRead>;
        if ("success" in result) {
          if (sortBy === "unread") {
            setNotifications((prevNotifications) =>
              prevNotifications.filter((notification) => notification.is_read),
            );
          } else {
            setNotifications((prevNotifications) =>
              prevNotifications.map((notification) => ({
                ...notification,
                is_read: true,
              })),
            );
          }
        } else {
          console.error(result);
        }
        return result;
      })
      .catch((err) => {
        return { error: err.message };
      })
      .finally(() => {
        setIsMarkingAllAsRead(false);
      });
  }, [isMarkingAllAsRead, sortBy]);

  const handleDeleteAll = useCallback(async (): Promise<
    iGenericError | iGenericSuccess
  > => {
    if (isMarkingAllAsRead) return { error: "Already deleting all" };
    setIsDeletingAll(true);

    return axios
      .post("/api/notification/deleteAll")
      .then((res) => {
        const result = res.data as ReturnType<typeof handleDeleteAll>;
        if ("success" in result) {
          setNotifications([]);
        } else {
          console.error(result);
        }
        return result;
      })
      .catch((err) => {
        return { error: err.message };
      })
      .finally(() => {
        setIsDeletingAll(false);
      });
  }, [isMarkingAllAsRead]);

  return (
    <>
      <ModalNotification
        show={deleteModal}
        title="Delete All Notifications"
        content="Are you sure you want to delete all notifications?"
        onConfirm={() => {
          handleDeleteAll().catch(console.error);
          setDeleteModal(false);
        }}
        onClose={() => setDeleteModal(false)}
      />
      <Page>
        <div className={APP_CLASSNAMES.CONTAINER_FULLWIDTH}>
          <div
            ref={paginationContainerRef}
            className={APP_CLASSNAMES.CONTAINER}
          >
            {alert && <PublicHealthAlertsBanner alert={alert} />}

            <div
              className={classNames(
                "flex items-center justify-between gap-2.5 border-b border-solid border-b-[#C1BAB4] pb-1 text-base font-semibold text-[#686867]",
                "max-xxs:flex max-xxs:flex-col max-xxs:items-start",
              )}
            >
              <div className="flex items-center gap-7 max-md:gap-2">
                <h1 className="text-[28px] font-bold leading-8 text-[#032525] max-md:text-lg">
                  Notifications
                </h1>
                <ContextMenu
                  button={
                    <span className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#686867] transition duration-300 ease-in-out group-hover:bg-[#625DA6] group-hover:text-white">
                      <EllipsisHorizontalIcon className="h-4 w-4" />
                    </span>
                  }
                  items={[
                    [
                      {
                        element: (
                          <button
                            onClick={() => {
                              handleMarkAllAsRead().catch(console.error);
                            }}
                            disabled={isMarkingAllAsRead}
                            className={classNames(
                              "group flex w-full items-center gap-2 rounded-md px-4 py-2 font-semibold transition duration-300 ease-in-out",
                              "text-[#686867] hover:bg-chw-light-purple hover:text-white",
                              "whitespace-nowrap",
                            )}
                          >
                            <span>Mark All as Read</span>
                            <LoadingSpinner
                              sizeClassName="h-5 w-5"
                              className={classNames(
                                "ml-2",
                                isMarkingAllAsRead ? "block" : "hidden",
                              )}
                            />
                          </button>
                        ),
                      },
                      {
                        element: "Settings",
                        link: `${APP_ROUTES.SETTINGS}/notifications`,
                      },
                    ],
                    ...(notifications.length > 0
                      ? [
                          [
                            {
                              element: (
                                <button
                                  onClick={() => setDeleteModal(true)}
                                  disabled={isDeletingAll}
                                  className={classNames(
                                    "group flex w-full items-center gap-2 rounded-md px-4 py-2 font-semibold transition duration-300 ease-in-out",
                                    "text-[#686867] hover:bg-red-700 hover:text-white",
                                    "whitespace-nowrap",
                                  )}
                                >
                                  <span>Delete All</span>
                                  <LoadingSpinner
                                    sizeClassName="h-5 w-5"
                                    className={classNames(
                                      "ml-2",
                                      isDeletingAll ? "block" : "hidden",
                                    )}
                                  />
                                </button>
                              ),
                            },
                          ],
                        ]
                      : []),
                  ]}
                />
              </div>
              <div className="flex items-center gap-[.9375rem]">
                <ListBoxField
                  classes={{
                    parent: {
                      className: "flex items-center gap-[.9375rem]",
                      override: true,
                    },
                    label: {
                      className: "",
                      override: true,
                    },
                    select: {
                      className: "text-[#032525] font-semibold",
                    },
                  }}
                  label="Sort By:"
                  name="notifications-sort-by"
                  defaultValue={sortBy}
                  options={sortByOptionsMap}
                  onChange={(value) => handleOnChangeSortBy(value)}
                  position="right"
                />
              </div>
            </div>

            {mounted === false || sortHasChanged ? (
              <div className="mx-auto my-8 cursor-progress">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                {sortError ? (
                  <div className="text-basetext-[#032525] flex flex-col gap-2 text-center">
                    <p className="font-semibold ">
                      An error occurred while retrieving your notifications.
                      Please try again.
                    </p>
                    <p>{sortError.error}</p>
                    {sortError.error_description && (
                      <p>{sortError.error_description}</p>
                    )}
                  </div>
                ) : (
                  <>
                    {notifications.length === 0 ? (
                      <div className="text-center text-base text-[#032525]">
                        No notifications available.
                      </div>
                    ) : (
                      <>
                        <div
                          className={classNames(
                            "relative flex flex-col rounded-[.625rem] border border-solid border-[#E8E0D6] bg-white ",
                            "max-md:border-none max-md:px-0",
                          )}
                        >
                          {notifications.map((notification) => (
                            <NotificationRow
                              key={notification.id}
                              notification={notification}
                              className="group relative px-5 py-7 hover:bg-chw-yellow-100 max-xs:px-0 max-xs:py-3"
                            />
                          ))}
                        </div>

                        <div className="mx-auto my-8 flex flex-col items-center justify-center">
                          {notificationAllFetchState !== "idle" ||
                          notificationUnreadFetchState !== "idle" ? (
                            <LoadingSpinner className="cursor-progress" />
                          ) : (
                            <>
                              {pagination.pageInfo &&
                                (pagination.pageInfo.hasNextPage ? (
                                  <LoadMoreButton />
                                ) : (
                                  <p className="text-center">
                                    You reached the end of all notifications.
                                  </p>
                                ))}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </Page>
    </>
  );
}
