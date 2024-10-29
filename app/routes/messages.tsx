import { json, type LoaderFunction } from "@remix-run/node";
import Page from "~/components/Pages/Page";
import LeftSideBar from "app/components/SideBars/LeftSideBar";
import {
  getJWTUserDataFromSession,
  requireUserSession,
} from "~/servers/userSession.server";
import { APP_CLASSNAMES, APP_ROUTES } from "~/constants";
import SVGComposeMessage from "~/assets/SVGs/SVGComposeMessage";
import { Tooltip } from "react-tooltip";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import Avatar from "~/components/User/Avatar";
import { classNames, URLsMatches } from "~/utilities/main";
import { NotificationCount } from "~/components/Header/Header";
import { useMediaSize } from "~/utilities/hooks/useMediaSize";
import MobileLeftSideBar from "~/components/SideBars/MobileLeftSideBar";
import SVGFeed from "~/assets/SVGs/SVGFeed";
import { MessagesFeed } from "./messages/index";
import { User } from "~/controllers/user.control";
import type { iWP_Conversations } from "~/models/message.model";
import type { iGenericError } from "~/models/appContext.model";
import axios from "axios";
import { AppContext } from "~/contexts/appContext";

const layoutMenu = [
  {
    title: "Messages Feed",
    link: APP_ROUTES.MESSAGES.concat("?view=feed"),
    icon: <SVGFeed />,
    view: "FEED",
  },
  {
    title: "Compose Message",
    link: APP_ROUTES.MESSAGES.concat("?view=compose"),
    icon: <SVGComposeMessage />,
    view: "COMPOSE",
  },
];

type iMessagesContext = {
  currentView: "FEED" | "COMPOSE";
  conversations?: iWP_Conversations[];
};

export type iMessagesContextState = {
  layoutContext: iMessagesContext;
  setLayoutContext: React.Dispatch<React.SetStateAction<iMessagesContext>>;
};

type iLoaderData = {
  conversations: iWP_Conversations[];
};

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserSession(request);
  const data: iLoaderData = {
    conversations: [],
  };
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) return json(data);

  const conversations = await User.API.getMessageConversations(JWTUser.user.ID);
  if (conversations instanceof Error || !conversations) return json(data);

  data.conversations = conversations;
  return json(data);
};

