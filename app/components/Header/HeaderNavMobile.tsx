import { Link } from "@remix-run/react";
import { classNames } from "~/utilities/main";
import { SlickSlider, iSliderRef } from "../SlickSlider";
import { useEffect, useRef, useState } from "react";

export type iHeaderNav = {
  id: string;
  parent?: {
    className?: string;
    [key: string]: any;
  };
  slider?: {
    className?: string;
  };
  menuItems?: {
    className?: string;
  };
  items: {
    title: string;
    url: string;
    icon: JSX.Element;
    active?: boolean;
    custom?: JSX.Element;
    className?: string;
  }[];
};

export default function HeaderNavMobile({
  id,
  parent = {
    className: "",
  },
  slider = {
    className: "justify-center mx-auto",
  },
  menuItems = {
    className: "",
  },
  items,
}: iHeaderNav) {
  const sliderRef = useRef<iSliderRef | undefined>(undefined);
  const [mediaWidth, setMediaWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    setMediaWidth(window.innerWidth);
    window.addEventListener("resize", () => setMediaWidth(window.innerWidth));

    return () =>
      window.removeEventListener("resize", () =>
        setMediaWidth(window.innerWidth),
      );
  }, []);

  return (
    <>
      <nav
        role="navigation"
        itemScope
        itemType="http://schema.org/SiteNavigationElement"
        className={classNames(
          "hidden fixed bg-[#FFF5E5] w-full px-[15px] left-0 bottom-0 shadow-md border-t-2 border-[#C1BAB4] max-lg:flex",
          parent.className || "",
        )}
        id={id}
      >
        <div className="w-full relative">
          <SlickSlider
            className={classNames(
              "mobile-nav-slick-slider",
              slider.className || "",
            )}
            sliderRef={sliderRef}
            settings={{
              initialSlide:
                mediaWidth && mediaWidth <= 500
                  ? items.findIndex((item) => item.active)
                  : 0,
              infinite: false,
              speed: 500,
              slidesToShow: 5,
              slidesToScroll: 5,
              responsive: [
                {
                  breakpoint: 500,
                  settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                  },
                },
                {
                  breakpoint: 400,
                  settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                  },
                },
              ],
            }}
          >
            {items.map((link, index) => (
              <div
                key={`${id}-${index}-${link.url}`}
                onClick={() => {}}
                className={classNames(
                  "group flex justify-center items-center text-center h-full w-full after:w-full after:h-1 after:bg-[#625DA6] after:absolute after:content-[''] after:-top-0 after:left-0",
                  "transition duration-300 ease-in-out pt-1 pb-3",
                  "hover:after:opacity-100 hover:after:bg-chw-yellow-100 hover:text-chw-dark-purple",
                  link.active ? "text-[#625DA6]" : "after:opacity-0",
                  menuItems.className || "",
                )}
              >
                <>
                  {link.custom && link.custom ? (
                    link.custom
                  ) : (
                    <>
                      <Link
                        to={link.url}
                        className={classNames(
                          "flex flex-col justify-center items-center",
                          link.className || "",
                        )}
                        itemProp="url"
                        role="menuitem"
                      >
                        <div
                          className={classNames(
                            "h-8 w-8 mb-[5px] transition duration-300 ease-in-out",
                            "group-hover:text-inherit",
                            link.active ? "text-[#625da6]" : "text-[#686867]",
                            "max-md:mb-0",
                          )}
                        >
                          {link.icon}
                        </div>
                        <span
                          className={classNames(
                            "text-xs font-semibold transition duration-300 ease-in-out",
                            "group-hover:text-inherit",
                            link.active
                              ? "text-[#032525] font-bold"
                              : "text-[#686867]",
                          )}
                        >
                          {link.title}
                        </span>{" "}
                      </Link>
                    </>
                  )}
                </>
              </div>
            ))}
          </SlickSlider>
        </div>
      </nav>
    </>
  );
}
