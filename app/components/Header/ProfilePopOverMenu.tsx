import SVGTerms from "~/assets/SVGs/SVGTerms";
import Accordion from "../Accordion";
import { APP_ROUTES } from "~/constants";
import { Link } from "@remix-run/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { classNames } from "~/utilities/main";
import { useState } from "react";

const menuLinks = [
  {
    title: "Terms of Use",
    url: APP_ROUTES.TERMS_OF_USE,
  },
  {
    title: "Community Guidelines",
    url: APP_ROUTES.COMMUNITY_GUIDELINES,
  },
  {
    title: "Privacy Policy",
    url: APP_ROUTES.PRIVACY_POLICY,
  },
  // {
  //   title: "Accessibility",
  //   url: APP_ROUTES.ACCESSIBILITY,
  // },
];

export default function ProfilePopOverMenu() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Accordion
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      classnames={{
        parent: "px-4 py-2",
        button:
          "group gap-2 flex w-full items-center rounded-md font-semibold text-[#686867] hover:text-[#625da6] transition duration-300 ease-in-out",
      }}
      buttonInner={
        <>
          <span
            className={classNames("h-8 w-8", isOpen ? "text-[#625da6]" : "")}
          >
            <SVGTerms />
          </span>
          <span className="flex items-center gap-2">
            <span
              className={classNames(
                "whitespace-nowrap group-hover:text-[#032525]",
                isOpen ? "text-[#032525]" : "",
              )}
            >
              Terms & Policies
            </span>
            <ChevronDownIcon
              className={classNames(
                "h-6 w-6 text-[#686867] transition duration-300 ease-in-out group-hover:text-[#032525]",
                isOpen ? "mt-0 rotate-180 transform" : "-mt-[.1875rem]",
              )}
            />
          </span>
        </>
      }
    >
      <ul className="ml-[2.5rem] mt-[1.25rem] flex flex-col gap-6 whitespace-nowrap text-sm font-semibold">
        {menuLinks.map((link, index) => (
          <li key={`footerNav-${index}-${link.url}`}>
            <Link
              className="text-[#686867] transition duration-300 ease-in-out hover:text-chw-light-purple"
              to={link.url}
            >
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </Accordion>
  );
}
