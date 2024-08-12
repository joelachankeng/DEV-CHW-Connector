import { iMenuItemsListItems } from "./MenuItemsList";
import SVGTerms from "~/assets/SVGs/SVGTerms";
import Accordion from "../Accordion";
import { APP_ROUTES } from "~/constants";
import { Link } from "@remix-run/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { classNames } from "~/utilities/main";
import { useState } from "react";

export default function MenuItemAccordion({
  item,
  active,
  linkClassName,
  textClassName,
}: {
  item: iMenuItemsListItems;
  active: boolean;
  linkClassName: string;
  textClassName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Accordion
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      classnames={{
        parent: "",
        button: linkClassName,
      }}
      buttonInner={
        <>
          {item.icon && (
            <span
              className={classNames("h-8 w-8", isOpen ? "!text-[#625da6]" : "")}
            >
              {item.icon}
            </span>
          )}
          <span className="flex items-center gap-2">
            <span
              className={classNames(
                textClassName,
                isOpen ? "!text-[#032525]" : "",
              )}
            >
              {item.text}
            </span>
            <ChevronDownIcon
              className={classNames(
                "h-6 w-6 text-[#686867] group-hover:text-[#032525] transition duration-300 ease-in-out",
                isOpen
                  ? "transform rotate-180 mt-0 !text-[#032525]"
                  : "-mt-[.1875rem]",
              )}
            />
          </span>
        </>
      }
    >
      <ul className="text-sm font-semibold flex flex-col gap-6 whitespace-nowrap ml-[2.5rem] my-1.5">
        {item.child?.map((link, index) => (
          <li key={`MenuItemAccordion-${index}-${link.link}`}>
            <Link
              className="text-[#686867] hover:text-chw-light-purple transition duration-300 ease-in-out"
              to={link.link}
            >
              {link.text}
            </Link>
          </li>
        ))}
      </ul>
    </Accordion>
  );
}
