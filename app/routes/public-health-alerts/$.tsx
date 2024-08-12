import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { publicHealthAlert } from "~/controllers/publicHealthAlert.control";
import type { iWP_PublicHealthAlert } from "~/models/publicHealthAlert.model";
import PublicHealthAlert from "~/components/PublicHealthAlertsBanner/PublicHealthAlerts";
import { ErrorComponent } from "~/components/Pages/ErrorPage";
import type { iGenericError } from "~/models/appContext.model";

type iLoaderData = {
  alert: iWP_PublicHealthAlert | undefined | null | iGenericError;
};

export const loader: LoaderFunction = async ({
  request,
  params,
}): Promise<ReturnType<typeof json<iLoaderData>>> => {
  const paramId = params["*"];

  const alertId = parseInt(paramId ?? "-1");

  const alert = await publicHealthAlert.API.getAlert(alertId);

  return json({
    alert:
      alert instanceof Error
        ? {
            error: alert.message,
          }
        : alert,
  });
};
export default function SinglePublicHealthAlert() {
  const { alert } = useLoaderData<iLoaderData>();

  if (alert === undefined || alert === null || "error" in alert) {
    return (
      <ErrorComponent
        title={"Public Health Alert not found"}
        description={
          "The Public Health Alert you are looking for does not exist or has been deleted."
        }
        status={"404"}
        className="max-tablet-lg:!min-h-0"
      />
    );
  }

  return (
    <>
      <div className="max-md:-mx-5 max-md:-mt-5">
        <PublicHealthAlert
          className="max-md:!border-none max-md:!bg-transparent"
          alert={alert}
        />
      </div>
    </>
  );
}
