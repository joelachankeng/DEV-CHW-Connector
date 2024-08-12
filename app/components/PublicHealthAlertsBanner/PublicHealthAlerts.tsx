import { DateTime } from "luxon";
import type { iWP_PublicHealthAlert } from "~/models/publicHealthAlert.model";
import { classNames } from "~/utilities/main";

export default function PublicHealthAlert({
  alert,
  className,
}: {
  alert: iWP_PublicHealthAlert;
  className?: string;
}) {
  const getDate = (): string => {
    if (!alert.date) return "";
    const formatDate = DateTime.fromISO(alert.date).toLocaleString(
      DateTime.DATETIME_SHORT,
    );
    return " - " + formatDate;
  };
  return (
    <div
      className={classNames(
        "flex w-full flex-col gap-5 rounded-[10px] border border-solid border-[#E8E0D6] bg-white p-5 transition-all duration-300 ease-in-out",
        className ?? "",
      )}
    >
      <div className="text-[#032525 text-base font-semibold leading-[18px] [&_p+p]:mt-2.5">
        <p>
          <span className="font-bold">ALERT{getDate()}:</span>
          {` `}
          {alert.title}
        </p>
      </div>
      <div
        className={classNames("html-formatted-content")}
        dangerouslySetInnerHTML={{ __html: alert.content }}
      ></div>
    </div>
  );
}
