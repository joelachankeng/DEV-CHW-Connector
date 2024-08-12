import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import PublicHealthAlertsPreview from "~/components/PublicHealthAlertsBanner/PublicHealthAlertsPreview";
import { APP_CLASSNAMES } from "~/constants";
import { publicHealthAlert } from "~/controllers/publicHealthAlert.control";
import type { iWP_PublicHealthAlerts } from "~/models/publicHealthAlert.model";
import { requireUserSession } from "~/servers/userSession.server";
import { classNames } from "~/utilities/main";

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserSession(request);
  const alerts = await publicHealthAlert.API.getAlerts();

  return {
    alerts: alerts instanceof Error ? { nodes: [] } : alerts,
  };
};
export default function PublicHealthAlerts() {
  const { alerts } = useLoaderData() as { alerts: iWP_PublicHealthAlerts };

  return (
    <>
      <div className={classNames(APP_CLASSNAMES.CONTAINER, "max-md:!-mt-5")}>
        {alerts?.nodes.map((alert, index) => (
          <PublicHealthAlertsPreview
            key={alert.databaseId}
            alert={alert}
            className={index !== 0 ? "!mt-0" : ""}
          />
        ))}
      </div>
    </>
  );
}
