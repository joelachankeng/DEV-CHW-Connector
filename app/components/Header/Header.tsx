import { Link } from "@remix-run/react";
import { Logo } from "~/assets/Logo";
import SVGSearch from "~/assets/SVGs/SVGSearch";
import { classNames } from "~/utilities/main";
import type { iHeaderNav } from "./HeaderNav";
import HeaderNav from "./HeaderNav";
import SVGHome from "~/assets/SVGs/SVGHome";
import SVGCommunities from "~/assets/SVGs/SVGCommunities";
import SVGCHWNetworks from "~/assets/SVGs/SVGCHWNetworks";
import SVGAlert from "~/assets/SVGs/SVGAlert";
import SVGEmail from "~/assets/SVGs/SVGEmail";
import { SVGBell } from "~/assets/SVGs/SVGBell";
import { SVGAvatarTwo } from "~/assets/SVGs/SVGAvatarTwo";
import { useCallback, useContext, useEffect, useState } from "react";
import _ from "lodash";
import MenuDropDown from "./MenuDropdown";
import SVGAvatarThree from "~/assets/SVGs/SVGAvatarThree";
import SVGSetting from "~/assets/SVGs/SVGSetting";
import SVGHelp from "~/assets/SVGs/SVGHelp";
import SVGLogout from "~/assets/SVGs/SVGLogout";
import { APP_CLASSNAMES, APP_ROUTES } from "~/constants";
import HeaderNavMobile from "./HeaderNavMobile";
import Drawer from "../Drawer";
import { Menu } from "@headlessui/react";
import type { iMenuItemsListItems } from "./MenuItemsList";
import MenuItemsList from "./MenuItemsList";
import SVGTerms from "~/assets/SVGs/SVGTerms";
import SVGAbout from "~/assets/SVGs/SVGAbout";
import SVGContact from "~/assets/SVGs/SVGContact";
import { useMediaSize } from "~/utilities/hooks/useMediaSize";
import { AppContext } from "~/contexts/appContext";
import Avatar from "../User/Avatar";

const profileMenu: iMenuItemsListItems[][] = [
  [
    {
      text: "Profile",
      icon: <SVGAvatarThree />,
      link: APP_ROUTES.PROFILE,
    },
    {
      text: "Settings",
      icon: <SVGSetting />,
      link: APP_ROUTES.SETTINGS,
    },
    {
      text: "Help Center",
      icon: <SVGHelp />,
      link: APP_ROUTES.CONTACT,
    },
    {
      text: "Terms & Policies",
      icon: <SVGTerms />,
      link: "",
      child: [
        {
          text: "Terms of Use",
          link: APP_ROUTES.TERMS_OF_USE,
        },
        {
          text: "Community Guidelines",
          link: APP_ROUTES.COMMUNITY_GUIDELINES,
        },
        {
          text: "Privacy Policy",
          link: APP_ROUTES.PRIVACY_POLICY,
        },
        // {
        //   text: "Accessibility",
        //   link: APP_ROUTES.ACCESSIBILITY,
        // },
      ],
    },
  ],
  [
    {
      text: "Logout",
      icon: <SVGLogout />,
      link: APP_ROUTES.LOGOUT,
    },
  ],
];

const profileSideMenu: iMenuItemsListItems[][] = [
  [
    ...profileMenu[0],
    {
      text: "About CHW Connector",
      icon: <SVGAbout />,
      link: APP_ROUTES.ABOUT,
    },
    {
      text: "Contact NACHW",
      icon: <SVGContact />,
      link: APP_ROUTES.CONTACT,
    },
  ],
  profileMenu[1],
];

const MainNavLinks: iHeaderNav["items"] = [
  {
    title: "Home",
    url: APP_ROUTES.FEED,
    icon: <SVGHome />,
  },
  {
    title: "Communities",
    url: APP_ROUTES.COMMUNITIES,
    icon: <SVGCommunities />,
  },
  {
    title: "CHW Networks",
    url: APP_ROUTES.CHW_NETWORKS,
    icon: <SVGCHWNetworks />,
  },
  {
    title: "Public Health Alerts",
    url: APP_ROUTES.PUBLIC_HEALTH_ALERTS,
    icon: <SVGAlert />,
  },
];

const headerPaddingClasses = {
  top: "pt-4",
  bottom: "pb-4",
  li_bottom: "pb-1",
  mobile_top: "max-md:pt-3",
  mobile_bottom: "max-md:pb-3",
};

