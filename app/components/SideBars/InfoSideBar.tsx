import { ChevronDownIcon } from "@heroicons/react/20/solid";
import SVGImageIcon from "~/assets/SVGs/SVGImageICon";
import SVGSearch from "~/assets/SVGs/SVGSearch";
import { classNames } from "~/utilities/main";
import { useRef, useState, useEffect } from "react";

type InfoSideBarProps = {
  ariaLabel: string;
  image?: string;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  visible?: boolean;
};

export default function InfoSideBar({
  ariaLabel,
  image,
  title,
  subtitle,
  children,
  visible = true,
}: InfoSideBarProps) {
  const padding = "px-5";

  const aside = useRef<HTMLDivElement>(null);
  const sideBar = useRef<HTMLDivElement>(null);
  const sideBarHeader = useRef<HTMLDivElement>(null);
  const sideBarContent = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sideBar.current) return;

    // updateSideBarHeight();
    // updateAsideRight();
    // // updatePositon();

    // window.addEventListener("resize", updateSideBarHeight);
    // window.addEventListener("resize", updateAsideRight);
    // // window.addEventListener("scroll", updatePositon);

    // return () => {
    //   window.removeEventListener("resize", updateSideBarHeight);
    //   window.removeEventListener("resize", updateAsideRight);
    //   // window.removeEventListener("scroll", updatePositon);
    // };
  }, [sideBar.current]);

  function updateSideBarHeight() {
    if (!sideBar.current) return;
    const main = document.querySelector("main");
    if (!main) return;

    let maxHeight = main.clientHeight;
    if (sideBarHeader.current) {
      if (maxHeight < sideBarHeader.current.clientHeight + 20) {
        maxHeight = sideBarHeader.current.clientHeight + 20;
      }
    }
    sideBar.current.style.maxHeight = `${maxHeight}px`;
  }

  function updateAsideRight() {
    // if (!aside.current) return;
    // if (!mainContentRef.current) return;
    // const mainContentRight =
    //   mainContentRef.current.offsetLeft + mainContentRef.current.offsetWidth;
    // const remainingSpaceOnRightSide =
    //   document.body.clientWidth - mainContentRight;
    // const asideRight = remainingSpaceOnRightSide - aside.current.offsetWidth;
    // aside.current.style.right = `${asideRight}px`;
  }

  function updatePositon() {
    if (!aside.current) return;

    const footer = document.querySelector("footer");
    if (!footer) return;

    const offset = 0;
    const top = footer.getBoundingClientRect().top;
    const footerInView =
      top + offset >= 0 && top - offset <= window.innerHeight;

    // offset bottom = offset top + height
    // try save bottom to data attribute and use it to calculate the bottom

    if (footerInView) {
      aside.current.style.bottom = `${footer.getBoundingClientRect().height}px`;
    } else {
      // aside.current.style.bottom = "0";
    }
  }
  return (
    <>
      <aside
        ref={aside}
        aria-label={ariaLabel}
        className="w-[21.875rem] transition-all"
      >
        {visible && (
          <div
            ref={sideBar}
            className="sticky top-[7.5rem] my-5 ml-5 flex flex-col overflow-hidden rounded-[10px] border border-[#E8E0D6] bg-white pb-5"
          >
            <div ref={sideBarHeader}>
              {title && <InfoImage image={image} title={title} />}
              <div className={classNames(padding, "pt-5")}>
                <InfoAbout image={image} title={title} subtitle={subtitle} />
              </div>
            </div>
            <div
              ref={sideBarContent}
              className={classNames(
                padding,
                "round mt-5 overflow-y-auto scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-chw-black-shadows",
              )}
            >
              {children}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export function InfoSideBarMobile({
  image,
  title,
  subtitle,
  children,
  visible = true,
}: InfoSideBarProps) {
  if (!visible) return <div className="pb-5"></div>;
  return (
    <>
      <div
        className={classNames(
          "flex flex-col rounded-[.625rem] border border-[#E8E0D6] bg-white",
          "max-md:rounded-none max-md:border-[0] max-md:border-b-2 max-md:border-[#C1BAB4]",
          "max-md:-mx-5",
        )}
      >
        <InfoImage
          className="border-b-2 border-[#C1BAB4]"
          image={image}
          title={title}
        />
        <div className="p-5">
          <InfoAbout image={image} title={title} subtitle={subtitle} />
        </div>
        <div className="p-5">{children}</div>
      </div>
    </>
  );
}

function InfoImage({
  image,
  title,
  className,
}: {
  image: string | undefined;
  title: string | undefined;
  className?: string;
}) {
  return (
    <div className={classNames("relative h-[12.5rem] w-full", className ?? "")}>
      {image ? (
        <>
          <img
            src={image}
            className="absolute left-0 top-0 z-0 h-full w-full object-cover object-center"
            alt={title}
          />
          <img
            src={image}
            className="relative z-10 h-full w-full object-contain object-center backdrop-blur"
            alt={title}
          />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#F4EBDF]">
          <div className="h-8 w-8 text-[#032525]">
            <SVGImageIcon />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoAbout({
  image,
  title,
  subtitle,
}: {
  image: string | undefined;
  title: string | undefined;
  subtitle: string | undefined;
}) {
  return (
    <>
      <div className="flex items-center gap-3.5">
        <div className="h-[3.75rem] w-[3.75rem] min-w-[3.75rem] overflow-hidden rounded-full bg-[#F4EBDF]">
          {image ? (
            <img
              className="h-full w-full object-cover"
              src={image}
              alt={title}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#F4EBDF]">
              <div className="h-8 w-8 text-[#032525]">
                <SVGImageIcon />
              </div>
            </div>
          )}
        </div>
        <div className="">
          <h2 className="text-lg font-semibold leading-[18px]">{title}</h2>
          {subtitle && (
            <p className="text-sm font-semibold leading-[1.125rem] text-chw-dim-gray">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
