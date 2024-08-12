import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faCircleExclamation,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { classNames } from "~/utilities/main";

type iAlertProps = {
  type: "error" | "warning" | "success";
  title: string;
  className?: string;
  children?: ReactNode;
};

export const Alert = ({ children, title, className, type }: iAlertProps) => {
  const getIcon = () => {
    switch (type) {
      case "error":
        return (
          <FontAwesomeIcon
            icon={faXmarkCircle}
            className="h-5 w-5 text-red-400"
            aria-hidden="true"
          />
        );
      case "warning":
        return (
          <FontAwesomeIcon
            icon={faCircleExclamation}
            className="h-5 w-5 text-yellow-400"
            aria-hidden="true"
          />
        );

      default:
        return (
          <FontAwesomeIcon
            icon={faCheckCircle}
            className="h-5 w-5 text-green-400"
            aria-hidden="true"
          />
        );
    }
  };

  const allClasses = {
    error: {
      bg: "bg-red-50",
      textBold: "text-red-800",
      text: "text-red-700",
    },
    warning: {
      bg: "bg-yellow-50",
      textBold: "text-yellow-800",
      text: "text-yellow-700",
    },
    success: {
      bg: "bg-green-50",
      textBold: "text-green-800",
      text: "text-green-700",
    },
  };

  return (
    <div
      className={classNames(
        `rounded-md ${allClasses[type].bg} p-4`,
        className ?? "",
      )}
    >
      <div className="flex">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${allClasses[type].textBold}`}>
            {title}
          </h3>
          <div className={`mt-2 text-sm ${allClasses[type].text}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
