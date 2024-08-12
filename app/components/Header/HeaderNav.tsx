import { Link } from "@remix-run/react";
import { classNames } from "~/utilities/main";

export type iHeaderNav = {
  id: string;
  parent?: {
    className?: string;
    [key: string]: any;
  };
  ul: {
    className?: string;
    [key: string]: any;
  };
  li?: {
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

export default function HeaderNav({
  id,
  parent = {
    className: "",
  },
  ul = {
    className: "flex items-stretch",
  },
  li = {
    className: "",
  },
  items,
}: iHeaderNav) {
  return (
    <>
      <nav
        role="navigation"
        itemScope
        itemType="http://schema.org/SiteNavigationElement"
        className={parent.className}
        id={id}
        {...parent}
      >
        <ul role="menubar" className={ul.className} {...ul}>
          {items.map((link, index) => (
            <li
              key={`${id}-${index}-${link.url}`}
              className={classNames(
                "group flex h-full w-full items-center justify-center text-center after:absolute after:bottom-0 after:h-1 after:w-full after:bg-[#625DA6] after:content-['']",
                "pb-0 transition duration-300 ease-in-out",
                "hover:text-chw-dark-purple hover:after:bg-chw-yellow-100 hover:after:opacity-100",
                link.active ? "text-[#625DA6]" : "after:opacity-0",
                li.className || "",
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
                        "flex flex-col items-center justify-center",
                        link.className || "",
                      )}
                      itemProp="url"
                      role="menuitem"
                    >
                      <div
                        className={classNames(
                          "mb-[5px] h-8 w-8 transition duration-300 ease-in-out max-md:h-6",
                          "group-hover:text-inherit",
                          link.active ? "text-[#625da6]" : "text-[#686867]",
                          "max-md:mb-0",
                        )}
                      >
                        {link.icon}
                      </div>
                      <span
                        className={classNames(
                          "text-xs font-bold transition duration-300 ease-in-out",
                          "group-hover:text-inherit",
                          link.active ? "text-[#032525]" : "text-[#686867]",
                        )}
                      >
                        {link.title}
                      </span>
                    </Link>
                  </>
                )}
              </>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