export default function Messages() {
  const { conversations } = useLoaderData<iLoaderData>();
  const { User } = useContext(AppContext);

  const location = useLocation();
  const mediaQuery = useMediaSize();

  const [layoutContext, setLayoutContext] = useState<iMessagesContext>({
    currentView: setCurrentView(location),
    conversations,
  });

  const isFetching = useRef(false);

  const fetchAllUnreadMessages = useCallback(async (): Promise<
    iWP_Conversations[] | iGenericError
  > => {
    const formData = new FormData();
    return axios
      .post("/api/user/getMessageConversations", formData)
      .then((res) => {
        return res.data as ReturnType<typeof fetchAllUnreadMessages>;
      })
      .catch((err) => {
        return { error: err.message };
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(function () {
      if (!User.user) return;
      if (isFetching.current) return;

      isFetching.current = true;
      fetchAllUnreadMessages()
        .then((data) => {
          if ("error" in data) return console.error(data.error);
          setLayoutContext((prev) => ({
            ...prev,
            conversations: data,
          }));
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          isFetching.current = false;
        });
    }, 1000);
    return () => clearInterval(interval);
  }, [User.user, fetchAllUnreadMessages]);

  useEffect(() => {
    setLayoutContext((prev) => ({
      ...prev,
      currentView: setCurrentView(location),
    }));
  }, [location]);

  return (
    <>
      <Page>
        {mediaQuery && mediaQuery.width >= 992 ? (
          <LeftSideBar
            name={"Messages Sidebar"}
            borderBottom={false}
            title={
              <div className="flex w-full items-center justify-between gap-2">
                <h1 className="text-[28px] font-bold">Messages</h1>
                <Tooltip id={`tooltip-message-compose`} />
                {layoutContext.currentView !== "COMPOSE" && (
                  <Link
                    data-tooltip-id={`tooltip-message-compose`}
                    data-tooltip-content={`New Message`}
                    data-tooltip-place="top"
                    className="h-8 w-8 text-[#686867] transition duration-300 ease-in-out hover:text-chw-light-purple"
                    to={APP_ROUTES.MESSAGES}
                  >
                    <SVGComposeMessage />
                  </Link>
                )}
              </div>
            }
            search={{
              placeholder: "Search Messages",
              onChange: () => {
                //
              },
            }}
          >
            {({ sidebarOpen, toolTipId }) => (
              <div className="mt-3">
                {sidebarOpen ? (
                  <>
                    <MessagesFeed
                      conversations={layoutContext.conversations || []}
                    />
                  </>
                ) : (
                  <div
                    className={classNames(
                      "mt-5 flex flex-col gap-5",
                      sidebarOpen ? "items-start" : "items-center",
                    )}
                  >
                    {layoutContext.currentView !== "COMPOSE" && (
                      <Link
                        to={APP_ROUTES.MESSAGES}
                        className={classNames(
                          URLsMatches(location.pathname, APP_ROUTES.MESSAGES)
                            ? "text-chw-light-purple"
                            : "text-[#686867] ",
                          "flex items-center gap-3 text-base font-semibold hover:text-chw-light-purple",
                        )}
                        data-tooltip-id={toolTipId}
                        data-tooltip-content="New Message"
                        data-tooltip-place="right"
                      >
                        <span className="h-8 w-8">
                          <SVGComposeMessage />
                        </span>
                      </Link>
                    )}
                    <div className="">
                      {layoutContext.conversations?.map((item, index) => (
                        <Link
                          key={index}
                          to={APP_ROUTES.MESSAGES.concat(
                            `/${item.user.databaseId}`,
                          )}
                          className={classNames(
                            "relative flex py-3",
                            URLsMatches(
                              location.pathname,
                              `${APP_ROUTES.MESSAGES}/${item.user.databaseId}`,
                            )
                              ? "after:bg-chw-light-purple"
                              : "",
                            "after:absolute after:-left-5 after:top-0 after:z-[-1] after:h-full after:w-[calc(100%_+_50px)] after:bg-transparent after:content-['']",
                            "after:transition-all after:duration-300 after:ease-in-out",
                            "hover:after:bg-chw-yellow-100",
                          )}
                          data-tooltip-id={toolTipId}
                          data-tooltip-content="Message Username"
                          data-tooltip-place="right"
                        >
                          <div className="h-12 w-12">
                            <Avatar
                              src={item.user.avatar.url}
                              alt={`${item.user.firstName} ${item.user.lastName}`}
                            />
                          </div>
                          <NotificationCount
                            className="!bottom-2 !right-0"
                            count={item.unreadCount}
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </LeftSideBar>
        ) : (
          <MobileLeftSideBar title={"Messages"} summary={""}>
            <div className="flex items-center justify-between gap-2.5">
              {layoutMenu.map((menu, index) => (
                <Link
                  key={index}
                  to={menu.link}
                  className={classNames(
                    layoutContext.currentView === menu.view
                      ? "text-chw-light-purple"
                      : "text-[#686867] ",
                    "flex items-center gap-2.5 text-base font-semibold hover:text-chw-light-purple",
                    "max-xs:flex-col max-xs:gap-1",
                  )}
                >
                  <span className="h-8 w-8">{menu.icon}</span>
                  <span
                    className={classNames(
                      layoutContext.currentView === menu.view
                        ? "text-[#032525]"
                        : "text-[#686867] ",
                      "hover:text-chw-light-purple",
                      "max-xs:text-xs",
                    )}
                  >
                    {menu.title}
                  </span>
                </Link>
              ))}
            </div>
          </MobileLeftSideBar>
        )}
        <div className={APP_CLASSNAMES.CONTAINER_FULLWIDTH}>
          <div className={APP_CLASSNAMES.CONTAINER}>
            <Outlet
              context={{
                layoutContext,
                setLayoutContext,
              }}
            />
          </div>
        </div>
      </Page>
    </>
  );
}

function setCurrentView(
  location: ReturnType<typeof useLocation>,
): iMessagesContext["currentView"] {
  if (!URLsMatches(location.pathname, APP_ROUTES.MESSAGES)) return "FEED";

  const view = new URLSearchParams(location.search).get("view");
  const acceptedViews: iMessagesContext["currentView"][] = ["FEED", "COMPOSE"];
  const defaultView = "COMPOSE";

  if (!view) return defaultView;
  if (!(typeof view === "string")) return defaultView;
  return (acceptedViews as string[]).includes(view.toUpperCase())
    ? (view.toUpperCase() as iMessagesContext["currentView"])
    : defaultView;
}
