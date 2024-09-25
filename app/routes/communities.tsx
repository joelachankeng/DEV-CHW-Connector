import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData, useLocation, Link } from "@remix-run/react";
import Page from "~/components/Pages/Page";
import { PublicHealthAlert } from "~/controllers/publicHealthAlert.control";
import type { iWP_PublicHealthAlert } from "~/models/publicHealthAlert.model";
import { requireUserSession } from "~/servers/userSession.server";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SVGDiscover from "~/assets/SVGs/SVGDiscover";
import SVGFeed from "~/assets/SVGs/SVGFeed";
import LeftSideBar from "app/components/SideBars/LeftSideBar";
import SVGCommunity from "~/assets/SVGs/SVGCommunity";
import { useEffect, useState } from "react";
import { APP_CLASSNAMES, APP_ROUTES } from "~/constants";
import { URLsMatches, classNames } from "~/utilities/main";
import type { iWP_Community } from "~/models/community.model";
import { useMediaSize } from "~/utilities/hooks/useMediaSize";
import MobileLeftSideBar from "~/components/SideBars/MobileLeftSideBar";

const LAYOUT_INFO = {
  TITLE: "Communities",
  SUMMARY:
    "CHW Connector Communities. Get NACHW updates and emergency alerts. Join CHW Networks and Associations. Find CHWs in your state. Join learning communities. ",
  SEARCH: "Search Communities",
  REQUEST_BUTTON: "Request New Community",
  REQUEST_BUTTON_LINK: APP_ROUTES.CONTACT,
};

const layoutMenu = [
  {
    title: "My Feed",
    link: APP_ROUTES.COMMUNITIES,
    icon: <SVGFeed />,
  },
  {
    title: "Discover",
    link: APP_ROUTES.COMMUNITIES_DISCOVER,
    icon: <SVGDiscover />,
  },
  {
    title: "My Communities",
    link: APP_ROUTES.COMMUNITIES_MY,
    icon: <SVGCommunity />,
  },
];

type iCommunitiesContext = {
  alert?: iWP_PublicHealthAlert;
  community?: iWP_Community;
};

export type iCommunitiesContextState = {
  layoutContext: iCommunitiesContext;
  setLayoutContext: React.Dispatch<React.SetStateAction<iCommunitiesContext>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserSession(request);

  const context: iCommunitiesContext = {};

  const alert = await PublicHealthAlert.API.getMostRecentAlert();
  if (!(alert instanceof Error) && alert !== null) {
    context.alert = alert;
  }

  return json(context);
};

export default function CommunitiesLayout() {
  const context = useLoaderData<iCommunitiesContext>();
  const location = useLocation();
  const mediaQuery = useMediaSize();

  const [layoutContext, setLayoutContext] =
    useState<iCommunitiesContext>(context);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  useEffect(() => {
    setActiveTabIndex(
      layoutMenu.findIndex((menu) => URLsMatches(menu.link, location.pathname)),
    );
  }, [location.pathname]);

  return (
    <>
      <Page>
        {mediaQuery && mediaQuery.width >= 992 ? (
          <LeftSideBar
            name={"Communities Sidebar"}
            title={LAYOUT_INFO.TITLE}
            summary={LAYOUT_INFO.SUMMARY}
            search={{
              placeholder: LAYOUT_INFO.SEARCH,
              onChange: () => {
                //
              },
            }}
          >
            {({ sidebarOpen, toolTipId }) => (
              <>
                <div
                  className={classNames(
                    "mt-5 flex flex-col gap-5",
                    sidebarOpen ? "items-start" : "items-center",
                  )}
                >
                  {layoutMenu.map((menu, index) => (
                    <Link
                      key={index}
                      to={menu.link}
                      className={classNames(
                        activeTabIndex === index
                          ? "text-chw-light-purple"
                          : "text-[#686867] ",
                        "flex items-center gap-3 text-base font-semibold hover:text-chw-light-purple",
                      )}
                      {...(!sidebarOpen && {
                        "data-tooltip-id": toolTipId,
                        "data-tooltip-content": menu.title,
                        "data-tooltip-place": "right",
                      })}
                    >
                      <span className="h-8 w-8">{menu.icon}</span>
                      {sidebarOpen && (
                        <span
                          className={classNames(
                            activeTabIndex === index
                              ? "text-[#032525]"
                              : "text-[#686867] ",
                            "hover:text-chw-light-purple",
                          )}
                        >
                          {menu.title}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
                <div className="mt-10">
                  <Link
                    to={LAYOUT_INFO.REQUEST_BUTTON_LINK}
                    className="m-auto flex w-full items-center justify-center gap-1 rounded-[40px] border-2 border-solid border-chw-light-purple bg-white px-4 py-2.5 text-base font-bold text-chw-light-purple transition duration-300 ease-in-out hover:bg-chw-light-purple hover:text-white"
                    {...(!sidebarOpen && {
                      "data-tooltip-id": toolTipId,
                      "data-tooltip-content": LAYOUT_INFO.REQUEST_BUTTON,
                      "data-tooltip-place": "right",
                    })}
                  >
                    <FontAwesomeIcon icon={faPlus} className="h-4" />
                    {sidebarOpen && <span>{LAYOUT_INFO.REQUEST_BUTTON}</span>}
                  </Link>
                </div>
              </>
            )}
          </LeftSideBar>
        ) : (
          <MobileLeftSideBar
            title={LAYOUT_INFO.TITLE}
            summary={LAYOUT_INFO.SUMMARY}
            search={{
              placeholder: LAYOUT_INFO.SEARCH,
              onChange: () => {
                //
              },
            }}
            drawerChildren={
              <>
                <div className="mt-2.5">
                  <Link
                    to={LAYOUT_INFO.REQUEST_BUTTON_LINK}
                    className="m-auto flex w-full items-center justify-center gap-1 rounded-[40px] border-2 border-solid border-chw-light-purple bg-transparent px-4 py-2.5 text-base font-bold text-chw-light-purple transition duration-300 ease-in-out hover:bg-chw-light-purple hover:text-white"
                  >
                    <FontAwesomeIcon icon={faPlus} className="h-4" />
                    <span>{LAYOUT_INFO.REQUEST_BUTTON}</span>
                  </Link>
                </div>
              </>
            }
          >
            <div className="flex items-center justify-between gap-2.5">
              {layoutMenu.map((menu, index) => (
                <Link
                  key={index}
                  to={menu.link}
                  className={classNames(
                    activeTabIndex === index
                      ? "text-chw-light-purple"
                      : "text-[#686867] ",
                    "flex items-center gap-2.5 text-base font-semibold hover:text-chw-light-purple",
                    "max-xs:flex-col max-xs:gap-1",
                  )}
                >
                  <span className="h-8 w-8">{menu.icon}</span>
                  <span
                    className={classNames(
                      activeTabIndex === index
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
          <Outlet
            context={{
              layoutContext,
              setLayoutContext,
            }}
          />
        </div>
      </Page>
    </>
  );
}
