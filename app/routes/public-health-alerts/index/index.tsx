import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useRef, useState } from "react";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import PublicHealthAlertsPreview from "~/components/PublicHealthAlertsBanner/PublicHealthAlertsPreview";
import { APP_CLASSNAMES } from "~/constants";
import type { iWP_PublicHealthAlert_Pagination } from "~/controllers/publicHealthAlert.control";
import { PublicHealthAlert } from "~/controllers/publicHealthAlert.control";
import type { iGenericError } from "~/models/appContext.model";
import type { iWP_PublicHealthAlert } from "~/models/publicHealthAlert.model";
import { requireUserSession } from "~/servers/userSession.server";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import { usePagination } from "~/utilities/hooks/usePagination";
import { classNames } from "~/utilities/main";

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserSession(request);
  const alerts = await PublicHealthAlert.API.getAlerts();
  return {
    alerts: alerts instanceof Error ? { nodes: [] } : alerts,
  };
};

export default function PublicHealthAlerts() {
  const { alerts: loaderAlerts } = useLoaderData() as {
    alerts: iWP_PublicHealthAlert_Pagination;
  };
  const paginationContainerRef = useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [alerts, setAlerts] = useState<iWP_PublicHealthAlert[] | null>(
    loaderAlerts.nodes,
  );

  const { state: alertsFetchState, submit: alertsFetchSubmit } = useAutoFetcher<
    iWP_PublicHealthAlert_Pagination | iGenericError
  >(
    "/api/public-health-alerts/getAll",
    (data: iWP_PublicHealthAlert_Pagination | iGenericError) => {
      if (!mounted) setMounted(true);
      if ("error" in data) {
        return;
      }

      if (pagination.isLoading) {
        setPagination({
          isLoading: false,
          pageInfo: data.pageInfo,
        });
        setAlerts([...(alerts || []), ...data.nodes]);
      } else {
        setPagination({
          isLoading: false,
          pageInfo: data.pageInfo,
        });
        setAlerts(data.nodes);
      }
    },
  );

  const { pagination, setPagination, LoadMoreButton } = usePagination(
    paginationContainerRef,
    () => {
      if (alertsFetchState !== "idle" || !pagination.pageInfo) {
        return;
      }
      alertsFetchSubmit(
        {
          after: pagination.pageInfo.endCursor,
        },
        "POST",
      );
    },
    {
      pageInfo: loaderAlerts.pageInfo,
    },
  );

  return (
    <>
      <div
        ref={paginationContainerRef}
        className={classNames(APP_CLASSNAMES.CONTAINER, "max-md:!-mt-5")}
      >
        {alerts?.map((alert, index) => (
          <PublicHealthAlertsPreview
            key={alert.databaseId}
            alert={alert}
            className={index !== 0 ? "!mt-0" : ""}
          />
        ))}
      </div>
      <div className="mx-auto my-1 flex flex-col items-center justify-center">
        {alertsFetchState !== "idle" ? (
          <LoadingSpinner className="cursor-progress" />
        ) : (
          <>
            {pagination.pageInfo &&
              (pagination.pageInfo.hasNextPage ? (
                <LoadMoreButton />
              ) : (
                <p className="text-center">You reached the end of the alerts</p>
              ))}
          </>
        )}
      </div>
    </>
  );
}
