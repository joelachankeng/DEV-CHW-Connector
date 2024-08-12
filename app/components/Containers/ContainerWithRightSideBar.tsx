import React, { useEffect, useRef } from "react";
import { APP_CLASSNAMES } from "~/constants";
import { useMediaSize } from "~/utilities/hooks/useMediaSize";
import { calculateOverlappingDistance, classNames } from "~/utilities/main";

export default function ContainerWithRightSideBar({
  className,
  children,
  sideBar,
  mobileSideBarNav,
}: {
  className?: string;
  children: React.ReactNode;
  sideBar: React.ReactNode;
  mobileSideBarNav: React.ReactNode;
}) {
  const mediaQuery = useMediaSize();

  const containerElement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.addEventListener("resize", updateContainerPadding);
    window.addEventListener("postsLoaded", updateContainerPadding);
    updateContainerPadding();

    return () => {
      window.removeEventListener("resize", updateContainerPadding);
      window.removeEventListener("postsLoaded", updateContainerPadding);
    };
  }, []);

  function updateContainerPadding() {
    if (!containerElement.current) return;
    if (window.innerWidth < 992 || window.innerWidth > 1200)
      return (containerElement.current.style.paddingLeft = "0px");

    const MAX_PADDING = 255;
    const sidebar = document.querySelector("aside.left-sidebar > div");
    if (!sidebar) return;

    const overlap = calculateOverlappingDistance(
      sidebar,
      containerElement.current,
    );

    const newLeft = overlap.width + 20;
    if (newLeft > MAX_PADDING) {
      containerElement.current.style.paddingLeft = `${MAX_PADDING}px`;
    } else {
      containerElement.current.style.paddingLeft = `${newLeft}px`;
    }
  }

  return (
    <div className={classNames(className ?? "")}>
      <div className="flex">
        <div
          ref={containerElement}
          className={classNames(
            APP_CLASSNAMES.CONTAINER,
            "max-tablet-lg:pt-0 tablet-lg:!mr-0",
          )}
        >
          {mediaQuery && mediaQuery.width < 992 && <>{mobileSideBarNav}</>}
          {children}
        </div>
        {mediaQuery && mediaQuery.width >= 992 && sideBar}
      </div>
    </div>
  );
}
