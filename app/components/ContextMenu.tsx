import { Menu, Transition } from "@headlessui/react";
import { Link } from "@remix-run/react";
import { Fragment } from "react";
import type { iClassNamesOverride } from "~/utilities/main";
import { classNames, classNamesOverride } from "~/utilities/main";

export type iContextMenuProps = {
  classes?: {
    parent?: iClassNamesOverride;
    container?: iClassNamesOverride;
    button?: iClassNamesOverride;
    menu?: iClassNamesOverride;
  };
  button: string | JSX.Element;
  items: {
    element: string | JSX.Element;
    link?: string;
    onClick?: () => void;
    active?: boolean;
  }[][];
};

export default function ContextMenu({
  classes,
  button,
  items,
}: iContextMenuProps) {
  return (
    <div className={classNamesOverride("group text-right", classes?.parent)}>
      <Menu
        as="div"
        className={classNamesOverride(
          "relative inline-block text-left",
          classes?.container,
        )}
      >
        <div>
          <Menu.Button
            className={classNamesOverride(
              "inline-flex w-full justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75",
              classes?.button,
            )}
          >
            {button}
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items
            className={classNamesOverride(
              "absolute right-0 z-20 mt-2 origin-top-right divide-y divide-gray-100 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none",
              classes?.menu,
            )}
          >
            {items.map((item, index) => (
              <div key={index} className="overflow-hidden">
                {item.map((subItem, subIndex) => (
                  <Menu.Item key={subIndex}>
                    {({ active }) => (
                      <>
                        {typeof subItem.link === "string" ? (
                          <>
                            <Link
                              to={subItem.link}
                              className={classNames(
                                "flex w-full items-center gap-2 px-5 py-3 font-semibold transition duration-300 ease-in-out",
                                "whitespace-nowrap",
                                subItem.active
                                  ? "bg-chw-dark-purple text-white"
                                  : "text-[#686867] hover:bg-chw-light-purple hover:text-white",
                              )}
                            >
                              {subItem.element}
                            </Link>
                          </>
                        ) : (
                          <>{subItem.element}</>
                        )}
                      </>
                    )}
                  </Menu.Item>
                ))}
              </div>
            ))}
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
