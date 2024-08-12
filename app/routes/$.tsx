import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { APP_CLASSNAMES } from "~/constants";
import { PageController } from "~/controllers/page.control";
import Page from "~/components/Pages/Page";
import type { iGenericError } from "~/models/appContext.model";
import type { iWP_Page } from "~/models/page.model";
import { classNames } from "~/utilities/main";
import { ErrorPageGeneric } from "~/components/Pages/ErrorPage";

type iLoaderData = {
  page: iWP_Page | iGenericError | undefined;
};

export const loader: LoaderFunction = async ({
  request,
}): Promise<ReturnType<typeof json<iLoaderData>>> => {
  const url = new URL(request.url);
  const path = url.pathname
    // Remove the first slash
    .replace(/^\//, "");

  let page: iLoaderData["page"] = undefined;

  const findPage = await PageController.API.getPost(path, "SLUG");
  if (findPage instanceof Error) {
    page = {
      error: findPage.message,
    };
  } else {
    if (findPage !== null) {
      page = findPage;
    }
  }

  return json({ page });
};

export default function NotFound() {
  const { page } = useLoaderData<iLoaderData>();

  if (page === undefined || "error" in page) {
    return <ErrorPageGeneric error={page} dataType="Page" />;
  } 

  return (
    <Page>
      <div className={APP_CLASSNAMES.CONTAINER_FULLWIDTH}>
        <div className={APP_CLASSNAMES.CONTAINER}>
          <div className="max-md:-mx-5 max-md:-mt-5">
            <div
              className={classNames(
                "flex w-full flex-col gap-5 rounded-[10px] border border-solid border-[#E8E0D6] bg-white p-5 transition-all duration-300 ease-in-out",
                "max-md:!border-none max-md:!bg-transparent",
              )}
            >
              <h1 className="mb-4 text-[2.125rem] font-bold leading-9 text-chw-dark-green max-md:text-[1.5rem]">
                {page.title}
              </h1>
              <div
                className={classNames("html-formatted-content")}
                dangerouslySetInnerHTML={{ __html: page.content ?? "" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
