import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { classNamesOverride, iClassNamesOverride } from "~/utilities/main";
import MenuItemsList, { iMenuItemsListItems } from "./MenuItemsList";

export type iMenuDropDownProps = {
  classes?: {
    parent?: iClassNamesOverride;
    container?: iClassNamesOverride;
    button?: iClassNamesOverride;
    menu?: iClassNamesOverride;
  };
  button: string | JSX.Element;
  items: iMenuItemsListItems[][];
};

export default function MenuDropDown({
  classes,
  button,
  items,
}: iMenuDropDownProps) {
  return (
    <div className={classNamesOverride("text-right group", classes?.parent)}>
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
              "z-20 absolute right-0 mt-2 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none",
              classes?.menu,
            )}
          >
            <MenuItemsList items={items} />
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
