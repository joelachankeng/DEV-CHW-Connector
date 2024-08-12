import { useEffect, useRef } from "react";
import { calculateOverlappingDistance, classNames } from "~/utilities/main";

export default function FullWidthContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
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
    if (window.innerWidth < 992)
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
    <div
      ref={containerElement}
      className={classNames(
        "container mx-auto py-5 flex flex-col gap-5 w-full",
        "max-w-[75rem]",
        className ?? "",
      )}
    >
      {children}
    </div>
  );
}
