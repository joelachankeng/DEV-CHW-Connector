import { Link, useLocation } from "@remix-run/react";
import { APP_CLASSNAMES, APP_ROUTES } from "~/constants";
import { useMediaSize } from "~/utilities/hooks/useMediaSize";
import { classNames } from "~/utilities/main";

const footerLinks = [
  {
    title: "About",
    url: APP_ROUTES.ABOUT,
  },
  {
    title: "Contact NACHW",
    url: APP_ROUTES.CONTACT,
  },
  // {
  //   title: "Join Now",
  //   url: APP_ROUTES.REGISTER,
  // },
  // {
  //   title: "Sign In",
  //   url: APP_ROUTES.HOME,
  // },
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

const mobileFooterLinks = [
  {
    title: "About",
    url: APP_ROUTES.ABOUT,
  },
  {
    title: "Contact NACHW",
    url: APP_ROUTES.CONTACT,
  },
  // {
  //   title: "Accessibility",
  //   url: APP_ROUTES.ACCESSIBILITY,
  // },
];

export default function Footer() {
  const mediaSize = useMediaSize();
  const location = useLocation();

  const currentMenu =
    mediaSize === undefined
      ? footerLinks
      : mediaSize.width >= 1024
        ? footerLinks
        : mobileFooterLinks;

  return (
    <>
      <footer
        className={classNames(
          "z-[99] border-t border-solid border-t-chw-black-shadows bg-chw-cream-01 px-5 py-[18px]",
          location.pathname === APP_ROUTES.HOME ? "" : "max-lg:hidden",
        )}
      >
        <div className={APP_CLASSNAMES.CONTAINER_FULLWIDTH}>
          <div className="flex items-center justify-between gap-4 max-md:mx-auto max-md:max-w-[26rem] max-md:flex-wrap max-md:justify-center max-md:text-center">
            <a
              href="https://nachw.org/"
              target="_blank"
              className="block h-10 w-[120px]"
              rel="noreferrer"
            >
              <img
                src="/assets/nachw-logo.png"
                alt="Visit NACHW main Website"
                className="h-full w-full object-contain"
              />
            </a>
            <nav className="flex-1 text-xs font-semibold text-chw-dim-gray">
              <ul className="flex items-center justify-center gap-[1.25rem]">
                {currentMenu.map((link, index) => (
                  <li
                    key={`footerNav-${index}-${link.url}`}
                    className={classNames(
                      index === 3
                        ? "flex items-center after:ml-[2.5rem] after:mr-[1.25rem] after:block after:h-[1.4rem] after:w-[1px] after:bg-chw-black-shadows after:content-['']"
                        : "",
                      // index >= 3 ? "max-md:hidden" : "",
                    )}
                  >
                    <Link
                      className={
                        "transition duration-300 ease-in-out hover:text-chw-light-purple"
                      }
                      to={link.url}
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="text-[10px] font-normal text-chw-dark-green max-md:w-full">
              &copy; National Association of Community Health Workers (NACHW){" "}
              {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
