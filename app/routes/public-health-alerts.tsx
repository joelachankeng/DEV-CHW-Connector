import type { LoaderFunction } from "@remix-run/node";
import Page from "~/components/Pages/Page";
import LeftSideBar from "app/components/SideBars/LeftSideBar";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import SVGFeed from "~/assets/SVGs/SVGFeed";
import { URLsMatches, classNames } from "~/utilities/main";
import { useEffect, useState } from "react";
import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import { ThemeOptions } from "~/controllers/themeOptions.control";
import type { iThemeOptions_PublicHealthAlerts } from "~/models/themeOptions.model";
import { APP_CLASSNAMES, APP_ROUTES } from "~/constants";
import { useMediaSize } from "~/utilities/hooks/useMediaSize";
import MobileLeftSideBar from "~/components/SideBars/MobileLeftSideBar";
import ContainerWithRightSideBar from "~/components/Containers/ContainerWithRightSideBar";
import type { iInfoSideBarGroupTemplateProps } from "~/components/SideBars/InfoSideBar.GroupTemplate";
import InfoSideBarGroupTemplate, {
  InfoSideBarGroupTemplateMobile,
} from "~/components/SideBars/InfoSideBar.GroupTemplate";
import Drawer from "~/components/Drawer";
import { InfoSideBarMobile } from "~/components/SideBars/InfoSideBar";

const layoutMenu = [
  {
    title: "Public Health Alerts Feed",
    link: APP_ROUTES.PUBLIC_HEALTH_ALERTS,
    icon: <SVGFeed />,
  },
];

export const loader: LoaderFunction = async ({ request }) => {
  const settings = await ThemeOptions.API.getPublicHealthAlerts();

  return {
    settings: settings instanceof Error ? null : settings,
  };
};
export default function PublicHealthAlertsLayout() {
  const { settings } = useLoaderData() as {
    settings: null | iThemeOptions_PublicHealthAlerts;
  };

  const location = useLocation();
  const mediaQuery = useMediaSize();

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  const LAYOUT_INFO = {
    TITLE: "Public Health Alerts",
    SUMMARY: settings?.leftSidebar.description ?? "",
  };

  const groupProps: iInfoSideBarGroupTemplateProps = {
    ariaLabel: "NACHW CHW Emergency Alert Center Sidebar",
    image: settings?.rightSidebar.image.node.mediaItemUrl ?? "",
    title: "NACHW CHW Emergency Alert Center",
    description: settings?.rightSidebar.aboutContent ?? "",
    guidelines: {
      title: "Additional Emergency Resources",
      content: settings?.rightSidebar.accordionContent ?? "",
    },
    searchText: "",
    onSearchChange: undefined,
  };

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
            name={LAYOUT_INFO.TITLE + " Sidebar"}
            title={LAYOUT_INFO.TITLE}
            summary={LAYOUT_INFO.SUMMARY}
          >
            {({ sidebarOpen, toolTipId }) => (
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
            )}
          </LeftSideBar>
        ) : (
          <MobileLeftSideBar
            title={LAYOUT_INFO.TITLE}
            summary={LAYOUT_INFO.SUMMARY}
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
          <ContainerWithRightSideBar
            sideBar={<InfoSideBarGroupTemplate {...groupProps} />}
            mobileSideBarNav={
              <InfoSideBarMobile
                ariaLabel={groupProps.ariaLabel}
                image={groupProps.image}
                title={groupProps.title}
                subtitle={groupProps.subtitle}
              >
                <div className="flex items-center gap-2.5">
                  <h1 className="text-sm font-semibold leading-[18px]">
                    About
                  </h1>
                  <button
                    className="inline-flex justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
                    onClick={() => setShowProfileDrawer(true)}
                  >
                    <span className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#686867] transition duration-300 ease-in-out group-hover:bg-[#625DA6] group-hover:text-white">
                      <EllipsisHorizontalIcon className="h-4 w-4" />
                    </span>
                  </button>
                </div>
              </InfoSideBarMobile>
            }
          >
            <Outlet />
          </ContainerWithRightSideBar>
        </div>
        <Drawer
          open={showProfileDrawer}
          position="left"
          onClose={() => setShowProfileDrawer(false)}
        >
          <InfoSideBarGroupTemplateMobile {...groupProps} />
        </Drawer>
      </Page>
    </>
  );
}