export default function Header() {
  const { appContext } = useContext(AppContext);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const mediaQuery = useMediaSize();

  const createMessageMenuIcon = useCallback(
    (unreadCount: number): JSX.Element => {
      return (
        <>
          <div className="relative">
            <SVGEmail />
            <MessageNotificationCount
              count={appContext.MessagesManager.unreadIds.length}
            />
          </div>
        </>
      );
    },
    [appContext.MessagesManager.unreadIds.length],
  );

  const AccountNavLinks: iHeaderNav["items"] = [
    {
      title: "Messages",
      url: APP_ROUTES.MESSAGES.concat("?view=feed"),
      icon: createMessageMenuIcon(appContext.MessagesManager.unreadIds.length),
    },
    {
      title: "Notifications",
      url: APP_ROUTES.NOTIFICATIONS,
      icon: <SVGBell />,
      className: "max-lg:!hidden",
    },
    {
      title: "",
      url: APP_ROUTES.PROFILE,
      icon: <></>,
      custom: (
        <>
          <button
            className="relative hidden max-md:block"
            onClick={() => setShowProfileDrawer(true)}
          >
            <ProfileButton />
          </button>
          <MenuDropDown
            button={
              <div className="max-md:hidden">
                <ProfileButton />
              </div>
            }
            items={profileMenu}
            classes={{
              menu: {
                className: "mt-4 divide-y-2 divide-[#C1BAB4]",
              },
            }}
          />
        </>
      ),
    },
  ];

  const [menus, setMenus] = useState([MainNavLinks, AccountNavLinks]);

  useEffect(() => {
    const pathname = window.location.pathname;

    let activeMenu: (typeof menus)[0][0] | undefined;

    menus.flat().forEach((item) => {
      const slashAmount = (pathname.match(/\//g) || []).length;

      if (slashAmount === 1) {
        if (pathname === item.url.split("?")[0]) {
          activeMenu = item;
        }
      } else {
        if (pathname.startsWith(item.url.split("?")[0])) {
          activeMenu = item;
        }
      }
    });

    const updatedMenus = menus.map((menu) => {
      return menu.map((item) => {
        const isActive = _.isEqual(item, activeMenu);
        return {
          ...item,
          active: isActive,
        };
      });
    });

    if (!_.isEqual(updatedMenus, menus)) setMenus(updatedMenus);
  }, [menus]);

  useEffect(() => {
    setMenus((prev) => {
      return prev.map((menu) => {
        return menu.map((item) => {
          if (item.title.toLowerCase() === "messages") {
            return {
              ...item,
              icon: createMessageMenuIcon(
                appContext.MessagesManager.unreadIds.length,
              ),
            };
          }
          return item;
        });
      });
    });
  }, [appContext.MessagesManager.unreadIds, createMessageMenuIcon]);

  const getAccountNavItems = (): iHeaderNav["items"] => {
    const accountNavItems = menus[1];
    if (appContext.User) return accountNavItems;

    const emptyItem = {
      title: "",
      url: "",
      icon: <></>,
    };

    return accountNavItems.map((item) => {
      if (item.url.startsWith(APP_ROUTES.MESSAGES)) {
        return {
          ...item,
          ...emptyItem,
        };
      }
      switch (item.url) {
        case APP_ROUTES.NOTIFICATIONS:
          return {
            ...item,
            ...emptyItem,
          };
        case APP_ROUTES.PROFILE:
          return {
            ...item,
            // title: "Login",
            url: APP_ROUTES.LOGIN,
            custom: (
              <Link to={APP_ROUTES.LOGIN}>
                <button className="h-14 w-14">
                  <SVGAvatarTwo />
                </button>
              </Link>
            ),
          };
        default:
          return item;
      }
    });
  };

  return (
    <>
      <header
        className={classNames(
          "sticky z-[100] w-full bg-white mix-blend-normal shadow-[0_0_12px_0_rgba(0,0,0,0.22)]",
          "left-0 top-0 px-[15px]",
          headerPaddingClasses.top,
          headerPaddingClasses.mobile_top,
        )}
      >
        <div className={APP_CLASSNAMES.CONTAINER_FULLWIDTH}>
          <div className="flex items-center justify-between">
            <div
              className={classNames(
                "flex flex-1 items-center gap-5",
                headerPaddingClasses.bottom,
                headerPaddingClasses.mobile_bottom,
                "max-md:gap-5",
              )}
            >
              <Link
                to={APP_ROUTES.HOME}
                className="block h-[3.75rem] w-full min-w-[6.25rem] max-w-[205px] max-md:h-8 max-md:w-[6.25rem] max-md:min-w-0"
              >
                <Logo />
              </Link>
              {/* <button className="">
                <span className="sr-only">Click To Search</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-none bg-[#f4ebdf] p-2.5 text-[#686867] outline-none transition duration-300 ease-in-out hover:bg-chw-yellow-100 hover:text-chw-light-purple">
                  <SVGSearch />
                </div>
              </button> */}
            </div>
            {mediaQuery && mediaQuery?.width > 1024 && (
              <HeaderNav
                id="mainNav"
                parent={{
                  className:
                    "self-stretch h-inherit flex-1 min-w-[45rem] flex justify-center max-xl:min-w-0 max-xl:flex-auto max-lg:hidden",
                }}
                ul={{
                  className: "flex items-center h-full",
                  "aria-label": "Main Navigation",
                }}
                li={{
                  className: classNames(
                    "min-w-[130px] relative",
                    "hover:text-[#625DA6] text-[#686867] transition duration-300 ease-in-out",
                    headerPaddingClasses.li_bottom,
                  ),
                }}
                items={menus[0]}
              />
            )}
            {mediaQuery && mediaQuery?.width <= 1024 && (
              <HeaderNavMobile
                id="mainNavMobile"
                parent={{
                  className: "self-stretch h-inherit flex justify-center",
                }}
                menuItems={{
                  className: classNames(
                    "relative w-full",
                    "hover:text-[#625DA6] text-[#686867] transition duration-300 ease-in-out",
                    headerPaddingClasses.li_bottom,
                  ),
                }}
                items={[...menus[0], { ...menus[1][1], className: "" }]}
              />
            )}
            <HeaderNav
              id="accountNav"
              parent={{
                className: `self-stretch h-inherit flex-1 flex justify-end`,
              }}
              ul={{
                className: classNames(
                  "flex items-center h-full max-w-[20rem] w-full gap-4 text-[#686867] max-lg:gap-5 max-lg:w-auto max-xxs:gap-1",
                ),
                "aria-label": "Account Navigation",
              }}
              li={{
                className: classNames(
                  "relative",
                  "hover:text-[#625DA6] transition duration-300 ease-in-out",
                  headerPaddingClasses.li_bottom,
                ),
              }}
              items={getAccountNavItems()}
            />
          </div>
        </div>
      </header>
      <Drawer
        open={showProfileDrawer}
        position="right"
        onClose={() => setShowProfileDrawer(false)}
      >
        <>
          <div className="">
            <Menu>
              <div className="-mx-5 flex flex-col divide-y-2 divide-[#C1BAB4]">
                <MenuItemsList items={profileSideMenu} itemClassName="!py-5" />
              </div>
            </Menu>
          </div>
          <div className="mb-5 mt-auto flex flex-col gap-5">
            <a
              href="https://nachw.org/"
              target="_blank"
              className="block h-10 w-[120px]"
              rel="noreferrer"
            >
              <img
                src="/assets/nachw-logo.png"
                alt="Visit NACHW main Website"
                className="h-full w-full object-contain"
              />
            </a>
            <p className="text-[10px] font-normal text-chw-dark-green max-md:w-full">
              &copy; National Association of Community Health Workers (NACHW){" "}
              {new Date().getFullYear()}
            </p>
          </div>
        </>
      </Drawer>
    </>
  );
}

function ProfileButton() {
  const { appContext } = useContext(AppContext);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    appContext.User?.avatar.url,
  );
  const [name, setName] = useState<string | undefined>(
    `${appContext.User?.firstName} ${appContext.User?.lastName}`,
  );

  useEffect(() => {
    setAvatarUrl(appContext.User?.avatar.url);
  }, [appContext.User?.avatar.url]);

  useEffect(() => {
    setName(`${appContext.User?.firstName} ${appContext.User?.lastName}`);
  }, [appContext.User?.firstName, appContext.User?.lastName]);

  return (
    <>
      <div className="h-14 w-14 max-md:h-10 max-md:w-10">
        {appContext.User?.avatar ? (
          <Avatar src={avatarUrl} alt={name || "User's Avatar"} />
        ) : (
          <SVGAvatarTwo />
        )}
      </div>
      <span className="sr-only text-xs font-bold text-[#686867]">Profile</span>
    </>
  );
}

export function MessageNotificationCount({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return count > 0 ? (
    <span
      className={classNames(
        "absolute -bottom-2.5 -right-2.5 flex h-[25px] w-[25px] items-center justify-center rounded-[100%] bg-[#FABE46] text-[10px] font-bold text-[#032525] group-hover:bg-chw-light-purple group-hover:text-white",
        className || "",
      )}
    >
      {count}
    </span>
  ) : null;
}
