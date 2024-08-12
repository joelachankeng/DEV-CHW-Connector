import { Menu } from "@headlessui/react";
import { Link } from "@remix-run/react";
import { classNames } from "~/utilities/main";
import MenuItemAccordion from "./MenuItemAccordion";

export type iMenuItemsListProps = {
  items: iMenuItemsListItems[][];
  itemClassName?: string;
  containerClassName?: string;
};

export type iMenuItemsListItems = {
  text: string;
  link: string;
  icon?: JSX.Element;
  child?: {
    text: string;
    link: string;
  }[];
};

export default function MenuItemsList({
  items,
  itemClassName,
  containerClassName = "px-1 py-1",
}: iMenuItemsListProps) {
  const computedLinkClassName = (active: boolean): string => {
    return classNames(
      active ? "bg-chw-light-purple text-[#625da6]" : "text-[#686867]",
      "group/menuItem gap-2 flex w-full items-center rounded-md px-4 py-2",
      "font-semibold hover:text-[#625da6] transition duration-300 ease-in-out",
    );
  };

  const computedTextClassName = (active: boolean): string => {
    return classNames(
      active ? "text-[#032525]" : "text-[#686867]",
      "whitespace-nowrap group-hover/menuItem:text-[#032525]",
    );
  };

  return (
    <>
      {items.map((item, index) => (
        <div key={index} className={containerClassName}>
          {item.map((subItem, subIndex) => (
            <Menu.Item key={subIndex}>
              {({ active }) => (
                <>
                  {subItem.child && subItem.child.length > 0 ? (
                    <MenuItemAccordion
                      item={subItem}
                      active={active}
                      linkClassName={classNames(
                        computedLinkClassName(active),
                        itemClassName || "",
                      )}
                      textClassName={computedTextClassName(active)}
                    />
                  ) : (
                    <Link
                      to={subItem.link}
                      className={classNames(
                        computedLinkClassName(active),
                        itemClassName || "",
                      )}
                    >
                      {subItem.icon && (
                        <span className="h-8 w-8">{subItem.icon}</span>
                      )}
                      <span className={computedTextClassName(active)}>
                        {subItem.text}
                      </span>
                    </Link>
                  )}
                </>
              )}
            </Menu.Item>
          ))}
        </div>
      ))}
    </>
  );
}
