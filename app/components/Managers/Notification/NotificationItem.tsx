import { Transition } from "@headlessui/react";
import { useEffect, useRef, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import AlertMP3 from "~/assets/Audio/alert.mp3";
import AlertError from "~/assets/Audio/alert-error.mp3";
import NotificationItemGeneral from "./Items/NotificationItemGeneral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  IconDefinition,
  faBell,
  faCheckCircle,
  faCircleExclamation,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { classNames } from "~/utilities/main";
import SVGAvatar from "~/assets/SVGs/SVGAvatar";
import Avatar from "~/components/User/Avatar";
import { Link } from "@remix-run/react";
import { DateTime } from "luxon";

const DEFAULT_TIMEOUT = 5;

export type iNotificationTypes =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "message"
  | "user interaction";

export type iNotificationItem_General = {
  type: "success" | "error" | "warning" | "info";
  message: string;
  time: string;
};

export type iNotificationItem_UserInteraction = {
  type: "user interaction" | "message";
  avatarURL?: string;
  userURL: string;
  name: string;
  actionType: "comment" | "react" | "message" | "reply";
  contentURL: string;
  time: string;
  message: string;
};

export default function NotificationItem({
  timeOut = DEFAULT_TIMEOUT,
  onDelete,
  onClickDelete,
  playSound = true,
  data,
}: {
  timeOut?: number | boolean;
  onDelete?: () => void;
  onClickDelete?: () => void;
  playSound?: boolean;
  data: iNotificationItem_General | iNotificationItem_UserInteraction;
}) {
  const element = useRef<HTMLDivElement>(null);
  const transitionDuration = 300;
  const _timeOut = initializetimeOut(timeOut);

  const [isShowing, setIsShowing] = useState(true);
  const [timeLeft, setTimeLeft] = useState(_timeOut);

  const isHovering = useRef(false);
  const startTimer = useRef(false);
  const timeAgo = useRef(DateTime.fromISO(data.time).toRelative());

  useEffect(() => {
    if (playSound === false) return;
    if (startTimer.current === true) return;

    if (data.type === "error") {
      const AudioAlert = new Audio(AlertError);
      AudioAlert.volume = 0.5;
      AudioAlert.play().catch((err) => console.error(err));
    } else {
      const AudioAlert = new Audio(AlertMP3);
      AudioAlert.volume = 0.5;
      AudioAlert.play().catch((err) => console.error(err));
    }
  }, []);

  useEffect(() => {
    setIsShowing(true);

    if (_timeOut === -1) return;
    startTimer.current = true;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (startTimer.current === false) return;
      setTimeLeft((prev) => prev - 1);
      timeAgo.current = DateTime.fromISO(data.time).toRelative();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (startTimer.current === false) return;
    if (timeLeft <= 0) {
      if (isHovering.current === true) {
        setTimeLeft(_timeOut);
        return;
      }
      startTimer.current = false;
      setIsShowing(false);
      triggerOnDelete();
    }
  }, [timeLeft, startTimer.current, isHovering.current]);

  function initializetimeOut(timeOut: number | boolean): number {
    if (typeof timeOut === "number") return timeOut;
    if (timeOut === false) return -1;
    return DEFAULT_TIMEOUT;
  }

  function triggerOnDelete(isClicked = false) {
    setTimeout(() => {
      if (isClicked) {
        if (onClickDelete) onClickDelete();
      } else {
        if (onDelete) onDelete();
      }
    }, 300);
  }

  const getIcon = (): {
    icon: IconDefinition;
    color: string;
  } => {
    switch (data.type) {
      case "error":
        return {
          icon: faXmarkCircle,
          color: "text-red-400",
        };
      case "warning":
        return {
          icon: faCircleExclamation,
          color: "text-yellow-400",
        };
      case "info":
        return {
          icon: faBell,
          color: "text-blue-400",
        };

      default:
        return {
          icon: faCheckCircle,
          color: "text-green-400",
        };
    }
  };

  const renderNotificationItem = (): JSX.Element => {
    switch (data.type) {
      case "message":
        return (
          <NotificationItemGeneral
            icon={
              <div
                className={classNames(
                  "relative flex h-full w-full items-center justify-center",
                )}
              >
                <div className="text[#e8e0d6] h-full w-full overflow-hidden rounded-full border border-transparent transition duration-300 ease-in-out hover:border-[3px] hover:border-chw-light-purple">
                  <Link to={data.userURL}>
                    <Avatar alt={data.name} src={data.avatarURL} />
                    <span className="absolute -bottom-1 right-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-chw-yellow">
                      <svg
                        className="h-4 w-4 text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 18"
                        fill="currentColor"
                      >
                        <path
                          d="M18 4H16V9C16 10.0609 15.5786 11.0783 14.8284 11.8284C14.0783 12.5786 13.0609 13 12 13H9L6.846 14.615C7.17993 14.8628 7.58418 14.9977 8 15H11.667L15.4 17.8C15.5731 17.9298 15.7836 18 16 18C16.2652 18 16.5196 17.8946 16.7071 17.7071C16.8946 17.5196 17 17.2652 17 17V15H18C18.5304 15 19.0391 14.7893 19.4142 14.4142C19.7893 14.0391 20 13.5304 20 13V6C20 5.46957 19.7893 4.96086 19.4142 4.58579C19.0391 4.21071 18.5304 4 18 4Z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M12 0H2C1.46957 0 0.960859 0.210714 0.585786 0.585786C0.210714 0.960859 0 1.46957 0 2V9C0 9.53043 0.210714 10.0391 0.585786 10.4142C0.960859 10.7893 1.46957 11 2 11H3V13C3 13.1857 3.05171 13.3678 3.14935 13.5257C3.24698 13.6837 3.38668 13.8114 3.55279 13.8944C3.71889 13.9775 3.90484 14.0126 4.08981 13.996C4.27477 13.9793 4.45143 13.9114 4.6 13.8L8.333 11H12C12.5304 11 13.0391 10.7893 13.4142 10.4142C13.7893 10.0391 14 9.53043 14 9V2C14 1.46957 13.7893 0.960859 13.4142 0.585786C13.0391 0.210714 12.5304 0 12 0Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </span>
                  </Link>
                </div>
              </div>
            }
            onClose={() => triggerOnDelete(true)}
          >
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                <Link
                  to={data.userURL}
                  className="font-semibold transition duration-300 ease-in-out hover:underline"
                >
                  {data.name}
                </Link>
              </div>
              <div className="text-sm font-normal">
                <div className="mb-2 line-clamp-2 py-1 text-sm font-normal text-chw-dark-green">
                  {data.message}
                </div>
                <Link
                  to={data.contentURL}
                  onClick={() => triggerOnDelete(true)}
                  className={classNames(
                    "cursor-pointer bg-chw-light-purple text-white hover:bg-chw-dark-purple",
                    "w-full rounded-[40px] border-[none] px-3 py-2 text-center text-xs font-medium transition duration-300 ease-in-out",
                  )}
                >
                  Reply
                </Link>
              </div>
            </div>
          </NotificationItemGeneral>
        );
      case "user interaction": {
        let statement = "commented on your";
        let contentTypeName = "post";

        if (data.actionType === "react") {
          statement = "reacted to your";
          contentTypeName = "post";
        }
        if (data.actionType === "reply") {
          statement = "replied to your";
          contentTypeName = "comment";
        }
        return (
          <NotificationItemGeneral
            icon={
              <div
                className={classNames(
                  "flex h-full w-full items-center justify-center",
                )}
              >
                <div className="text[#e8e0d6] h-full w-full overflow-hidden rounded-full border border-transparent transition duration-300 ease-in-out hover:border-[3px] hover:border-chw-light-purple">
                  <Link to={data.userURL}>
                    <Avatar alt={data.name} src={data.avatarURL} />
                  </Link>
                </div>
              </div>
            }
            onClose={() => triggerOnDelete(true)}
          >
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                <Link
                  to={data.userURL}
                  className="font-semibold transition duration-300 ease-in-out hover:underline"
                >
                  {data.name}
                </Link>
              </div>
              <div className="text-sm font-normal">
                {statement}{" "}
                <Link
                  to={data.contentURL}
                  onClick={() => triggerOnDelete(true)}
                  className="font-semibold text-chw-light-purple transition duration-300 ease-in-out hover:underline"
                >
                  {contentTypeName}
                </Link>
              </div>
              <span className="text-xs font-medium text-chw-dark-green">
                {timeAgo.current}
              </span>
            </div>
          </NotificationItemGeneral>
        );
      }
      default:
        return (
          <NotificationItemGeneral
            icon={
              <div
                className={classNames(
                  "flex h-full w-full items-center justify-center rounded-lg",
                  data.type === "success" ? "bg-green-100" : "",
                  data.type === "error" ? "bg-red-100" : "",
                  data.type === "warning" ? "bg-yellow-100" : "",
                  data.type === "info" ? "bg-blue-100" : "",
                )}
              >
                <FontAwesomeIcon
                  icon={getIcon().icon}
                  className={classNames("h-6 w-6", getIcon().color)}
                  aria-hidden="true"
                />
              </div>
            }
            onClose={() => triggerOnDelete(true)}
          >
            {data.message}
          </NotificationItemGeneral>
        );
    }
  };

  return (
    <>
      <Transition
        show={isShowing}
        as={Fragment}
        enter={`transform ease-out duration-${transitionDuration} transition`}
        enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enterTo="translate-y-0 opacity-100 sm:translate-x-0"
        leave={`transition ease-in duration-${transitionDuration}`}
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          ref={element}
          onMouseOver={() => (isHovering.current = true)}
          onMouseLeave={() => (isHovering.current = false)}
        >
          {renderNotificationItem()}
        </div>
      </Transition>
    </>
  );
}
