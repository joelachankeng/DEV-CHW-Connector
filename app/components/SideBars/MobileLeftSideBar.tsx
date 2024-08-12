import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import type { ReactNode } from "react";
import { useState } from "react";
import { APP_CLASSNAMES } from "~/constants";
import { classNames } from "~/utilities/main";
import Drawer from "../Drawer";
import SearchField from "../Forms/SearchField";

type iMobileLeftSideBarProps = {
  title: string;
  summary: string;
  search?: {
    placeholder?: string;
    onChange: () => void;
  };
  children: ReactNode;
  drawerChildren?: ReactNode;
};

export default function MobileLeftSideBar({
  title,
  summary,
  search,
  children,
  drawerChildren,
}: iMobileLeftSideBarProps) {
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  return (
    <>
      <aside aria-label="Sidebar" className="w-full">
        <div className="-mx-5 my-0 border-y-2 border-solid border-y-[#C1BAB4] bg-[#FFF5E5] px-5 py-0">
          <div
            className={classNames(APP_CLASSNAMES.CONTAINER, "!gap-2.5 !py-2.5")}
          >
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold leading-9">{title}</h1>
              {drawerChildren && (
                <button
                  className="inline-flex justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
                  onClick={() => setShowProfileDrawer(true)}
                >
                  <span className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#686867] transition duration-300 ease-in-out group-hover:bg-[#625DA6] group-hover:text-white">
                    <EllipsisHorizontalIcon className="h-4 w-4" />
                  </span>
                </button>
              )}
            </div>
            <div className="">{children}</div>
          </div>
        </div>
      </aside>
      {drawerChildren && (
        <Drawer
          open={showProfileDrawer}
          position="left"
          onClose={() => setShowProfileDrawer(false)}
        >
          <>
            <div className="flex flex-col gap-3">
              <h1 className="text-[1.75rem] font-bold">{title}</h1>
              <div className="text-[.875rem] leading-[1.125rem]">{summary}</div>
              {/* {search && (
                <div>
                  <SearchField
                    placeholder={search.placeholder}
                    screenReaderText={search.placeholder ?? ""}
                    onChange={search.onChange}
                    className="!bg-white"
                  />
                </div>
              )} */}
              <div className="">{drawerChildren}</div>
            </div>
          </>
        </Drawer>
      )}
    </>
  );
}
