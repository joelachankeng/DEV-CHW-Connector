import { Link } from "@remix-run/react";
import { NotFound } from "~/components/NotFound";
import Page from "./Page";
import { APP_ROUTES } from "~/constants";
import type { iGenericError } from "~/models/appContext.model";

type ErrorPageProps = {
  title?: string;
  description?: string;
  status?: string;
  className?: string;
};

export const ErrorPage = ({ title, description, status }: ErrorPageProps) => {
  return (
    <Page>
      <ErrorComponent title={title} description={description} status={status} />
    </Page>
  );
};

export const ErrorPageGeneric = ({
  error,
  dataType = "Page",
  status,
}: {
  error: iGenericError | undefined | null;
  dataType?: string;
  status?: string;
}) => {
  const newProps = {
    title: `${dataType} not found`,
    description: `Sorry, we couldn't find the ${dataType.toLowerCase()} you're looking for.`,
    status: "404",
  };

  if (error) {
    newProps.title = error.error || "An error occurred";
    newProps.description =
      error.error_description ||
      "An unexpected error occurred. Please try again later.";
    newProps.status = "500";
  }

  return (
    <Page>
      <ErrorComponent
        title={newProps.title}
        description={newProps.description}
        status={status || newProps.status}
      />
    </Page>
  );
};

export function ErrorComponent({
  title,
  description,
  status,
  className,
}: ErrorPageProps) {
  return (
    <NotFound
      title={title}
      subtitle={description}
      status={status}
      className={className}
    >
      <div className="mt-10 flex items-center justify-center gap-6 max-md:flex-col">
        <Link
          to={APP_ROUTES.HOME}
          className="rounded-md bg-chw-dark-purple px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-chw-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chw-dark-purple"
        >
          Go back home
        </Link>
        <Link
          to={APP_ROUTES.CONTACT}
          className="text-sm font-semibold text-gray-900 hover:text-chw-dark-purple"
        >
          Contact support
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </NotFound>
  );
}
