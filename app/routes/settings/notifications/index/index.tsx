import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { Link, useLocation } from "@remix-run/react";
import _ from "lodash";
import { defaultNotificationSettings } from "~/models/notifications.model";
import { classNames } from "~/utilities/main";

export default function SettingsNotifications() {
  const location = useLocation();

  return (
    <ul>
      {Object.entries(defaultNotificationSettings).map(([key], index) => (
        <li key={key}>
          <SettingsNotificationsLink
            title={key}
            to={`${location.pathname}/${_.kebabCase(key)}`}
            className={
              index === Object.keys(defaultNotificationSettings).length - 1
                ? "!border-b-0"
                : ""
            }
          />
        </li>
      ))}
    </ul>
  );
}

export function SettingsNotificationsLink({
  title,
  subtitle,
  to,
  className,
}: {
  title: string;
  subtitle?: string;
  to: string;
  className?: string;
}) {
  return (
    <Link
      className={classNames(
        className || "",
        "flex w-full items-center justify-between gap-5 border-b border-solid border-chw-black-shadows bg-chw-floral-white py-4 text-base font-semibold text-chw-dark-green",
        "transition duration-300 ease-in-out hover:border-chw-light-purple hover:text-chw-light-purple",
        "focus:border-chw-light-purple focus:ring-chw-light-purple disabled:pointer-events-none disabled:opacity-25",
      )}
      to={to}
    >
      <div className="flex flex-col gap-0">
        <h3>{title}</h3>
        {subtitle && (
          <p className="text-sm font-normal text-[#686867]">{subtitle}</p>
        )}
      </div>

      <ArrowRightIcon className="h-5 w-5" />
    </Link>
  );
}
