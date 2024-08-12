import { useEffect, useRef, useState, type ReactNode } from "react";
import SVGSearch from "~/assets/SVGs/SVGSearch";
import { classNames, isFooterInView } from "~/utilities/main";
import SearchField from "../Forms/SearchField";
import SVGSidebar, { SVGSidebarCollapse } from "~/assets/SVGs/SVGSidebar";
import { Tooltip } from "react-tooltip";
import { useMediaSize } from "~/utilities/hooks/useMediaSize";
import _ from "lodash";

type SidebarProps = {
  name: string;
  title: string | ReactNode;
  summary?: string;
  search?: {
    placeholder?: string;
    onChange: () => void;
  };
  borderBottom?: boolean;
  children: (props: { sidebarOpen: boolean; toolTipId: string }) => ReactNode;
};

export default function LeftSideBar({
  title,
  summary,
  search,
  borderBottom = true,
  children,
}: SidebarProps) {
  const toolTipId = `tooltip-sidebar-visiblity`;

  const sideBarRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const mediaQuery = useMediaSize();

  const updateSidebarHeight = () => {
    if (!sideBarRef.current) return;

    const footer = document.querySelector("footer");
    const header = document.querySelector("header");

    const diff = (header?.clientHeight ?? 0) + (footer?.clientHeight ?? 0);
    const extraPadding = 20;
    if (isFooterInView(footer ?? undefined)) {
      sideBarRef.current.style.paddingBottom = `${diff + extraPadding}px`;
    } else {
      sideBarRef.current.style.paddingBottom = `0px`;
    }
  };

  useEffect(() => {
    window.addEventListener("resize", updateSidebarHeight);
    window.addEventListener("postsLoaded", updateSidebarHeight);
    window.addEventListener("scroll", updateSidebarHeight);

    updateSidebarHeight();

    return () => {
      window.removeEventListener("resize", updateSidebarHeight);
      window.removeEventListener("postsLoaded", updateSidebarHeight);
      window.removeEventListener("scroll", updateSidebarHeight);
    };
  }, []);

  useEffect(() => {
    if (mediaQuery?.width && mediaQuery.width < 1440) {
      setSidebarOpen(false);
    }
  }, [mediaQuery?.width]);

  useEffect(() => {
    dispatchEvent(new Event("sidebarToggled"));
  }, [sideBarRef.current?.clientWidth]);

  return (
    <aside
      className={classNames(
        (typeof title === "string" && _.kebabCase(title) + "-sidebar") || "",
        "left-sidebar",
      )}
      aria-label={typeof title === "string" ? title : ""}
    >
      <Tooltip id={toolTipId} className="z-[100]" />
      <div
        ref={sideBarRef}
        className={classNames(
          "fixed left-0 z-[99] border-r border-[#C1BAB4] border-opacity-50 bg-white",
          "w-full overflow-auto p-4",
          "transition-[max-width] duration-300 ease-in-out",
          "hoverflow-y-auto round h-[100vh] scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-chw-black-shadows",
          sidebarOpen ? "max-w-[22rem]" : "max-w-[5rem]",
        )}
      >
        <div
          className={classNames(
            "flex items-center justify-between gap-2",
            sidebarOpen ? "mb-2" : "mb-5",
          )}
        >
          {sidebarOpen && (
            <>
              {typeof title === "string" ? (
                <h1 className="text-[1.75rem] font-bold leading-9">{title}</h1>
              ) : (
                title
              )}
            </>
          )}
          <button
            data-tooltip-id={toolTipId}
            data-tooltip-content={`${sidebarOpen ? `Collapse` : `Expand`} Sidebar`}
            data-tooltip-place="right"
            className="rounded-[40px] bg-white px-2 py-0.5 text-chw-light-purple transition duration-300 ease-in-out hover:bg-chw-light-purple hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <div className="h-8 w-8">
              {sidebarOpen ? <SVGSidebar /> : <SVGSidebarCollapse />}
            </div>
          </button>
        </div>
        {sidebarOpen && (
          <>
            {summary && (
              <div
                className="html-formatted-content text-sm font-normal text-[#032525]"
                dangerouslySetInnerHTML={{ __html: summary }}
              />
            )}
          </>
        )}
        {sidebarOpen ? (
          <>
            {search && (
              <div>
                {/* <SearchField
                  placeholder={search.placeholder}
                  screenReaderText={search.placeholder ?? ""}
                  onChange={search.onChange}
                /> */}
              </div>
            )}
          </>
        ) : (
          <>
            {/* {search && (
              <button
                data-tooltip-id={toolTipId}
                data-tooltip-content={search?.placeholder ?? ""}
                data-tooltip-place="right"
                className="rounded-[40px] bg-white px-2 py-0.5 text-chw-light-purple transition duration-300 ease-in-out hover:bg-chw-light-purple hover:text-white"
                onClick={() => setSidebarOpen(true)}
              >
                <div className="h-8 w-8">
                  <SVGSearch />
                </div>
              </button>
            )} */}
          </>
        )}
        {borderBottom && <hr className="my-5 border-[#C1BAB4]" />}
        <div className="">{children({ sidebarOpen, toolTipId })}</div>
      </div>
    </aside>
  );
}
