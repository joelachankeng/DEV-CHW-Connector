import type { ReactNode } from "react";
import { classNames } from "~/utilities/main";

type NotFoundProps = {
  title?: string;
  subtitle?: string | ReactNode;
  children?: ReactNode;
  status?: string;
  className?: string;
};

export const NotFound = ({
  children,
  title,
  subtitle,
  status,
  className,
}: NotFoundProps) => {
  return (
    <main
      className={classNames(
        "grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8",
        className ?? "",
      )}
    >
      <div className="text-center">
        <p className="text-base font-semibold text-chw-dark-purple">
          {status ? status : "404"}
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          {title ? title : "Page not found"}
        </h1>
        {subtitle && typeof subtitle === "string" ? (
          <p className="mt-6 text-base leading-7 text-[#032525]">
            {subtitle
              ? subtitle
              : "Sorry, we couldn't find the page you're looking for."}
          </p>
        ) : (
          subtitle
        )}
        {children}
      </div>
    </main>
  );
};
