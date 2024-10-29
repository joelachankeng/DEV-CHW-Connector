import { Link } from "@remix-run/react";
import { DateTime } from "luxon";
import { useContext, useEffect, useRef, useState } from "react";
import SVGCloseButton from "~/assets/SVGs/SVGCloseButton";
import { APP_ROUTES } from "~/constants";
import { AppContext } from "~/contexts/appContext";
import type { iWP_PublicHealthAlert } from "~/models/publicHealthAlert.model";
import { classNames } from "~/utilities/main";

export const PublicHealthAlertsBannerClasses = {
  container: classNames(
    "flex gap-5 bg-[#FABE46] w-full p-5 rounded-[10px] hover:bg-[#F8D181] transition-all duration-300 ease-in-out sticky top-[7.5rem] z-20",
    "max-md:relative max-md:top-0 max-md:rounded-none max-md:-ml-5 max-md:w-[calc(100%+2.5rem)] max-md:-mt-5",
  ),
};

export default function PublicHealthAlertsBanner({
  alert,
}: {
  alert: iWP_PublicHealthAlert;
}) {
  const { User } = useContext(AppContext);
  const element = useRef<HTMLDivElement>(null);
  const alertSession = useRef<string | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    alertSession.current = sessionStorage.getItem("publicHealthAlertsBanner");

    setMounted(true);
  }, []);

  const handleCloseAlert = () => {
    hideAlert();
    sessionStorage.setItem(
      "publicHealthAlertsBanner",
      alert.databaseId.toString(),
    );

    // wait for the animation to finish before removing the element
    setTimeout(() => {
      closeAlert();
    }, 300);
  };

  function hideAlert() {
    if (!element.current) return;
    const elementHeight = element.current.offsetHeight;
    element.current.style.marginTop = `-${elementHeight}px`;
    element.current.style.transform = "translateY(-200%)";
  }

  function closeAlert() {
    if (!element.current) return;
    element.current.style.display = "none";
    element.current.remove();
  }

  if (!mounted || alertSession.current === alert.databaseId.toString())
    return null;

  if (
    User.user &&
    User.user.userFields.notificationSettings["Mobilization Alerts"][
      "Public Health Alerts"
    ].siteNotifications === false
  )
    return null;

  return (
    <div ref={element} className={PublicHealthAlertsBannerClasses.container}>
      <PublicHealthAlertsBannerContent alert={alert} />
      <div className="">
        <button className="h-5 w-5" onClick={handleCloseAlert}>
          <span className="sr-only">Close Public Health Alert</span>
          <SVGCloseButton
            bgStroke={{ default: "none", hover: "#032525" }}
            stroke={{ default: "#032525", hover: "#fff" }}
            border={{ default: "#032525", hover: "none" }}
          />
        </button>
      </div>
    </div>
  );
}

export function PublicHealthAlertsBannerContent({
  alert,
}: {
  alert: iWP_PublicHealthAlert;
}) {
  const getDate = (): string => {
    if (!alert.date) return "";
    const formatDate = DateTime.fromISO(alert.date).toLocaleString(
      DateTime.DATETIME_SHORT,
    );
    return " - " + formatDate;
  };

  return (
    <div className="text-[#032525 text-base font-semibold leading-[18px] [&_p+p]:mt-2.5">
      <p>
        <span className="font-bold">ALERT{getDate()}:</span>
        {` `}
        {alert.title}
      </p>
      <p>
        <Link
          to={`${APP_ROUTES.PUBLIC_HEALTH_ALERTS}/${alert.databaseId}`}
          prefetch="viewport"
          className="text-chw-dark-green underline transition duration-300 ease-in-out hover:text-chw-dark-purple"
        >
          {alert.publicHealthAlertsField.previewContent}
        </Link>
      </p>
    </div>
  );
}
