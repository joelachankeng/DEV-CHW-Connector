import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import type { LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, Outlet, useLocation } from "@remix-run/react";
import { useContext, useEffect, useState } from "react";
import { SVGAvatarTwo } from "~/assets/SVGs/SVGAvatarTwo";
import type { iContextMenuProps } from "~/components/ContextMenu";
import ContextMenu from "~/components/ContextMenu";
import Page from "~/components/Pages/Page";
import Avatar from "~/components/User/Avatar";
import { APP_CLASSNAMES, APP_ROUTES } from "~/constants";
import { AppContext } from "~/contexts/appContext";
import { requireUserSession } from "~/servers/userSession.server";
import { classNames } from "~/utilities/main";

type iTab = {
  title: string;
  path: string;
};

const tabs = [
  {
    title: "Edit Profile",
    path: `${APP_ROUTES.SETTINGS}/edit-profile`,
  },
  { title: "Password", path: `${APP_ROUTES.SETTINGS}/password` },
  { title: "Notifications", path: `${APP_ROUTES.SETTINGS}/notifications` },
  // { title: "Blocked Users", path: `${APP_ROUTES.SETTINGS}/blocked-users` },
  { title: "Delete Account", path: `${APP_ROUTES.SETTINGS}/delete-account` },
];

const tabOptions = tabs.map((tab) => ({
  label: tab.title,
  value: tab.path,
}));

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserSession(request);

  const url = new URL(request.url);
  const paths = url.pathname.split("/").filter((path) => path);
  if (paths[paths.length - 1].toString() === "settings") {
    throw redirect(tabs[0].path);
  }

  return json({});
};

const getTab = (path: string): iTab | undefined => {
  return tabs.find((tab) => path.startsWith(tab.path));
};

export default function Settings() {
  const { appContext } = useContext(AppContext);

  const location = useLocation();

  const [activeTab, setActiveTab] = useState<iTab | undefined>(undefined);

  useEffect(() => {
    setActiveTab(getTab(location.pathname));
  }, [location.pathname]);

  const menuITtems: iContextMenuProps["items"] = [
    [
      { element: "Edit Profile", link: `${APP_ROUTES.SETTINGS}/edit-profile` },
      { element: "Password", link: `${APP_ROUTES.SETTINGS}/password` },
      {
        element: "Notifications",
        link: `${APP_ROUTES.SETTINGS}/notifications`,
      },
    ],
    [
      {
        element: "Delete Account",
        link: `${APP_ROUTES.SETTINGS}/delete-account`,
      },
    ],
  ];

  return (
    <>
      <Page>
        <div className={APP_CLASSNAMES.CONTAINER_FULLWIDTH}>
          <div className={APP_CLASSNAMES.CONTAINER}>
            <div className="mt-28 max-md:mt-5">
              <div className="flex items-center gap-4">
                <div className="h-[3.75rem] w-[3.75rem] min-w-[3.75rem]">
                  {appContext.User?.avatar.url ? (
                    <Avatar
                      src={appContext.User?.avatar.url}
                      alt={`${appContext.User?.firstName} ${appContext.User?.lastName}`}
                    />
                  ) : (
                    <SVGAvatarTwo />
                  )}
                </div>
                <h1 className="text-[1.75rem] font-bold text-[#032525]">
                  <span className="break-all">
                    {appContext.User?.firstName} {appContext.User?.lastName}
                  </span>
                  <span className="max-md:hidden">
                    {activeTab && (
                      <>
                        <span className="text-[#C1BAB4]">{" / "}</span>
                        {activeTab.title}
                      </>
                    )}
                  </span>
                </h1>
              </div>
              <div className="hidden items-center justify-end gap-3 max-md:flex">
                <h1 className="text-[1.75rem] font-bold text-[#032525]">
                  {activeTab && (
                    <>
                      <span className="text-[#C1BAB4]">{" / "}</span>
                      {activeTab.title}
                    </>
                  )}
                </h1>
                <ContextMenu
                  button={
                    <span className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#686867] transition duration-300 ease-in-out group-hover:bg-[#625DA6] group-hover:text-white">
                      <EllipsisHorizontalIcon className="h-4 w-4" />
                    </span>
                  }
                  items={menuITtems.map((items) => {
                    return items.map((item) => {
                      return {
                        ...item,
                        active: activeTab?.path === item.link,
                      };
                    });
                  })}
                />
              </div>
            </div>
            <div className="mt-[2.375rem] flex gap-5 max-md:mt-5">
              <div className=" w-full max-w-[14.0625rem] max-md:hidden">
                <ul className="flex flex-col gap-5 text-base font-semibold text-[#686867]">
                  {tabs.map((tab, index) => (
                    <li
                      key={index}
                      className={classNames(
                        activeTab?.path === tab.path
                          ? "text-chw-light-purple"
                          : "",
                        "transition duration-300 ease-in-out hover:text-chw-light-purple",
                        index === tabs.length - 1
                          ? " flex flex-col gap-5 before:block before:h-[1px] before:w-full before:bg-[#C1BAB4] before:content-['']"
                          : "",
                      )}
                    >
                      <Link to={tab.path}>{tab.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-full">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </Page>
    </>
  );
}
