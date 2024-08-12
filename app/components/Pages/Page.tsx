import type { ReactNode } from "react";
import Footer from "../Footer";
import Header from "../Header/Header";
import type { iClassNamesOverride } from "~/utilities/main";
import { classNames, classNamesOverride } from "~/utilities/main";
import React, { useEffect } from "react";
import { useLocation, useMatches } from "@remix-run/react";

type iPageProps = {
  children: ReactNode;
  className?: React.HTMLProps<HTMLElement>["className"];
  main?: iClassNamesOverride;
  article?: iClassNamesOverride;
  header?: {
    display: boolean;
  };
  footer?: {
    display: boolean;
  };
};

const PAGE_CLASSES = {
  BGCOLOR: {
    DEFAULT: "bg-[#FFFAF3] max-md:bg-white",
    LIGHT_CREAM: "bg-[#FFFAF3]",
  },
};

export const Page = ({
  children,
  className,
  main,
  article,
  header = {
    display: true,
  },
  footer = {
    display: true,
  },
}: iPageProps) => {
  const mainRef = React.useRef<HTMLDivElement>(null);
  const matches = useMatches();
  const location = useLocation();

  const [bgColor, setBgColor] = React.useState<string>(
    PAGE_CLASSES.BGCOLOR.DEFAULT,
  );

  useEffect(() => {
    window.addEventListener("resize", updateMainMarginBottom);
    window.addEventListener("scroll", updateMainMarginBottom);
    updateMainMarginBottom();

    return () => {
      window.removeEventListener("resize", updateMainMarginBottom);
      window.removeEventListener("scroll", updateMainMarginBottom);
    };
  }, []);

  function updateMainMarginBottom() {
    if (!mainRef.current) return;

    const MIN_MARGIN_BOTTOM = 50;
    const MOBILE_FOOTER_MEDIA_QUERY = 1024;

    if (window.innerWidth < MOBILE_FOOTER_MEDIA_QUERY) {
      const mainNavMobile = document.querySelector("#mainNavMobile");
      const marginBottom =
        (mainNavMobile?.clientHeight ?? 0) + MIN_MARGIN_BOTTOM;

      mainRef.current.style.marginBottom = `${marginBottom}px`;
    } else {
      mainRef.current.style.marginBottom = `${MIN_MARGIN_BOTTOM}px`;
    }
  }

  useEffect(() => {
    if (
      matches.some(
        (match) =>
          match.id === "routes/public-health-alerts/$" ||
          match.id.startsWith("routes/user") ||
          match.id.startsWith("routes/settings"),
      )
    ) {
      setBgColor(PAGE_CLASSES.BGCOLOR.LIGHT_CREAM);
    } else {
      setBgColor(PAGE_CLASSES.BGCOLOR.DEFAULT);
    }
  }, [location.pathname, matches]);

  return (
    <>
      <div
        className={
          className
            ? className
            : classNames(
                "flex min-h-full flex-col justify-between",
                bgColor,
                // header.display ? "pt-[6.25rem]" : "pt-0",
              )
        }
      >
        {header.display && <Header />}
        <main
          ref={mainRef}
          className={classNamesOverride("relative mb-[3.125rem] flex-1", main)}
        >
          <article
            className={classNamesOverride(
              "flex h-full flex-wrap justify-center px-5",
              article,
            )}
          >
            {children}
          </article>
        </main>
        {footer.display && <Footer />}
      </div>
    </>
  );
};

export default Page;
