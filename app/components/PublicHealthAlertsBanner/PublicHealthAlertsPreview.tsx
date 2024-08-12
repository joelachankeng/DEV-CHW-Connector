import { iWP_PublicHealthAlert } from "~/models/publicHealthAlert.model";
import {
  PublicHealthAlertsBannerClasses,
  PublicHealthAlertsBannerContent,
} from "./PublicHealthAlertsBanner";
import { classNames } from "~/utilities/main";

export default function PublicHealthAlertsPreview({
  alert,
  className,
}: {
  alert: iWP_PublicHealthAlert;
  className?: string;
}) {
  return (
    <div
      className={classNames(
        PublicHealthAlertsBannerClasses.container,
        "!relative !top-0",
        className ?? "",
      )}
    >
      <PublicHealthAlertsBannerContent alert={alert} />
    </div>
  );
}
