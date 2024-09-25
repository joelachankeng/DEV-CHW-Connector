import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import { Link } from "@remix-run/react";
import { classNames } from "~/utilities/main";
import type { iContextMenuProps } from "../ContextMenu";
import ContextMenu from "../ContextMenu";
import { MessageNotificationCount } from "../Header/Header";
import Avatar from "../User/Avatar";
import { DateTime } from "luxon";

export default function MessageThreadPreview({
  avatar,
  profileLink,
  name,
  dateTime,
  previewMessage,
  className,
  isUnRead,
  unReadcount,
}: {
  avatar: string;
  profileLink: string;
  name: string;
  dateTime: string;
  previewMessage: string;
  className?: string;
  isUnRead: boolean;
  unReadcount?: number;
}) {
  const contextMenu = createMessageContextMenu(
    profileLink,
    () => {},
    () => {},
    () => {},
    () => {},
  );

  return (
    <div
      className={classNames(
        "relative flex gap-2.5 border-solid border-b-[#C1BAB4] px-0 py-5",
        "after:absolute after:-left-5 after:top-0 after:z-[-1] after:h-full after:w-[calc(100%_+_50px)] after:bg-transparent after:content-['']",
        "after:transition-all after:duration-300 after:ease-in-out",
        "hover:after:bg-[#FFFAF3]",
        className || "",
      )}
    >
      <Link
        to={profileLink}
        className="absolute left-0 top-0 h-full w-full cursor-pointer"
      >
        <span className="sr-only">View profile</span>
      </Link>
      <div className="h-[4.5rem] w-[4.5rem] min-w-[4.5rem]">
        <Avatar src={avatar} alt={name} />
      </div>
      <div className="">
        <div className="flex flex-col">
          <h2 className="font-semibold text-[#032525]">{name}</h2>
          <p className="text-sm text-[#686867]">
            <time dateTime={dateTime}>
              {DateTime.fromISO(dateTime).toLocaleString(
                DateTime.DATETIME_SHORT,
              )}
            </time>
          </p>
        </div>
        <p
          className={classNames(
            "overflow-hidden text-sm leading-[18px] text-[#032525]",
            "line-clamp-2",
            isUnRead ? "font-semibold" : "",
          )}
        >
          {previewMessage}
        </p>
      </div>
      <div className="relative flex flex-1 flex-col items-end justify-between gap-2">
        <ContextMenu
          button={
            <span className="z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#686867] transition duration-300 ease-in-out group-hover:bg-[#625DA6] group-hover:text-white">
              <EllipsisHorizontalIcon className="h-4 w-4" />
            </span>
          }
          items={contextMenu}
        />
        {isUnRead && unReadcount !== undefined && (
          <MessageNotificationCount
            className="!relative !bottom-0 !left-0 !right-0 !top-0"
            count={unReadcount}
          />
        )}
      </div>
    </div>
  );
}

export function createMessageContextMenu(
  profileLink: string,
  onMarkAsRead: undefined | (() => void),
  onDeleteAll: undefined | (() => void),
  onBlock: () => void,
  onReport: () => void,
): iContextMenuProps["items"] {
  const button = (text: string): JSX.Element => (
    <div
      className={classNames(
        "flex w-full cursor-pointer items-center gap-2 px-5 py-3 font-semibold transition duration-300 ease-in-out",
        "whitespace-nowrap",
        "text-[#686867] hover:bg-chw-light-purple hover:text-white",
      )}
    >
      {text}
    </div>
  );

  const items: iContextMenuProps["items"] = [
    [{ element: "View profile", link: profileLink }],
    // [
    //   { element: button("Block"), onClick: onBlock },

    //   { element: button("Report"), onClick: onReport },
    // ],
  ];

  // if (onMarkAsRead !== undefined) {
  //   items[0].unshift({
  //     element: button("Mark as read"),
  //     onClick: onMarkAsRead,
  //   });
  // }
  // if (onDeleteAll !== undefined) {
  //   items[1].unshift({
  //     element: button("Delete all messages"),
  //     onClick: onDeleteAll,
  //   });
  // }

  return items;
}
